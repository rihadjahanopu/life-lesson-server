import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import Favorite from '../models/Favorite.js';
import LessonReport from '../models/LessonReport.js';

// Get admin stats
export const getStats = async (req, res) => {
  try {
    const [totalUsers, totalLessons, totalFavorites, totalReports, premiumUsers] =
      await Promise.all([
        User.countDocuments(),
        Lesson.countDocuments(),
        Favorite.countDocuments(),
        LessonReport.countDocuments(),
        User.countDocuments({ isPremium: true }),
      ]);

    const recentLessons = await Lesson.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title creatorName createdAt category');

    res.json({
      stats: {
        totalUsers,
        totalLessons,
        totalFavorites,
        totalReports,
        premiumUsers,
      },
      recentLessons,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email photoURL role isPremium isBlocked blockedUntil createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role / status (Role, Premium, Block states)
export const updateUserRole = async (req, res) => {
  try {
    const { role, isPremium, isBlocked, blockedUntil } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (role !== undefined) user.role = role;
    if (isPremium !== undefined) user.isPremium = isPremium;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    if (blockedUntil !== undefined) user.blockedUntil = blockedUntil;

    await user.save();

    // Revoke active sessions immediately if user is blocked or suspended
    const isCurrentlyBlocked = user.isBlocked || (user.blockedUntil && new Date() < new Date(user.blockedUntil));
    if (isCurrentlyBlocked) {
      try {
        const mongoose = (await import('mongoose')).default;
        await mongoose.connection.db.collection('session').deleteMany({ userId: user._id.toString() });
      } catch (sessErr) {
        console.error('Failed to clear sessions on block:', sessErr);
      }
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        isBlocked: user.isBlocked,
        blockedUntil: user.blockedUntil,
      },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Get all lessons (admin)
export const getAdminLessons = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category, isFeatured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { creatorName: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    const [lessons, total] = await Promise.all([
      Lesson.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Lesson.countDocuments(query),
    ]);

    res.json({
      lessons,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get admin lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
};

// Feature/unfeature lesson
export const toggleFeatureLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    lesson.isFeatured = !lesson.isFeatured;
    await lesson.save();

    res.json({
      message: lesson.isFeatured ? 'Lesson featured' : 'Lesson unfeatured',
      isFeatured: lesson.isFeatured,
    });
  } catch (error) {
    console.error('Toggle feature error:', error);
    res.status(500).json({ error: 'Failed to toggle feature' });
  }
};

// Review lesson
export const reviewLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    lesson.isReviewed = true;
    await lesson.save();

    res.json({ message: 'Lesson reviewed', isReviewed: true });
  } catch (error) {
    console.error('Review lesson error:', error);
    res.status(500).json({ error: 'Failed to review lesson' });
  }
};

// Delete lesson (admin)
export const adminDeleteLesson = async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    await Favorite.deleteMany({ lessonId: req.params.id });
    await LessonReport.deleteMany({ lessonId: req.params.id });
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Admin delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
