import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import mongoose from 'mongoose';
import config from '../config/index.js';

// Create a native MongoClient instance for better-auth since it expects a native Db object, not a Mongoose connection object
const client = new mongoose.mongo.MongoClient(config.mongodbUri);
const db = client.db();

const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl?.endsWith('/api/auth') 
    ? config.betterAuthUrl 
    : `${config.betterAuthUrl?.replace(/\/+$/, '')}/api/auth`,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    password: {
      validate: (password) => {
        if (password.length < 6) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[a-z]/.test(password)) return false;
        return true;
      },
    },
  },
  socialProviders: {
    google: {
      clientId: config.google.clientId || '',
      clientSecret: config.google.clientSecret || '',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [config.clientUrl],
});

export default auth;
