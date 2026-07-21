// src/config/app.config.ts
import dotenv from "dotenv";
import { SignOptions } from 'jsonwebtoken';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",

  db: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/football-franchise",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      "fallback_access_secret_change_in_production",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "fallback_refresh_secret_change_in_production",
    accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
      "15m") as SignOptions["expiresIn"],

    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
      "7d") as SignOptions["expiresIn"],
  },

  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.FROM_EMAIL || "noreply@footballfranchise.com",
    fromName: process.env.FROM_NAME || "Football Franchise",
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  },

  aws: {
    region: process.env.AWS_REGION || "ap-south-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    s3Bucket: process.env.AWS_S3_BUCKET || "",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
} as const;
