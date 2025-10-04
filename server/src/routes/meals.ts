import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../app.js';
import { createClerkClient, type User } from '@clerk/backend';
import type { OrganizationMembership, MealSignup } from '@prisma/client';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const router = Router();

const VALID_ORDER_TYPES = ['NONE', 'NORMAL', 'TAKEOUT'] as const;
type MealOrderTypeId = typeof VALID_ORDER_TYPES[number];

function isValidOrderType(value: unknown): value is MealOrderTypeId {
  return typeof value === 'string' && VALID_ORDER_TYPES.includes(value as MealOrderTypeId);
}

// Get meal signups for a specific date or month
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const currentUser = req.user;

    const { date, month, organizationId } = req.query;

    const memberships: OrganizationMembership[] = await prisma.organizationMembership.findMany({
      where: { clerkId: currentUser.id }
    });

    // Determine which organization to use
    let targetOrganizationId = organizationId as string;
    if (!targetOrganizationId) {
      const lastSelectedMembership = memberships.find((m: OrganizationMembership) => m.isLastSelected);
      targetOrganizationId = lastSelectedMembership?.organizationId || '';
    }

    if (!targetOrganizationId) {
      return res.status(400).json({ error: 'No organization selected' });
    }

    // Verify user has access to this organization
    const membership = memberships.find((m: OrganizationMembership) => m.organizationId === targetOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this organization' });
    }

    const whereClause: Record<string, unknown> = {
      organizationId: targetOrganizationId
    };

    // Handle date vs month queries
    if (date && typeof date === 'string') {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      whereClause.date = {
        gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
      };
    } else if (month && typeof month === 'string') {
      const [year, monthNum] = month.split('-').map(Number);
      if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
      }
      whereClause.date = {
        gte: new Date(year, monthNum - 1, 1),
        lt: new Date(year, monthNum, 1)
      };
    } else {
      return res.status(400).json({ error: 'Either date (YYYY-MM-DD) or month (YYYY-MM) parameter is required' });
    }

    const mealSignups: MealSignup[] = await prisma.mealSignup.findMany({
      where: whereClause,
      orderBy: [
        { date: 'asc' },
        { clerkId: 'asc' }
      ]
    });

    if (mealSignups.length === 0) {
      return res.json({ mealSignups: [], date: date || null, month: month || null, organizationId: targetOrganizationId });
    }

    const clerkIds: string[] = Array.from(new Set(mealSignups.map((signup: MealSignup) => signup.clerkId)));
    const clerkUsersResp = await clerk.users.getUserList({ userId: clerkIds });
    const clerkUsers = (clerkUsersResp.data ?? []) as User[];

    const usersMap = new Map(clerkUsers.map((user: User) => [user.id, {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User',
      email: user.emailAddresses[0]?.emailAddress || '',
      avatar: user.imageUrl,
    }]));

    const mealSignupsWithUsers = mealSignups.map(signup => ({
      ...signup,
      user: usersMap.get(signup.clerkId) || { id: signup.clerkId, name: 'Unknown User' }
    }));

    res.json({
      mealSignups: mealSignupsWithUsers,
      date: date || null,
      month: month || null,
      organizationId: targetOrganizationId
    });
  } catch (error) {
    console.error('Get meal signups error:', error);
    res.status(500).json({ error: 'Failed to get meal signups' });
  }
});

// Create or update meal signup for current user
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const currentUser = req.user;

    const { date, breakfast, lunch, dinner, organizationId } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!isValidOrderType(breakfast)) {
      return res.status(400).json({ error: 'Invalid breakfast order type' });
    }
    if (!isValidOrderType(lunch)) {
      return res.status(400).json({ error: 'Invalid lunch order type' });
    }
    if (!isValidOrderType(dinner)) {
      return res.status(400).json({ error: 'Invalid dinner order type' });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const memberships: OrganizationMembership[] = await prisma.organizationMembership.findMany({
      where: { clerkId: currentUser.id }
    });

    let targetOrganizationId = organizationId as string | undefined;
    if (!targetOrganizationId) {
      const lastSelectedMembership = memberships.find((m: OrganizationMembership) => m.isLastSelected);
      targetOrganizationId = lastSelectedMembership?.organizationId;
    }

    if (!targetOrganizationId) {
      return res.status(400).json({ error: 'No organization selected' });
    }

    const membership = memberships.find((m: OrganizationMembership) => m.organizationId === targetOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this organization' });
    }

    const normalizedDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);

    const mealSignup: MealSignup = await prisma.mealSignup.upsert({
      where: {
        clerkId_organizationId_date: {
          clerkId: currentUser.id,
          organizationId: targetOrganizationId,
          date: normalizedDate
        }
      },
      update: {
        breakfastOrderTypeId: breakfast,
        lunchOrderTypeId: lunch,
        dinnerOrderTypeId: dinner
      },
      create: {
        clerkId: currentUser.id,
        organizationId: targetOrganizationId,
        date: normalizedDate,
        breakfastOrderTypeId: breakfast,
        lunchOrderTypeId: lunch,
        dinnerOrderTypeId: dinner
      }
    });

    res.json({
      mealSignup: {
        ...mealSignup,
        user: { id: req.user.id, name: req.user.name, email: req.user.email }
      }
    });
  } catch (error) {
    console.error('Create/update meal signup error:', error);
    res.status(500).json({ error: 'Failed to save meal signup' });
  }
});

