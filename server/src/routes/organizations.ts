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

    const memberships = await prisma.organizationMembership.findMany({
      where: { clerkId: req.user.id },
      include: {
        organization: true
      }
    });

    console.log(`✅ GET /api/organizations/me: User found with ${memberships.length} organizations`);

    const organizations = memberships.map(membership => ({
      ...membership.organization,
      role: membership.role,
      joinedAt: membership.joinedAt
    }));

    const lastSelectedMembership = memberships.find(m => m.isLastSelected);
    res.json({
      organizations,
      lastSelectedOrganization: lastSelectedMembership?.organization || null
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
    let inviteCode: string;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = nanoid(8).toUpperCase();
      const existingOrganization = await prisma.organization.findUnique({
        where: { inviteCode },
      });
      if (!existingOrganization) {
        isUnique = true;
      }
    }

    // Create organization and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: name.trim(),
          inviteCode: inviteCode!
        }
      });

      // 他の組織の選択を解除
      await tx.organizationMembership.updateMany({
        where: { clerkId: req.user.id },
        data: { isLastSelected: false }
      });

      await tx.organizationMembership.create({
        data: {
          clerkId: req.user.id,
          organizationId: organization.id,
          role: 'ADMIN',
          isLastSelected: true
        }
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
        clerkId_organizationId: {
          clerkId: req.user.id,
          organizationId: organization.id
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // ユーザーが他に選択中の組織を持っているか確認
    const lastSelectedMembership = await prisma.organizationMembership.findFirst({
      where: { clerkId: req.user.id, isLastSelected: true }
    });

    // Add user to organization
    await prisma.organizationMembership.create({
      data: {
        clerkId: req.user.id,
        organizationId: organization.id,
        role: 'MEMBER',
        isLastSelected: !lastSelectedMembership // 他に選択がなければこれを選択済みにする
      }
    });

    res.json({ organization });
  } catch (error) {
    console.error('Join organization error:', error);
    res.status(500).json({ error: 'Failed to join organization' });
  }
});


// Get organization details (for admins)
router.get('/:organizationId', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { organizationId } = req.params;

    const membership = await prisma.organizationMembership.findUnique({
      where: { clerkId_organizationId: { clerkId: req.user.id, organizationId } },
      include: { organization: true }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const organization = membership.organization;

    // メンバー人数を取得
    const memberCount = await prisma.organizationMembership.count({
      where: { organizationId }
    });

    // Get all members if user is admin
    let members = [];
    if (membership.role === 'ADMIN') {
      const allMemberships = await prisma.organizationMembership.findMany({
        where: { organizationId }
      });

      members = allMemberships.map(m => ({
        clerkId: m.clerkId,
        role: m.role,
        joinedAt: m.joinedAt
      }));
    }

    res.json({
      organization,
      userRole: membership.role,
      memberCount,
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
    const membership = await prisma.organizationMembership.findUnique({
      where: { clerkId_organizationId: { clerkId: req.user.id, organizationId } }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const mealSignups = await prisma.mealSignup.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate
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

/**
 * Leave organization – remove membership for current user
 * POST /api/organizations/:organizationId/leave
 */
router.post('/:organizationId/leave', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { organizationId } = req.params;

    const membership = await prisma.organizationMembership.findUnique({
      where: { clerkId_organizationId: { clerkId: req.user.id, organizationId } }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    await prisma.organizationMembership.delete({
      where: { id: membership.id }
    });

    return res.status(204).end();
  } catch (error) {
    console.error('Leave organization error:', error);
    res.status(500).json({ error: 'Failed to leave organization' });
  }
});

/**
 * Delete organization – allowed only if current user is the last member
 * DELETE /api/organizations/:organizationId
 */
router.delete('/:organizationId', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { organizationId } = req.params;

    const memberCount = await prisma.organizationMembership.count({
      where: { organizationId }
    });

    if (memberCount > 1) {
      return res.status(403).json({ error: 'Organization has other members' });
    }

    const membership = await prisma.organizationMembership.findUnique({
      where: { clerkId_organizationId: { clerkId: req.user.id, organizationId } }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.organization.delete({
      where: { id: organizationId }
    });

    return res.status(204).end();
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

export default router;
