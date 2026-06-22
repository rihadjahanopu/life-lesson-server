import { Router } from 'express';
import upload from '../middleware/upload.js';
import { uploadToCloudinary } from '../services/cloudinary.js';

const uploadRouter = Router();

// POST /api/upload/image
uploadRouter.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const folder = req.query.folder || 'digital-life-lessons';
    const result = await uploadToCloudinary(req.file.buffer, folder);

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Image upload failed' });
  }
});

export default uploadRouter;
