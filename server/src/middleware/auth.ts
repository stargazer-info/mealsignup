import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use getAuth from @clerk/express to get the authenticated user
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    if (!clerkUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user info to request
    req.user = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username || 'Unknown User'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return next(); // Continue without user
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    
    if (clerkUser) {
      req.user = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || 'Unknown User'
      };
    }

    next();
  } catch (error) {
    // Log error but continue without user
    console.error('Optional auth error:', error);
    next();
  }
};
