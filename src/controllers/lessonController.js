import Lesson from '../models/Lesson.js';
import Favorite from '../models/Favorite.js';
import { uploadToCloudinary } from '../services/cloudinary.js';

// Get public lessons with search, filter, sort, pagination
export const getLessons = async (req, res) => {
  try {
    const {
      search = '',
      category,
      emotionalTone,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { visibility: 'public' };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (emotionalTone) {
      query.emotionalTone = emotionalTone;
    }

    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'mostSaved':
        sortOption = { favoritesCount: -1 };
        break;
      case 'mostLiked':
        sortOption = { likesCount: -1 };
        break;
      case 'mostViewed':
        sortOption = { viewsCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    if (search) {
      sortOption = { score: { $meta: 'textScore' }, ...sortOption };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Lesson.countDocuments(query);

    const lessons = await Lesson.find(query)
      .select(search ? { score: { $meta: 'textScore' } } : {})
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
};

// Get single lesson by ID
export const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Increment views
    lesson.viewsCount += 1;
    await lesson.save();

    // Check if user has favorited
    let isFavorited = false;
    let isLiked = false;
    if (req.user) {
      const fav = await Favorite.findOne({
        userId: req.user.id,
        lessonId: lesson._id,
      });
      isFavorited = !!fav;
      isLiked = lesson.likes.some(
        (id) => id.toString() === req.user.id.toString()
      );
    }

    res.json({
      lesson,
      isFavorited,
      isLiked,
    });
  } catch (error) {
    console.error('Get lesson by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
};

// Create lesson
export const createLesson = async (req, res) => {
  try {
    const { title, description, category, emotionalTone, visibility, accessLevel } =
      req.body;

    // Free users can only create free lessons
    if (accessLevel === 'premium' && !req.user.isPremium) {
      return res.status(403).json({
        error: 'Only premium users can create premium lessons',
      });
    }

    let imageUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const lesson = await Lesson.create({
      title,
      description,
      category,
      emotionalTone,
      image: imageUrl,
      visibility: visibility || 'public',
      accessLevel: accessLevel || 'free',
      creatorId: req.user.id,
      creatorName: req.user.name,
      creatorEmail: req.user.email,
      creatorPhoto: req.user.photoURL || '',
    });

    res.status(201).json({ message: 'Lesson created successfully', lesson });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
};

// Update lesson
export const updateLesson = async (req, res) => {
  try {
    const { title, description, category, emotionalTone, visibility, accessLevel } =
      req.body;

    if (accessLevel === 'premium' && !req.user.isPremium) {
      return res.status(403).json({
        error: 'Only premium users can create premium lessons',
      });
    }

    let imageUrl = req.lesson.image;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const updated = await Lesson.findByIdAndUpdate(
      req.params.id,
      {
        title: title || req.lesson.title,
        description: description || req.lesson.description,
        category: category || req.lesson.category,
        emotionalTone: emotionalTone || req.lesson.emotionalTone,
        visibility: visibility || req.lesson.visibility,
        accessLevel: accessLevel || req.lesson.accessLevel,
        image: imageUrl,
      },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Lesson updated successfully', lesson: updated });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
};

// Delete lesson
export const deleteLesson = async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    await Favorite.deleteMany({ lessonId: req.params.id });
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
};

// Toggle like
export const toggleLike = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const userId = req.user.id;
    const likeIndex = lesson.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (likeIndex > -1) {
      lesson.likes.splice(likeIndex, 1);
      lesson.likesCount = Math.max(0, lesson.likesCount - 1);
    } else {
      lesson.likes.push(userId);
      lesson.likesCount += 1;
    }

    await lesson.save();

    res.json({
      message: likeIndex > -1 ? 'Unliked' : 'Liked',
      liked: likeIndex === -1,
      likesCount: lesson.likesCount,
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// Get user's lessons
export const getMyLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ creatorId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ lessons });
  } catch (error) {
    console.error('Get my lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch your lessons' });
  }
};

// Get related lessons
export const getRelatedLessons = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const related = await Lesson.find({
      _id: { $ne: lesson._id },
      category: lesson.category,
      visibility: 'public',
    })
      .limit(4)
      .select('title category emotionalTone image creatorName createdAt favoritesCount');

    res.json({ lessons: related });
  } catch (error) {
    console.error('Get related lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch related lessons' });
  }
};

// Get featured lessons
export const getFeaturedLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({
      isFeatured: true,
      visibility: 'public',
    })
      .limit(6)
      .sort({ createdAt: -1 });
    res.json({ lessons });
  } catch (error) {
    console.error('Get featured lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch featured lessons' });
  }
};

// Get top contributors
export const getTopContributors = async (req, res) => {
  try {
    const { Types } = await import('mongoose');

    const contributors = await Lesson.aggregate([
      { $match: { visibility: 'public' } },
      {
        $group: {
          _id: '$creatorId',
          name: { $first: '$creatorName' },
          lessonCount: { $sum: 1 },
          totalFavorites: { $sum: '$favoritesCount' },
        },
      },
      { $sort: { totalFavorites: -1 } },
      { $limit: 6 },
      // Convert string creatorId to ObjectId for lookup
      {
        $addFields: {
          creatorObjectId: {
            $cond: {
              if: { $eq: [{ $type: '$_id' }, 'string'] },
              then: { $toObjectId: '$_id' },
              else: '$_id',
            },
          },
        },
      },
      // Join with User to get the latest photoURL
      {
        $lookup: {
          from: 'users',
          localField: 'creatorObjectId',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $addFields: {
          photo: {
            $ifNull: [
              { $arrayElemAt: ['$userInfo.photoURL', 0] },
              '',
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          photo: 1,
          lessonCount: 1,
          totalFavorites: 1,
        },
      },
    ]);
    res.json({ contributors });
  } catch (error) {
    console.error('Get top contributors error:', error);
    res.status(500).json({ error: 'Failed to fetch contributors' });
  }
};

// Get most saved lessons
export const getMostSavedLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ visibility: 'public' })
      .sort({ favoritesCount: -1 })
      .limit(6);
    res.json({ lessons });
  } catch (error) {
    console.error('Get most saved lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch most saved lessons' });
  }
};
