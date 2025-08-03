import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Test endpoint without authentication
router.get('/public', (req, res) => {
  res.json({ 
    message: 'Public endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint with authentication
router.get('/protected', requireAuth, (req, res) => {
  res.json({ 
    message: 'Protected endpoint working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

router.get('/clerk-config', (req, res) => {
  res.json({
    hasClerkKey: !!process.env.CLERK_SECRET_KEY,
    keyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 10) + '...'
  });
});

export default router;
