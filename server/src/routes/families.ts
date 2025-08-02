import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../app';
import { nanoid } from 'nanoid';

const router = Router();

// Create a new family
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Family name is required' });
    }

    // Check if user already belongs to a family
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: { family: true }
    });

    if (existingUser?.family) {
      return res.status(400).json({ error: 'User already belongs to a family' });
    }

    // Generate unique invite code
    const inviteCode = nanoid(8).toUpperCase();

    // Create family and update user
    const family = await prisma.family.create({
      data: {
        name: name.trim(),
        inviteCode,
        members: {
          connect: { clerkId: req.user.id }
        }
      },
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
    });

    res.status(201).json({ family });
  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({ error: 'Failed to create family' });
  }
});

// Join a family using invite code
router.post('/join', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Check if user already belongs to a family
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: { family: true }
    });

    if (existingUser?.family) {
      return res.status(400).json({ error: 'User already belongs to a family' });
    }

    // Find family by invite code
    const family = await prisma.family.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
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
    });

    if (!family) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Add user to family
    await prisma.user.update({
      where: { clerkId: req.user.id },
      data: { familyId: family.id }
    });

    // Return updated family with new member
    const updatedFamily = await prisma.family.findUnique({
      where: { id: family.id },
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
    });

    res.json({ family: updatedFamily });
  } catch (error) {
    console.error('Join family error:', error);
    res.status(500).json({ error: 'Failed to join family' });
  }
});

// Get family details
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
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

    if (!user?.family) {
      return res.status(404).json({ error: 'User does not belong to any family' });
    }

    res.json({ family: user.family });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({ error: 'Failed to get family details' });
  }
});

// Leave family
router.delete('/leave', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.user.id },
      include: { family: true }
    });

    if (!user?.family) {
      return res.status(404).json({ error: 'User does not belong to any family' });
    }

    // Remove user from family
    await prisma.user.update({
      where: { clerkId: req.user.id },
      data: { familyId: null }
    });

    // Check if family is now empty and delete if so
    const remainingMembers = await prisma.user.count({
      where: { familyId: user.family.id }
    });

    if (remainingMembers === 0) {
      await prisma.family.delete({
        where: { id: user.family.id }
      });
    }

    res.json({ message: 'Successfully left family' });
  } catch (error) {
    console.error('Leave family error:', error);
    res.status(500).json({ error: 'Failed to leave family' });
  }
});

export default router;
