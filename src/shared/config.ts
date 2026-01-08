import z from 'zod';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({
  path: '.env',
});

if (!fs.existsSync(path.resolve('.env'))) {
  console.log('.env file not found! Please create one based on the .env.example file.');
  process.exit(1);
}

const configSchema = z.object({
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  SECRET_API_KEY: z.string(),
  ADMIN_NAME: z.string(),
  ADMIN_EMAIL: z.string(),
  ADMIN_PASSWORD: z.string(),
  ADMIN_PHONENUMBER: z.string(),
  OTP_EXPIRES_IN: z.string(),

  // Email - Gmail SMTP (primary)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Resend (fallback/optional)
  RESEND_API_KEY: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_CLIENT_REDIRECT_URI: z.string(),
  APP_NAME: z.string().default('NBox AI'),
  GEMINI_API_KEY: z.string(),

  // SePay Payment Gateway
  SEPAY_MERCHANT_ID: z.string(),
  SEPAY_SECRET_KEY: z.string(),
  SEPAY_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  SEPAY_SUCCESS_URL: z.string(),
  SEPAY_ERROR_URL: z.string(),
  SEPAY_CANCEL_URL: z.string(),

});

const configServer = configSchema.safeParse(process.env);

if (!configServer.success) {
  console.error('❌ Invalid environment variables:', configServer.error.format());
  process.exit(1);
}

const envConfig = configServer.data;

export default envConfig;
