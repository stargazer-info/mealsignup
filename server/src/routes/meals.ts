import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../app';

const router = Router();

// Get meal signups for a specific date
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD format)' });
    }

    // Parse date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Get user's family
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: { family: true }
    });

    if (!user?.family) {
      return res.status(404).json({ error: 'User does not belong to any family' });
    }

    // Get meal signups for the family on the specified date
    const mealSignups = await prisma.mealSignup.findMany({
      where: {
        familyId: user.family.id,
        date: {
          gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
          lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
        }
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
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    res.json({ mealSignups, date: date });
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

    const { date, breakfast, lunch, dinner } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Parse date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Get user's family
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: { family: true }
    });

    if (!user?.family) {
      return res.status(404).json({ error: 'User does not belong to any family' });
    }

    // Create or update meal signup
    const mealSignup = await prisma.mealSignup.upsert({
      where: {
        userId_familyId_date: {
          userId: user.id,
          familyId: user.family.id,
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
        familyId: user.family.id,
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

// Get meal signups for a date range (for calendar view)
router.get('/range', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      return res.status(400).json({ error: 'startDate and endDate parameters are required (YYYY-MM-DD format)' });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Get user's family
    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: { family: true }
    });

    if (!user?.family) {
      return res.status(404).json({ error: 'User does not belong to any family' });
    }

    // Get meal signups for the family in the date range
    const mealSignups = await prisma.mealSignup.findMany({
      where: {
        familyId: user.family.id,
        date: {
          gte: start,
          lte: end
        }
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
      },
      orderBy: [
        { date: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    res.json({ mealSignups, startDate, endDate });
  } catch (error) {
    console.error('Get meal signups range error:', error);
    res.status(500).json({ error: 'Failed to get meal signups' });
  }
});

export default router;
