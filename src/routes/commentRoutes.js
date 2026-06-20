import { Router } from 'express';
import { addComment, getComments } from '../controllers/commentController.js';
import { authenticateUser } from '../middleware/auth.js';

const commentRouter = Router();

commentRouter.post('/', authenticateUser, addComment);
commentRouter.get('/:lessonId', getComments);

export default commentRouter;
