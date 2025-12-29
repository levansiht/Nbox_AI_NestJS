# 🚀 NBox AI - Hướng Dẫn Deploy Backend

## 📋 Tổng Quan Hệ Thống

### Tech Stack:

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Queue**: Redis + BullMQ
- **Email**: Resend
- **AI**: Google Gemini API
- **Payment**: Sepay + VietQR

---

## 🔧 Các Services Cần Deploy

| Service        | Mô tả            | Lựa chọn đề xuất                 |
| -------------- | ---------------- | -------------------------------- |
| **PostgreSQL** | Database chính   | Supabase (Free) / Neon / Railway |
| **Redis**      | Queue cho BullMQ | Upstash (Free) / Railway         |
| **Backend**    | NestJS API       | Railway / Render / DigitalOcean  |
| **Frontend**   | React App        | ✅ Đã deploy Vercel              |

---

## 💰 Chi Phí Ước Tính (Monthly)

### Option 1: Free Tier (Khuyến nghị cho testing)

| Service    | Provider | Chi phí      | Giới hạn                         |
| ---------- | -------- | ------------ | -------------------------------- |
| PostgreSQL | Supabase | **FREE**     | 500MB, 2 projects                |
| Redis      | Upstash  | **FREE**     | 10K commands/day                 |
| Backend    | Render   | **FREE**     | 750 hrs/month, sleep after 15min |
| Frontend   | Vercel   | **FREE**     | ✅ Đã có                         |
| **TOTAL**  |          | **$0/month** |                                  |

### Option 2: Production (Low traffic)

| Service    | Provider              | Chi phí           | Specs        |
| ---------- | --------------------- | ----------------- | ------------ |
| PostgreSQL | Supabase Pro          | $25/month         | 8GB, backups |
| Redis      | Upstash Pay-as-you-go | ~$1-5/month       | Per request  |
| Backend    | Railway Starter       | $5/month          | Always on    |
| **TOTAL**  |                       | **~$31-35/month** |              |

### Option 3: VPS (Tự quản lý)

| Provider     | Chi phí  | Specs             |
| ------------ | -------- | ----------------- |
| DigitalOcean | $6/month | 1GB RAM, 25GB SSD |
| Vultr        | $6/month | 1GB RAM, 25GB SSD |
| Contabo      | €5/month | 4GB RAM, 50GB SSD |

---

## 📝 Hướng Dẫn Deploy Chi Tiết

### 1️⃣ PostgreSQL - Supabase (Free)

**Bước 1**: Tạo tài khoản tại https://supabase.com

**Bước 2**: Tạo project mới

- Chọn region gần nhất (Singapore)
- Đặt password mạnh cho database

**Bước 3**: Lấy Connection String

- Vào Settings → Database → Connection string
- Copy URI (Transaction mode cho Prisma)

```
postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Bước 4**: Direct connection cho migrations

```
postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

### 2️⃣ Redis - Upstash (Free)

**Bước 1**: Tạo tài khoản tại https://upstash.com

**Bước 2**: Tạo Redis database

- Chọn region: Singapore
- Copy connection details

**Bước 3**: Lấy credentials

```
REDIS_HOST=apn1-xxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxxxxxxx
```

---

### 3️⃣ Backend - Railway (Đề xuất)

**Bước 1**: Tạo tài khoản tại https://railway.app

**Bước 2**: Connect GitHub repo

**Bước 3**: Tạo service mới từ repo

**Bước 4**: Set Environment Variables (xem bên dưới)

**Bước 5**: Deploy settings

```yaml
Build Command: npm run build
Start Command: npm run start:prod
```

---

### 3️⃣ Alternative: Render (Free tier)

**Bước 1**: Tạo tài khoản tại https://render.com

**Bước 2**: New → Web Service → Connect repo

**Bước 3**: Settings:

```yaml
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm run start:prod
```

**⚠️ Lưu ý**: Free tier sẽ sleep sau 15 phút không có request

---

## 🔐 Environment Variables cho Production

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Redis (Upstash) - Cần update code để support
REDIS_HOST="apn1-xxx.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="your_redis_password"

