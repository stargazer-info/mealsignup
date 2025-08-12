import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../app';

const router = Router();

// Create user on registration
router.post('/register', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      console.log('❌ POST /api/auth/register: User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`🔍 POST /api/auth/register: Attempting to register user with clerkId: ${req.user.id}`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: req.user.id }
    });

    if (existingUser) {
      console.log(`⚠️ POST /api/auth/register: User already exists for clerkId: ${req.user.id}`);
      return res.status(200).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        clerkId: req.user.id,
        email: req.user.email,
        name: req.user.name
      }
    });

    console.log(`✅ POST /api/auth/register: User created successfully with id: ${user.id}`);
    res.status(201).json({ user });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target.includes('clerkId')) {
      console.log(`⚠️ POST /api/auth/register: User already exists for clerkId: ${req.user.id}`);
      return res.status(200).json({ message: 'User already exists' });
    }
    console.error('❌ User registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          include: {
            organization: true
          }
        },
        lastSelectedOrganization: true
      }
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          clerkId: req.user.id,
          email: req.user.email,
          name: req.user.name
        },
        include: {
          memberships: {
            include: {
              organization: true
            }
          },
          lastSelectedOrganization: true
        }
      });
    }

    res.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        memberships: user.memberships,
        lastSelectedOrganization: user.lastSelectedOrganization
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, avatar } = req.body;

    // Update user profile: プロフィールの変更のみを行う
    const updatedUser = await prisma.user.update({
      where: { clerkId: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar })
      }
    });

    // 更新後、関連データを含むユーザー情報を取得
    const userWithData = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          include: {
            organization: true
          }
        },
        lastSelectedOrganization: true
      }
    });

    res.json({
      user: {
        id: userWithData!.id,
        clerkId: userWithData!.clerkId,
        email: userWithData!.email,
        name: userWithData!.name,
        avatar: userWithData!.avatar,
        memberships: userWithData!.memberships,
        lastSelectedOrganization: userWithData!.lastSelectedOrganization
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Set last selected organization
router.put('/select-organization/:organizationId', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { organizationId } = req.params;

    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          where: { organizationId }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.memberships.length === 0) {
      return res.status(403).json({ error: 'User is not a member of this organization' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSelectedOrganizationId: organizationId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Select organization error:', error);
    res.status(500).json({ error: 'Failed to select organization' });
  }
});

// Leave organization
router.delete('/leave-organization', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.lastSelectedOrganizationId) {
      return res.status(400).json({ error: 'No organization selected' });
    }

    // Check if user is member of the selected organization
    const membership = user.memberships.find(m => m.organizationId === user.lastSelectedOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User is not a member of the selected organization' });
    }

    // Check how many members are in the organization
    const memberCount = await prisma.organizationMembership.count({
      where: { organizationId: user.lastSelectedOrganizationId }
    });

    // Remove user from organization, delete user's meal signups for that organization, and clear lastSelectedOrganizationId
    await prisma.$transaction(async (tx) => {
      // ① ユーザーのこの組織での食事予約を削除
      await tx.mealSignup.deleteMany({
        where: {
          userId: user.id,
          organizationId: user.lastSelectedOrganizationId!
        }
      });

      // ② ユーザーのメンバーシップを削除
      await tx.organizationMembership.delete({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: user.lastSelectedOrganizationId!
          }
        }
      });

      // ③ ユーザーの lastSelectedOrganizationId をクリア
      await tx.user.update({
        where: { id: user.id },
        data: { lastSelectedOrganizationId: null }
      });

      // ④ この組織のメンバーが最後の場合、組織自体を削除
      if (memberCount === 1) {
        await tx.organization.delete({
          where: { id: user.lastSelectedOrganizationId! }
        });
      }
    });

    res.json({ success: true, organizationDeleted: memberCount === 1 });
  } catch (error) {
    console.error('Leave organization error:', error);
    res.status(500).json({ error: 'Failed to leave organization' });
  }
});

export default router;
