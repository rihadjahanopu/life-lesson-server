import Comment from '../models/Comment.js';
import Lesson from '../models/Lesson.js';

// Add comment
export const addComment = async (req, res) => {
  try {
    const { lessonId, text } = req.body;

    if (!lessonId || !text) {
      return res.status(400).json({ error: 'Lesson ID and text are required' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const comment = await Comment.create({
      lessonId,
      userId: req.user.id,
      userName: req.user.name,
      userPhoto: req.user.photoURL || '',
      text,
    });

    lesson.commentsCount += 1;
    await lesson.save();

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Get comments for a lesson
export const getComments = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ lessonId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Comment.countDocuments({ lessonId }),
    ]);

    res.json({
      comments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};
