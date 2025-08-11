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
      return res.status(400).json({ error: 'User already exists' });
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
  } catch (error) {
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
        family: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
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
          family: {
            include: {
              members: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          }
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
        family: user.family
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

    const user = await prisma.user.update({
      where: { clerkId: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar })
      },
      include: {
        family: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        family: user.family
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;
