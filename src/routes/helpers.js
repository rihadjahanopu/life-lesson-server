import auth from '../auth/index.js';
import User from '../models/User.js';

// Optional authentication - attaches user if logged in, but doesn't block
export const optionalAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (session && session.user) {
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        req.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          role: user.role,
          isPremium: user.isPremium,
        };
      }
    }
  } catch (error) {
    // Silently continue without user
  }
  next();
};
