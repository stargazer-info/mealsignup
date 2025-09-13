import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../app.js'

const router = Router()

/**
 * Update displayName in Clerk public_metadata
 */
router.patch('/display-name', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    let { displayName } = (req.body ?? {}) as { displayName?: string }
    if (typeof displayName !== 'string') {
      return res.status(400).json({ error: 'displayName must be a string' })
    }

    // Sanitize: remove control chars/newlines, trim, limit length
    displayName = displayName.replace(/[\p{C}\r\n]+/gu, '').trim()
    if (!displayName) return res.status(400).json({ error: 'displayName is required' })
    if (displayName.length > 50) displayName = displayName.slice(0, 50)

    // DB（user_profiles）に表示名を保存（ソースオブトゥルースはDB）
    await prisma.userProfile.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, displayName },
      update: { displayName },
    })

    return res.json({ ok: true, displayName })
  } catch (e) {
    console.error('Failed to update displayName', e)
    return res.status(500).json({ error: 'Failed to update displayName' })
  }
})

export default router
