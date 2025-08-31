import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../app';

const router = Router();

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const memberships = await prisma.organizationMembership.findMany({
      where: { clerkId: req.user.id },
      include: {
        organization: true
      }
    });

    const lastSelectedMembership = memberships.find(m => m.isLastSelected);
    res.json({
      clerkId: req.user.id,
      email: req.user.email,
      name: req.user.name,
      memberships: memberships,
      lastSelectedOrganization: lastSelectedMembership?.organization || null
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Set last selected organization
router.put('/select-organization/:organizationId', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { organizationId } = req.params as { organizationId: string };

    const membership = await prisma.organizationMembership.findUnique({
      where: { clerkId_organizationId: { clerkId: req.user.id, organizationId } }
    });

    if (!membership) {
      return res.status(403).json({ error: 'User is not a member of this organization' });
    }

    // トランザクションで更新
    await prisma.$transaction([
      // まず全ての組織選択を解除
      prisma.organizationMembership.updateMany({
        where: { clerkId: req.user.id },
        data: { isLastSelected: false }
      }),
      // 次に指定された組織を選択
      prisma.organizationMembership.update({
        where: { clerkId_organizationId: { clerkId: req.user.id, organizationId } },
        data: { isLastSelected: true }
      })
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Select organization error:', error);
    res.status(500).json({ error: 'Failed to select organization' });
  }
});


export default router;
