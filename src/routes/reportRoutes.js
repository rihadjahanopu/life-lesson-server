import { Router } from 'express';
import {
  reportLesson,
  getReports,
  deleteReport,
} from '../controllers/reportController.js';
import { authenticateUser, verifyAdmin } from '../middleware/auth.js';

const reportRouter = Router();

reportRouter.post('/', authenticateUser, reportLesson);
reportRouter.get('/', authenticateUser, verifyAdmin, getReports);
reportRouter.delete('/:id', authenticateUser, verifyAdmin, deleteReport);

export default reportRouter;
