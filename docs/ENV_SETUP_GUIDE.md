# 📋 NBox AI - Environment Variables Guide

## 🎯 Tổng Quan Stack

| Service      | Provider   | Chi phí  |
| ------------ | ---------- | -------- |
| **Database** | Supabase   | FREE     |
| **Backend**  | Railway    | FREE/$5  |
| **Frontend** | Vercel     | FREE ✅  |
| **Email**    | Gmail SMTP | FREE     |
| **Payment**  | Sepay      | FREE/50K |

---

## 📁 File .env Template

```env
#==========================================
# DATABASE - Supabase
#==========================================
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

#==========================================
# REDIS - Upstash (Optional, cho BullMQ)
#==========================================
REDIS_HOST="apn1-xxx.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"

#==========================================
# JWT AUTHENTICATION
#==========================================
ACCESS_TOKEN_SECRET="generate-random-64-char-string-here"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="generate-another-random-64-char-string"
REFRESH_TOKEN_EXPIRES_IN="7d"

#==========================================
# ADMIN ACCOUNT (Seed data)
#==========================================
ADMIN_NAME="admin"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="StrongPassword@123"
ADMIN_PHONENUMBER="+84xxxxxxxxx"

#==========================================
# API KEYS
#==========================================
SECRET_API_KEY="your-internal-secret-api-key"

#==========================================
# GOOGLE OAUTH
#==========================================
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_REDIRECT_URI="https://your-backend.railway.app/auth/google/callback"
GOOGLE_CLIENT_REDIRECT_URI="https://your-frontend.vercel.app/oauth-google-callback"

#==========================================
# EMAIL - Gmail SMTP
#==========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="NBox AI <your-gmail@gmail.com>"

# Giữ lại cho compatibility (có thể để trống)
RESEND_API_KEY=""

#==========================================
# GEMINI AI
#==========================================
GEMINI_API_KEY="AIzaSyxxxx"

#==========================================
# PAYMENT - Sepay
#==========================================
PAYMENT_API_KEY="your-sepay-api-key"
BANK_ID="MB"
BANK_ACCOUNT_NO="your-bank-account-number"
BANK_ACCOUNT_NAME="YOUR FULL NAME"
PAYMENT_DESCRIPTION_PREFIX="NBOX"

#==========================================
# APP CONFIG
#==========================================
APP_NAME="NBox AI"
OTP_EXPIRES_IN="5m"
PORT="3000"
```

---

## 🔧 Chi Tiết Từng Chức Năng

### 1️⃣ Database (Supabase)

**ENV cần thiết:**

```env
DATABASE_URL="postgresql://..."
```

**Cách lấy:**

1. Vào https://supabase.com → Tạo project
2. Settings → Database → Connection string → URI
3. Chọn **Transaction mode** (port 6543)

**Lưu ý:**

- Password cần URL encode nếu có ký tự đặc biệt (`@` → `%40`)
- Thêm `?pgbouncer=true` cho connection pooling

---

### 2️⃣ Authentication (JWT)

**ENV cần thiết:**

```env
ACCESS_TOKEN_SECRET="random-string"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="another-random-string"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

**Cách tạo secret:**

```bash
# Chạy trong terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 3️⃣ Google OAuth

**ENV cần thiết:**

```env
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_REDIRECT_URI="https://backend-url/auth/google/callback"
GOOGLE_CLIENT_REDIRECT_URI="https://frontend-url/oauth-google-callback"
```

**Cách lấy:**

1. Vào https://console.cloud.google.com
2. APIs & Services → Credentials
3. Create Credentials → OAuth 2.0 Client ID
4. Authorized redirect URIs: Thêm URL backend của bạn

**Cập nhật cho Production:**

- Thêm `https://your-backend.railway.app/auth/google/callback` vào Authorized redirect URIs

---

### 4️⃣ Email - Gmail SMTP (FREE)

**ENV cần thiết:**

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
SMTP_FROM="NBox AI <your-gmail@gmail.com>"
```

**Cách tạo App Password:**

1. Vào https://myaccount.google.com/security
2. Bật **2-Step Verification** (bắt buộc)
3. Vào **App passwords** (cuối trang)
4. Select app: **Mail**, Select device: **Other** → Đặt tên "NBox AI"
5. Copy 16-character password → `SMTP_PASSWORD`

**Giới hạn:**

- 500 emails/day
- Phù hợp cho testing và small scale

**⚠️ Cần update code** - Xem phần "Code Changes" bên dưới

---

### 5️⃣ Gemini AI

**ENV cần thiết:**

```env
GEMINI_API_KEY="AIzaSyxxxx"
```

**Cách lấy:**

1. Vào https://aistudio.google.com/apikey
2. Create API Key
3. Copy key

**Lưu ý:**

- Free tier: Có rate limit
- Paid tier: Cần enable billing trong Google Cloud

---

### 6️⃣ Payment - Sepay

**ENV cần thiết:**

```env
PAYMENT_API_KEY="your-sepay-api-key"
BANK_ID="MB"
BANK_ACCOUNT_NO="101106010106"
BANK_ACCOUNT_NAME="LE VAN SY"
PAYMENT_DESCRIPTION_PREFIX="NBOX"
```

**Các bước setup:**

#### Bước 1: Đăng ký Sepay

1. Vào https://sepay.vn
2. Đăng ký tài khoản
3. Xác thực số điện thoại

#### Bước 2: Liên kết ngân hàng

1. Vào **Quản lý tài khoản** → **Thêm tài khoản**
2. Chọn ngân hàng (MB Bank)
3. Nhập số tài khoản
4. Xác thực qua SMS

#### Bước 3: Lấy API Key

1. Vào **Cài đặt** → **Webhook & API**
2. Copy **API Key**

#### Bước 4: Cấu hình Webhook

1. Thêm Webhook URL: `https://your-backend.railway.app/payment/receiver`
2. Method: POST
3. Lưu lại

