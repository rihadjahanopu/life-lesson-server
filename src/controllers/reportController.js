import LessonReport from '../models/LessonReport.js';
import Lesson from '../models/Lesson.js';

// Report a lesson
export const reportLesson = async (req, res) => {
  try {
    const { lessonId, reason } = req.body;

    if (!lessonId || !reason) {
      return res.status(400).json({ error: 'Lesson ID and reason are required' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const existing = await LessonReport.findOne({
      lessonId,
      reporterUserId: req.user.id,
    });

    if (existing) {
      return res.status(409).json({ error: 'You have already reported this lesson' });
    }

    const report = await LessonReport.create({
      lessonId,
      reporterUserId: req.user.id,
      reporterEmail: req.user.email,
      reason,
    });

    res.status(201).json({ message: 'Lesson reported successfully', report });
  } catch (error) {
    console.error('Report lesson error:', error);
    res.status(500).json({ error: 'Failed to report lesson' });
  }
};

// Get all reports (admin)
export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      LessonReport.find()
        .populate({
          path: 'lessonId',
          select: 'title creatorName category visibility',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LessonReport.countDocuments(),
    ]);

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Delete report (ignore)
export const deleteReport = async (req, res) => {
  try {
    const report = await LessonReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report ignored and deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};
