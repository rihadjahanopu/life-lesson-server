import auth from '../auth/index.js';
import User from '../models/User.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      // Auto-create MongoDB user if it doesn't exist (syncs with Better Auth social login)
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

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been permanently blocked by the admin.' });
    }

    if (user.blockedUntil && new Date() < new Date(user.blockedUntil)) {
      return res.status(403).json({ 
        error: `Your account has been temporarily blocked until ${new Date(user.blockedUntil).toLocaleString()}.` 
      });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      role: user.role,
      isPremium: user.isPremium,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

export const verifyAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const verifyPremium = async (req, res, next) => {
  if (!req.user || !req.user.isPremium) {
    return res.status(403).json({ error: 'Premium access required' });
  }
  next();
};

export const verifyLessonOwnerOrAdmin = async (req, res, next) => {
  try {
    const Lesson = (await import('../models/Lesson.js')).default;
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const isOwner = lesson.creatorId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }

    req.lesson = lesson;
    next();
  } catch (error) {
    console.error('Owner verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
};