#### Bước 5: Test thật

1. Deploy backend lên Railway trước
2. Tạo payment qua API: `POST /payment/create`
3. Quét QR và chuyển khoản thật (số tiền nhỏ: 10,000đ)
4. Kiểm tra webhook có nhận được không
5. Kiểm tra balance wallet có tăng không

**Test flow:**

```bash
# 1. Tạo payment
curl -X POST https://your-backend.railway.app/payment/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}'

# 2. Lấy QR URL từ response, quét và chuyển khoản thật

# 3. Kiểm tra status
curl https://your-backend.railway.app/payment/{paymentId} \
  -H "Authorization: Bearer {token}"

# 4. Kiểm tra wallet
curl https://your-backend.railway.app/wallet/balance \
  -H "Authorization: Bearer {token}"
```

---

### 7️⃣ Redis - Upstash (Optional)

**ENV cần thiết:**

```env
REDIS_HOST="apn1-xxx.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="xxx"
```

**Khi nào cần:**

- Nếu dùng BullMQ cho background jobs
- Nếu không dùng queue, có thể bỏ qua

**Cách lấy:**

1. Vào https://upstash.com
2. Create Database → Redis
3. Copy connection details

---

## 🔄 Code Changes Cần Thiết

### 1. Thêm Gmail SMTP support

**Cập nhật `src/shared/config.ts`:**

```typescript
const configSchema = z.object({
  // ... existing fields

  // Email - Gmail SMTP
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Resend (optional, backward compatible)
  RESEND_API_KEY: z.string().optional(),
});
```

**Cập nhật `src/shared/services/email.service.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import envConfig from '../config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: envConfig.SMTP_HOST,
      port: parseInt(envConfig.SMTP_PORT),
      secure: false,
      auth: {
        user: envConfig.SMTP_USER,
        pass: envConfig.SMTP_PASSWORD,
      },
    });
  }

  async sendOTP(to: string, otp: string) {
    await this.transporter.sendMail({
      from: envConfig.SMTP_FROM || envConfig.SMTP_USER,
      to,
      subject: `[${envConfig.APP_NAME}] Mã xác thực OTP`,
      html: `
        <h2>Mã xác thực của bạn</h2>
        <p>Mã OTP: <strong>${otp}</strong></p>
        <p>Mã này sẽ hết hạn sau 5 phút.</p>
      `,
    });
  }

  async sendVerificationEmail(to: string, code: string) {
    await this.transporter.sendMail({
      from: envConfig.SMTP_FROM || envConfig.SMTP_USER,
      to,
      subject: `[${envConfig.APP_NAME}] Xác thực email`,
      html: `
        <h2>Xác thực email của bạn</h2>
        <p>Mã xác thực: <strong>${code}</strong></p>
        <p>Mã này sẽ hết hạn sau 5 phút.</p>
      `,
    });
  }
}
```

**Cài đặt nodemailer:**

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### 2. Update Redis config cho Upstash

**Cập nhật `src/app.module.ts`:**

```typescript
BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined,
  },
}),
```

### 3. Thêm CORS cho production

**Cập nhật `src/main.ts`:**

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL, // Thêm env này
  ].filter(Boolean),
  credentials: true,
});
```

---

## 📝 Checklist Deploy

### Database (Supabase)

- [ ] Tạo project Supabase
- [ ] Copy DATABASE_URL
- [ ] Chạy `npx prisma migrate deploy`
- [ ] Chạy `npx prisma db seed`

### Backend (Railway)

- [ ] Connect GitHub repo
- [ ] Set tất cả ENV variables
- [ ] Deploy thành công
- [ ] Test API health check

### Email (Gmail)

- [ ] Bật 2FA cho Gmail
- [ ] Tạo App Password
- [ ] Update code email service
- [ ] Test gửi OTP

### Payment (Sepay)

- [ ] Đăng ký Sepay
- [ ] Liên kết ngân hàng
- [ ] Lấy API Key
- [ ] Cấu hình Webhook URL
- [ ] Test chuyển khoản thật

### Google OAuth

- [ ] Update Authorized redirect URIs
- [ ] Test login flow

### Frontend (Vercel)

- [ ] Update API base URL
- [ ] Update Google OAuth callback URL
- [ ] Test full flow

---

## 🆘 Troubleshooting

### Email không gửi được

```
Error: Invalid login
```

→ Kiểm tra App Password, đảm bảo 2FA đã bật

### Payment webhook không nhận

→ Kiểm tra URL webhook đúng chưa
→ Kiểm tra PAYMENT_API_KEY đúng chưa
→ Xem logs Railway

### Database connection failed

```
Error: Can't reach database server
```

→ Kiểm tra DATABASE_URL format
→ Đảm bảo dùng port 6543 (pooler)

---

## 📞 Quick Commands

```bash
# Generate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test database connection
npx prisma db pull

# Deploy migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Build production
npm run build

# Start production
npm run start:prod
```
