import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import User from '../models/User.js';

const userRouter = Router();

// PUT /api/users/profile
userRouter.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { name, photoURL } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    }

    // Find and update the user in DB
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.name = name;
    if (photoURL !== undefined) {
      user.photoURL = photoURL;
    }

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
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
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Helper to parse UserAgent
function parseUserAgent(ua) {
  if (!ua) return 'Unknown Device';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Browser check
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // OS check
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

// Helper to parse session token from cookie header
function getSessionTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  try {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const parts = cookie.split('=');
      const key = parts[0]?.trim();
      const value = parts.slice(1).join('=').trim();
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    return cookies['better-auth.session_token'] || null;
  } catch (e) {
    return null;
  }
}

// GET /api/users/sessions
userRouter.get('/sessions', authenticateUser, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const auth = (await import('../auth/index.js')).default;

    const session = await auth.api.getSession({
      headers: new Headers(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ObjectId } = await import('mongodb');
    const userIds = [session.user.id];
    if (req.user && req.user.id) {
      userIds.push(req.user.id.toString());
    }

    const finalQueryIds = [];
    userIds.forEach((id) => {
      finalQueryIds.push(id);
      try {
        if (ObjectId.isValid(id)) {
          finalQueryIds.push(new ObjectId(id));
        }
      } catch (e) {}
    });

    const sessions = await mongoose.connection.db
      .collection('session')
      .find({ userId: { $in: finalQueryIds } })
      .toArray();

    console.log('DEBUG Better Auth Session:', JSON.stringify(session, null, 2));
    console.log('DEBUG Database Sessions:', JSON.stringify(sessions, null, 2));

    const clientToken = getSessionTokenFromCookie(req.headers.cookie);
    const currentUA = req.headers['user-agent'] || '';
    const currentIP = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';

    const formattedSessions = sessions.map((s) => {
      const sId = (s._id || s.id || '').toString();
      const currentSessionId = (session.session.id || '').toString();
      const sToken = s.token || '';
      
      const isCurrent = sId === currentSessionId || (sToken && clientToken && sToken === clientToken);

      // Fallback for userAgent and ipAddress
      let ua = s.userAgent || '';
      if (isCurrent && !ua) {
        ua = currentUA;
      }

      let ip = s.ipAddress || '';
      if (isCurrent && (!ip || ip === '::1' || ip === '127.0.0.1')) {
        ip = currentIP;
      }

      let deviceInfo = parseUserAgent(ua);
      if (!ua && !isCurrent) {
        deviceInfo = 'Active Session';
      }

      return {
        id: s._id || s.id,
        userAgent: ua,
        deviceInfo: deviceInfo,
        ipAddress: ip || 'Unknown IP',
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: !!isCurrent,
      };
    });

    return res.status(200).json({ sessions: formattedSessions });
  } catch (error) {
    console.error('List sessions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve active sessions' });
  }
});

// DELETE /api/users/sessions/:id
userRouter.delete('/sessions/:id', authenticateUser, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const auth = (await import('../auth/index.js')).default;
    const { ObjectId } = await import('mongodb');

    const session = await auth.api.getSession({
      headers: new Headers(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessionId = req.params.id;

    // Try ObjectId or raw string matches
    let queryId = sessionId;
    try {
      if (ObjectId.isValid(sessionId)) {
        queryId = new ObjectId(sessionId);
      }
    } catch (e) {
      // ignore
    }

    const userIds = [session.user.id];
    if (req.user && req.user.id) {
      userIds.push(req.user.id.toString());
    }

    const finalQueryIds = [];
    userIds.forEach((id) => {
      finalQueryIds.push(id);
      try {
        if (ObjectId.isValid(id)) {
          finalQueryIds.push(new ObjectId(id));
        }
      } catch (e) {}
    });

    const dbSession = await mongoose.connection.db
      .collection('session')
      .findOne({ 
        $or: [
          { _id: sessionId },
          { id: sessionId },
          { _id: queryId }
        ],
        userId: { $in: finalQueryIds }
      });

    if (!dbSession) {
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    // Delete session from DB
    await mongoose.connection.db
      .collection('session')
      .deleteOne({ _id: dbSession._id });

    return res.status(200).json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    return res.status(500).json({ error: 'Failed to revoke session' });
  }
});

// DELETE /api/users/sessions
userRouter.delete('/sessions', authenticateUser, async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const auth = (await import('../auth/index.js')).default;
    const { ObjectId } = await import('mongodb');

    const session = await auth.api.getSession({
      headers: new Headers(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userIds = [session.user.id];
    if (req.user && req.user.id) {
      userIds.push(req.user.id.toString());
    }

    const finalQueryIds = [];
    userIds.forEach((id) => {
      finalQueryIds.push(id);
      try {
        if (ObjectId.isValid(id)) {
          finalQueryIds.push(new ObjectId(id));
        }
      } catch (e) {}
    });

    const currentSessionId = session.session.id;
    let currentQueryId = currentSessionId;
    try {
      if (ObjectId.isValid(currentSessionId)) {
        currentQueryId = new ObjectId(currentSessionId);
      }
    } catch (e) {}

    await mongoose.connection.db
      .collection('session')
      .deleteMany({
        userId: { $in: finalQueryIds },
        $nor: [
          { _id: currentSessionId },
          { id: currentSessionId },
          { _id: currentQueryId }
        ]
      });

    return res.status(200).json({ message: 'All other sessions revoked successfully' });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

export default userRouter;
