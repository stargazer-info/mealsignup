import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../app';

const router = Router();

// Get meal signups for a specific date or month
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { date, month, organizationId } = req.query;

    // Get user and determine organization
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          include: { organization: true }
        },
        lastSelectedOrganization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine which organization to use
    let targetOrganizationId = organizationId as string;
    if (!targetOrganizationId) {
      targetOrganizationId = user.lastSelectedOrganizationId || '';
    }

    // Verify user has access to this organization
    const membership = user.memberships.find(m => m.organizationId === targetOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this organization' });
    }

    let whereClause: any = {
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

    const mealSignups = await prisma.mealSignup.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    res.json({ 
      mealSignups, 
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

    const { date, breakfast, lunch, dinner, organizationId } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Parse date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Get user and determine organization
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          include: { organization: true }
        },
        lastSelectedOrganization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine which organization to use
    let targetOrganizationId = organizationId;
    if (!targetOrganizationId) {
      targetOrganizationId = user.lastSelectedOrganizationId;
    }

    if (!targetOrganizationId) {
      return res.status(400).json({ error: 'No organization selected' });
    }

    // Verify user has access to this organization
    const membership = user.memberships.find(m => m.organizationId === targetOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this organization' });
    }

    // Create or update meal signup
    const mealSignup = await prisma.mealSignup.upsert({
      where: {
        userId_organizationId_date: {
          userId: user.id,
          organizationId: targetOrganizationId,
          date: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
        }
      },
      update: {
        breakfast: Boolean(breakfast),
        lunch: Boolean(lunch),
        dinner: Boolean(dinner)
      },
      create: {
        userId: user.id,
        organizationId: targetOrganizationId,
        date: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        breakfast: Boolean(breakfast),
        lunch: Boolean(lunch),
        dinner: Boolean(dinner)
      },
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

    res.json({ mealSignup });
  } catch (error) {
    console.error('Create/update meal signup error:', error);
    res.status(500).json({ error: 'Failed to save meal signup' });
  }
});

// Bulk update meal signups for multiple dates
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { dates, breakfast, lunch, dinner, organizationId } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required' });
    }

    // Get user and determine organization
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          include: { organization: true }
        },
        lastSelectedOrganization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine which organization to use
    let targetOrganizationId = organizationId;
    if (!targetOrganizationId) {
      targetOrganizationId = user.lastSelectedOrganizationId;
    }

    if (!targetOrganizationId) {
      return res.status(400).json({ error: 'No organization selected' });
    }

    // Verify user has access to this organization
    const membership = user.memberships.find(m => m.organizationId === targetOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this organization' });
    }

    // Bulk upsert meal signups
    const operations = dates.map(dateStr => {
      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }

      return prisma.mealSignup.upsert({
        where: {
          userId_organizationId_date: {
            userId: user.id,
            organizationId: targetOrganizationId,
            date: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
          }
        },
        update: {
          ...(breakfast !== undefined && { breakfast: Boolean(breakfast) }),
          ...(lunch !== undefined && { lunch: Boolean(lunch) }),
          ...(dinner !== undefined && { dinner: Boolean(dinner) })
        },
        create: {
          userId: user.id,
          organizationId: targetOrganizationId,
          date: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
          breakfast: Boolean(breakfast),
          lunch: Boolean(lunch),
          dinner: Boolean(dinner)
        }
      });
    });

    const results = await prisma.$transaction(operations);

    res.json({ 
      message: `Updated ${results.length} meal signups`,
      count: results.length
    });
  } catch (error) {
    console.error('Bulk update meal signups error:', error);
    res.status(500).json({ error: 'Failed to bulk update meal signups' });
  }
});

// GET /api/meals/self/monthly?year=2025&month=8
router.get('/self/monthly', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { year, month } = req.query;
    const yearNum = Number(year);
    const monthNum = Number(month);
    if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);
    
    const mealSignups = await prisma.mealSignup.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    // マッピング：各レコードの日付から「日」を抽出
    const dailySignups = mealSignups.map(signup => ({
      day: signup.date.getDate(),
      breakfast: signup.breakfast,
      lunch: signup.lunch,
      dinner: signup.dinner,
    }));
    
    // 存在しない日があれば初期状態で埋める
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const finalResult = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNumber = i + 1;
      const existing = dailySignups.find(ds => ds.day === dayNumber);
      return existing || { day: dayNumber, breakfast: false, lunch: false, dinner: false };
    });
    
    res.json(finalResult);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get self monthly meal signups' });
  }
});

// POST /api/meals/self/bulk
// リクエストボディ例:
// { monthlyMealSignup: [{ day: 1, breakfast: true, lunch: false, dinner: true }, ...], year: 2025, month: 8 }
router.post('/self/bulk', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { monthlyMealSignup, year, month, organizationId } = req.body;
    if (!Array.isArray(monthlyMealSignup) || monthlyMealSignup.length === 0) {
      return res.status(400).json({ error: 'monthlyMealSignup array is required' });
    }
    
    const yearNum = Number(year);
    const monthNum = Number(month);
    if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    // Get user and determine organization
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: {
        memberships: {
          include: { organization: true }
        },
        lastSelectedOrganization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine which organization to use
    let targetOrganizationId = organizationId;
    if (!targetOrganizationId) {
      targetOrganizationId = user.lastSelectedOrganizationId;
    }

    if (!targetOrganizationId) {
      return res.status(400).json({ error: 'No organization selected' });
    }

    // Verify user has access to this organization
    const membership = user.memberships.find(m => m.organizationId === targetOrganizationId);
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this organization' });
    }
    
    const operations = monthlyMealSignup.map(daySignup => {
      const { day, breakfast, lunch, dinner } = daySignup;
      const targetDate = new Date(yearNum, monthNum - 1, day);
      return prisma.mealSignup.upsert({
        where: {
          userId_organizationId_date: {
            userId: user.id,
            organizationId: targetOrganizationId,
            date: targetDate,
          },
        },
        update: {
          breakfast: Boolean(breakfast),
          lunch: Boolean(lunch),
          dinner: Boolean(dinner),
        },
        create: {
          userId: user.id,
          organizationId: targetOrganizationId,
          date: targetDate,
          breakfast: Boolean(breakfast),
          lunch: Boolean(lunch),
          dinner: Boolean(dinner),
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
