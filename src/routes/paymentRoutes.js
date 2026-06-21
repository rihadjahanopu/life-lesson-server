import { Router } from 'express';
import { createCheckoutSession, handleWebhook } from '../stripe/paymentController.js';
import { authenticateUser } from '../middleware/auth.js';
import config from '../config/index.js';

const paymentRouter = Router();

// Endpoint for client to get Stripe Publishable Key
paymentRouter.get('/config', (req, res) => {
  res.json({ publishableKey: config.stripe.publishableKey });
});

// Webhook must be before express.json() — handled in server.js
paymentRouter.post('/create-checkout-session', authenticateUser, createCheckoutSession);

export { paymentRouter, handleWebhook };
