import Stripe from 'stripe';
import config from '../config/index.js';

const stripe = new Stripe(config.stripe.secretKey);

export const createCheckoutSession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: config.stripe.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${config.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/payment/cancel`,
      customer_email: req.user.email,
      metadata: {
        userId: req.user.id.toString(),
        email: req.user.email,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId } = session.metadata;

    try {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(userId, { isPremium: true });
      console.log(`User ${userId} upgraded to premium`);
    } catch (error) {
      console.error('Error upgrading user:', error);
    }
  }

  res.json({ received: true });
};

export const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.metadata?.userId) {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(session.metadata.userId, { isPremium: true });
      return res.json({ success: true, isPremium: true });
    }

    return res.json({ success: true, isPremium: false });
  } catch (error) {
    console.error('Verify session error:', error.message);
    res.status(500).json({ error: 'Failed to verify session' });
  }
};

export default stripe;
