import Favorite from '../models/Favorite.js';
import Lesson from '../models/Lesson.js';

// Toggle favorite
export const toggleFavorite = async (req, res) => {
  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({ error: 'Lesson ID is required' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const existing = await Favorite.findOne({
      userId: req.user.id,
      lessonId,
    });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      lesson.favoritesCount = Math.max(0, lesson.favoritesCount - 1);
      await lesson.save();
      return res.json({ message: 'Removed from favorites', favorited: false });
    }

    await Favorite.create({
      userId: req.user.id,
      lessonId,
    });
    lesson.favoritesCount += 1;
    await lesson.save();

    res.json({ message: 'Added to favorites', favorited: true });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

// Remove favorite by ID
export const removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await Lesson.findByIdAndUpdate(favorite.lessonId, {
      $inc: { favoritesCount: -1 },
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

// Get user's favorites
export const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate({
        path: 'lessonId',
        select:
          'title description category emotionalTone image visibility accessLevel favoritesCount likesCount createdAt creatorName creatorPhoto',
      })
      .sort({ savedAt: -1 });

    const validFavorites = favorites.filter((f) => f.lessonId !== null);

    res.json({ favorites: validFavorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

// Check if lesson is favorited
export const checkFavorite = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const favorite = await Favorite.findOne({
      userId: req.user.id,
      lessonId,
    });
    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
};