# JWT Secrets (Generate random strings)
ACCESS_TOKEN_SECRET="generate-random-64-char-string"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="generate-another-random-64-char-string"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Admin Account
ADMIN_NAME="admin"
ADMIN_EMAIL="admin@nbox.ai"
ADMIN_PASSWORD="StrongPassword@123"
ADMIN_PHONENUMBER="+84xxxxxxxxx"

# API Keys
SECRET_API_KEY="your-secret-api-key"
PAYMENT_API_KEY="your-sepay-api-key"
GEMINI_API_KEY="AIzaSy..."

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://your-backend-url.com/auth/google/callback"
GOOGLE_CLIENT_REDIRECT_URI="https://your-frontend-url.vercel.app/oauth-google-callback"

# Email (Resend)
RESEND_API_KEY="re_xxx..."

# App
APP_NAME="NBox AI"
OTP_EXPIRES_IN="5m"

# Payment Bank Config
BANK_ID="MB"
BANK_ACCOUNT_NO="your-bank-account"
BANK_ACCOUNT_NAME="YOUR NAME"
PAYMENT_DESCRIPTION_PREFIX="NBOX"

# Port (cho local, production thường không cần)
PORT=3000
```

---

## 🔄 Cập Nhật Code Cho Production

### 1. Update Redis config (app.module.ts)

```typescript
// Thay đổi BullModule config để hỗ trợ Upstash
BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_HOST ? {} : undefined, // Upstash cần TLS
  },
}),
```

### 2. Thêm CORS config (main.ts)

```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'https://your-frontend.vercel.app'],
  credentials: true,
});
```

---

## 📧 Resend Email Setup

### Vấn đề hiện tại:

Resend yêu cầu verify domain để gửi email production.

### Giải pháp tạm thời:

1. **Development**: Dùng `onboarding@resend.dev` làm sender (chỉ gửi được đến email đã verify)
2. **Production**: Cần verify domain

### Verify Domain:

1. Vào https://resend.com/domains
2. Add domain của bạn
3. Thêm DNS records (MX, TXT)
4. Đợi verify (~5-30 phút)

### Alternative - Dùng Gmail SMTP (Free):

```typescript
// Nếu chưa có domain, có thể dùng Nodemailer + Gmail
// Tuy nhiên giới hạn 500 emails/day
```

---

## 🏦 Sepay Webhook Setup

### Production URL:

```
https://your-backend-url.com/payment/receiver
```

### Sepay Dashboard:

1. Vào https://sepay.vn → Cài đặt
2. Thêm Webhook URL
3. Copy API Key → `PAYMENT_API_KEY`

---

## 🚀 Deploy Steps Summary

```bash
# 1. Tạo PostgreSQL (Supabase)
# 2. Tạo Redis (Upstash)
# 3. Update code cho production (Redis TLS, CORS)
# 4. Push code lên GitHub
# 5. Deploy backend (Railway/Render)
# 6. Set Environment Variables
# 7. Run Prisma migrations

# Trên server hoặc local với DATABASE_URL production:
npx prisma migrate deploy
npx prisma db seed

# 8. Test APIs
# 9. Update Frontend CORS và API URL
# 10. Setup Sepay Webhook
```

---

## ⚠️ Checklist Trước Khi Deploy

- [ ] Đổi tất cả secret keys (ACCESS_TOKEN_SECRET, etc.)
- [ ] Đổi ADMIN_PASSWORD
- [ ] Verify Resend domain hoặc dùng alternative
- [ ] Test Google OAuth với production URLs
- [ ] Setup Sepay webhook
- [ ] Update Frontend API base URL
- [ ] Test payment flow end-to-end

---

## 🆘 Troubleshooting

### Lỗi Prisma connection:

```bash
# Đảm bảo dùng đúng connection string
# Pooler URL cho app, Direct URL cho migrations
```

### Lỗi Redis:

```bash
# Upstash cần TLS, đảm bảo config đúng
```

### Lỗi CORS:

```bash
# Thêm frontend URL vào whitelist
```

---

## 📞 Support

Nếu cần hỗ trợ thêm, hãy hỏi về:

1. Chi tiết setup từng service
2. Debug lỗi cụ thể
3. Optimize performance
