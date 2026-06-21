import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import auth from './index.js';
import User from '../models/User.js';

const authRouter = Router();

// ─── Custom endpoints (defined BEFORE catch-all) ───────────────────────────

// Ensure user document exists in our MongoDB (called by frontend after Better Auth sign-up)
authRouter.post('/api/auth/ensure-user', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, email, photoURL } = req.body;

    // Check if user already exists in our DB
    let user = await User.findOne({ email });

    if (!user) {
      // First user becomes admin
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'admin' : 'user';

      user = await User.create({
        name: name || session.user.name,
        email,
        photoURL: photoURL || '',
        role,
        isPremium: false,
      });
    } else {
      // Update existing user data
      user.name = name || user.name;
      if (photoURL) user.photoURL = photoURL;
      await user.save();
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('Ensure user error:', error);
    return res.status(500).json({ error: 'Failed to ensure user' });
  }
});

// Get session — returns our MongoDB user data
authRouter.get('/api/auth/session', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let user = await User.findOne({ email: session.user.email });

    if (user && (user.isBlocked || (user.blockedUntil && new Date() < new Date(user.blockedUntil)))) {
      return res.status(403).json({ error: 'Your account has been blocked.' });
    }

    if (!user) {
      // Auto-create MongoDB user for social logins (since they bypass manual registration)
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'admin' : 'user';

      user = await User.create({
        name: session.user.name,
        email: session.user.email,
        photoURL: session.user.image || '',
        role,
        isPremium: false,
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        isPremium: user.isPremium,
      },
      session: session.session,
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(401).json({ error: 'Not authenticated' });
  }
});

// ─── Better Auth catch-all handler (MUST be last) ──────────────────────────
// Handles: sign-up/email, sign-in/email, sign-out, get-session, social callbacks, etc.
// This handler correctly manages session cookies automatically.
authRouter.all(/^\/api\/auth\/.*/, toNodeHandler(auth));

export default authRouter;
