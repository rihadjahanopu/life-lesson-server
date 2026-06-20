import { Router } from 'express';
import { createCheckoutSession, handleWebhook } from '../stripe/paymentController.js';
import { authenticateUser } from '../middleware/auth.js';

const paymentRouter = Router();

// Webhook must be before express.json() — handled in server.js
paymentRouter.post('/create-checkout-session', authenticateUser, createCheckoutSession);

export { paymentRouter, handleWebhook };
