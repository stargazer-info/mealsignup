console.log('🔧 Organizations router loaded');
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../app';
import { nanoid } from 'nanoid';

const router = Router();

// Get user's organizations
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      console.log('❌ GET /api/organizations/me: User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`🔍 GET /api/organizations/me: Looking for user with clerkId: ${req.user.id}`);

    // Get user (must exist from registration)
    const user = await prisma.user.findUnique({
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
      console.log(`❌ GET /api/organizations/me: User not found in database for clerkId: ${req.user.id}`);
      return res.status(404).json({ error: 'User not found. Please complete registration.' });
    }

    console.log(`✅ GET /api/organizations/me: User found with ${user.memberships.length} organizations`);

    const organizations = user.memberships.map(membership => ({
      ...membership.organization,
      role: membership.role,
      joinedAt: membership.joinedAt
    }));

    res.json({ 
      organizations,
      lastSelectedOrganization: user.lastSelectedOrganization
    });
  } catch (error) {
    console.error('❌ Get organizations error:', error);
    res.status(500).json({ error: 'Failed to get organizations' });
  }
});

// Create a new organization
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate unique invite code
    const inviteCode = nanoid(8).toUpperCase();

    // Get user (must exist from registration)
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please complete registration.' });
    }

    // Create organization and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: name.trim(),
          inviteCode
        }
      });

      await tx.organizationMembership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'ADMIN'
        }
      });

      // Set as last selected organization
      await tx.user.update({
        where: { id: user.id },
        data: { lastSelectedOrganizationId: organization.id }
      });

      return organization;
    });

    res.status(201).json({ organization: result });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Join organization using invite code
router.post('/join', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Get user (must exist from registration)
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please complete registration.' });
    }

    // Find organization by invite code
    const organization = await prisma.organization.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if user is already a member
    const existingMembership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // Add user to organization
    await prisma.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'MEMBER'
      }
    });

    // Set as last selected organization if user has no current selection
    if (!user.lastSelectedOrganizationId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSelectedOrganizationId: organization.id }
      });
    }

    res.json({ organization });
  } catch (error) {
    console.error('Join organization error:', error);
    res.status(500).json({ error: 'Failed to join organization' });
  }
});

// Set last selected organization
router.put('/select/:organizationId', requireAuth, async (req, res) => {
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

// Get organization details (for admins)
router.get('/:organizationId', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { organizationId } = req.params;

    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          where: { organizationId },
          include: { organization: true }
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const membership = user.memberships[0];
    const organization = membership.organization;

    // Get all members if user is admin
    let members = [];
    if (membership.role === 'ADMIN') {
      const allMemberships = await prisma.organizationMembership.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      members = allMemberships.map(m => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt
      }));
    }

    res.json({
      organization,
      userRole: membership.role,
      members: membership.role === 'ADMIN' ? members : []
    });
  } catch (error) {
    console.error('Get organization details error:', error);
    res.status(500).json({ error: 'Failed to get organization details' });
  }
});

// Get monthly meal summary for organization
router.get('/:organizationId/monthly-summary', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { organizationId } = req.params;
    const { year, month } = req.query;
    
    const currentDate = new Date();
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    // endDate: 最終日（23:59:59 で含めるため翌月の1日の前を指定）
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Verify user is member of organization
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          where: { organizationId }
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const mealSignups = await prisma.mealSignup.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // 今月の日数分の日別データを作成 (デフォルトは予約数 0)
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const dailyData = Array.from({ length: lastDay }, (_, idx) => ({
      day: idx + 1,
      breakfast: 0,
      lunch: 0,
      dinner: 0
    }));

    // 各日の予約数を更新（各登録が true ならカウントをインクリメント）
    mealSignups.forEach(signup => {
      const signupDate = new Date(signup.date);
      const day = signupDate.getDate();
      if (signup.breakfast) dailyData[day - 1].breakfast += 1;
      if (signup.lunch) dailyData[day - 1].lunch += 1;
      if (signup.dinner) dailyData[day - 1].dinner += 1;
    });

    res.json({ year: targetYear, month: targetMonth, dailyData });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ error: 'Failed to get monthly summary' });
  }
});

export default router;
