import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import config from './src/config/index.js';
import connectDB from './src/database/connect.js';
import authRouter from './src/auth/routes.js';
import lessonRouter from './src/routes/lessonRoutes.js';
import favoriteRouter from './src/routes/favoriteRoutes.js';
import commentRouter from './src/routes/commentRoutes.js';
import reportRouter from './src/routes/reportRoutes.js';
import adminRouter from './src/routes/adminRoutes.js';
import { paymentRouter, handleWebhook } from './src/routes/paymentRoutes.js';
import uploadRouter from './src/routes/uploadRoutes.js';
import userRouter from './src/routes/userRoutes.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

const app = express();

// Trust proxy is needed for secure cookies behind reverse proxies (like Vercel/Render)
app.set('trust proxy', 1);

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use(authRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/comments', commentRouter);
app.use('/api/reports', reportRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/users', userRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Digital Life Lessons API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  
  // Only listen to port if not in a serverless environment (like Vercel)
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  }
};

startServer();

export default app;
