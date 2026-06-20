import { Router } from 'express';
import {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  toggleLike,
  getMyLessons,
  getRelatedLessons,
  getFeaturedLessons,
  getTopContributors,
  getMostSavedLessons,
} from '../controllers/lessonController.js';
import { authenticateUser, verifyLessonOwnerOrAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { optionalAuth } from './helpers.js';

const lessonRouter = Router();

// Public routes
lessonRouter.get('/featured', getFeaturedLessons);
lessonRouter.get('/top-contributors', getTopContributors);
lessonRouter.get('/most-saved', getMostSavedLessons);
lessonRouter.get('/', getLessons);
lessonRouter.get('/:id/related', getRelatedLessons);
lessonRouter.get('/:id', optionalAuth, getLessonById);

// Protected routes
lessonRouter.post('/', authenticateUser, upload.single('image'), createLesson);
lessonRouter.patch(
  '/:id',
  authenticateUser,
  verifyLessonOwnerOrAdmin,
  upload.single('image'),
  updateLesson
);
lessonRouter.delete(
  '/:id',
  authenticateUser,
  verifyLessonOwnerOrAdmin,
  deleteLesson
);
lessonRouter.patch('/:id/like', authenticateUser, toggleLike);

// User's lessons
lessonRouter.get('/my/all', authenticateUser, getMyLessons);

export default lessonRouter;
