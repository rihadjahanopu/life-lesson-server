import { Router } from 'express';
import {
  toggleFavorite,
  removeFavorite,
  getMyFavorites,
  checkFavorite,
} from '../controllers/favoriteController.js';
import { authenticateUser } from '../middleware/auth.js';

const favoriteRouter = Router();

favoriteRouter.post('/', authenticateUser, toggleFavorite);
favoriteRouter.delete('/:id', authenticateUser, removeFavorite);
favoriteRouter.get('/', authenticateUser, getMyFavorites);
favoriteRouter.get('/check/:lessonId', authenticateUser, checkFavorite);

export default favoriteRouter;