router.get('/self/monthly', requireAuth, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const currentUser = req.user;

    const { year, month, organizationId } = req.query;
    const yearNum = Number(year);
    const monthNum = Number(month);
    if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(yearNum, monthNum, 1, 0, 0, 0, 0);

    const memberships: OrganizationMembership[] = await prisma.organizationMembership.findMany({
      where: { clerkId: currentUser.id },
    });

    let targetOrganizationId: string | undefined =
      typeof organizationId === 'string' ? organizationId : undefined;
    if (!targetOrganizationId) {
      const lastSelected = memberships.find((m: OrganizationMembership) => m.isLastSelected);
      targetOrganizationId = lastSelected?.organizationId || memberships[0]?.organizationId;
    }
    if (!targetOrganizationId) {
      return res.status(400).json({ error: 'No organization selected' });
    }
    const membership = memberships.find((m: OrganizationMembership) => m.organizationId === targetOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this organization' });
    }

    const mealSignups: MealSignup[] = await prisma.mealSignup.findMany({
      where: {
        clerkId: currentUser.id,
        organizationId: targetOrganizationId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const dailySignups = mealSignups.map((signup: MealSignup) => ({
      id: signup.id,
      day: signup.date.getDate(),
      breakfast: signup.breakfastOrderTypeId,
      lunch: signup.lunchOrderTypeId,
      dinner: signup.dinnerOrderTypeId,
    }));

    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const finalResult = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNumber = i + 1;
      const existing = dailySignups.find((ds) => ds.day === dayNumber);
      return (
        existing || { id: null, day: dayNumber, breakfast: 'NONE', lunch: 'NONE', dinner: 'NONE' }
      );
    });

    res.json(finalResult);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to get self monthly meal signups' });
  }
});

router.post('/self/bulk', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const currentUser = req.user;

    const { monthlyMealSignup, year, month, organizationId } = req.body;
    if (!Array.isArray(monthlyMealSignup) || monthlyMealSignup.length === 0) {
      return res.status(400).json({ error: 'monthlyMealSignup array is required' });
    }

    const yearNum = Number(year);
    const monthNum = Number(month);
    if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const memberships: OrganizationMembership[] = await prisma.organizationMembership.findMany({
      where: { clerkId: currentUser.id }
    });

    let targetOrganizationId = organizationId as string | undefined;
    if (!targetOrganizationId) {
      const lastSelectedMembership = memberships.find((m: OrganizationMembership) => m.isLastSelected);
      targetOrganizationId = lastSelectedMembership?.organizationId;
    }

    if (!targetOrganizationId) {
      return res.status(400).json({ error: 'No organization selected' });
    }

    const membership = memberships.find((m: OrganizationMembership) => m.organizationId === targetOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this organization' });
    }

    for (const daySignup of monthlyMealSignup) {
      const { breakfast, lunch, dinner } = daySignup;
      if (!isValidOrderType(breakfast) || !isValidOrderType(lunch) || !isValidOrderType(dinner)) {
        return res.status(400).json({ error: 'Invalid order type in monthlyMealSignup' });
      }
    }

    const operations = monthlyMealSignup.map(
      (daySignup: { day: number; breakfast: MealOrderTypeId; lunch: MealOrderTypeId; dinner: MealOrderTypeId }) => {
        const { day, breakfast, lunch, dinner } = daySignup;
        const targetDate = new Date(yearNum, monthNum - 1, day, 0, 0, 0, 0);

        return prisma.mealSignup.upsert({
          where: {
            clerkId_organizationId_date: {
              clerkId: currentUser.id,
              organizationId: targetOrganizationId!,
              date: targetDate
            }
          },
          update: {
            breakfastOrderTypeId: breakfast,
            lunchOrderTypeId: lunch,
            dinnerOrderTypeId: dinner,
          },
          create: {
            clerkId: currentUser.id,
            organizationId: targetOrganizationId!,
            date: targetDate,
            breakfastOrderTypeId: breakfast,
            lunchOrderTypeId: lunch,
            dinnerOrderTypeId: dinner,
          },
        });
      });

    await prisma.$transaction(operations);
    res.json({ message: 'Meal signups updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update meal signups' });
  }
});

export default router;
