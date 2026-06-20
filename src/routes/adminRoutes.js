import { Router } from 'express';
import {
  getStats,
  getUsers,
  updateUserRole,
  getAdminLessons,
  toggleFeatureLesson,
  reviewLesson,
  adminDeleteLesson,
  deleteUser,
} from '../controllers/adminController.js';
import { authenticateUser, verifyAdmin } from '../middleware/auth.js';

const adminRouter = Router();

adminRouter.use(authenticateUser, verifyAdmin);

adminRouter.get('/stats', getStats);
adminRouter.get('/users', getUsers);
adminRouter.patch('/users/:id', updateUserRole);
adminRouter.delete('/users/:id', deleteUser);
adminRouter.get('/lessons', getAdminLessons);
adminRouter.patch('/lessons/:id/feature', toggleFeatureLesson);
adminRouter.patch('/lessons/:id/review', reviewLesson);
adminRouter.delete('/lessons/:id', adminDeleteLesson);

export default adminRouter;
