# Hướng dẫn Cài đặt Backend (macOS)

Đây là tài liệu hướng dẫn các bước để cài đặt và chạy môi trường backend cho dự án trên hệ điều hành macOS.

## 1. Yêu cầu tiên quyết

- **Node.js**: Đảm bảo bạn đã cài đặt Node.js (khuyến nghị phiên bản LTS).
- **Homebrew**: Trình quản lý gói cho macOS. Nếu chưa có, hãy cài đặt từ [brew.sh](https://brew.sh/).

## 2. Cài đặt Cơ sở dữ liệu (PostgreSQL)

### 2.1. Cài đặt PostgreSQL

Sử dụng Homebrew để cài đặt PostgreSQL (phiên bản 14 được sử dụng trong quá trình viết hướng dẫn này).

```bash
brew install postgresql@14
```

### 2.2. Khởi động Dịch vụ PostgreSQL

Để PostgreSQL luôn chạy nền, hãy khởi động nó như một dịch vụ.

```bash
brew services start postgresql@14
```

### 2.3. Cấu hình User và Database

Chúng ta cần tạo một user và database riêng cho dự án.

1.  **Kết nối vào `psql`:**
    Sử dụng username trên máy của bạn để kết nối vào database `postgres` mặc định.

    ```bash
    psql -d postgres -U $(whoami)
    ```

2.  **Chạy các lệnh SQL:**
    Bên trong `psql`, chạy lần lượt các lệnh sau để tạo user `levansy` và database `nboxai`.

    ```sql
    -- Xóa database và user cũ nếu có để tránh xung đột
    DROP DATABASE IF EXISTS nboxai;
    DROP ROLE IF EXISTS levansy;

    -- Tạo user mới với mật khẩu được chỉ định trong .env
    CREATE USER levansy WITH PASSWORD 'Aa123456@';

    -- Cấp quyền cho user có thể tạo database (cần cho Prisma Migrate)
    ALTER USER levansy CREATEDB;

    -- Tạo database và gán quyền sở hữu cho user vừa tạo
    CREATE DATABASE nboxai OWNER levansy;
    ```

3.  Gõ `\q` và nhấn Enter để thoát khỏi `psql`.

## 3. Cài đặt Dự án

### 3.1. Tạo file môi trường `.env`

Tạo một file tên là `.env` ở thư mục gốc của dự án và dán nội dung sau vào:

```env
DATABASE_URL="postgresql://levansy:Aa123456%40@localhost:5432/nboxai?schema=public&connection_limit=10&pool_timeout=20"
ACCESS_TOKEN_SECRET="your_access_token_secret"
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET="your_refresh_token_secret"
REFRESH_TOKEN_EXPIRES_IN=7d
SECRET_API_KEY="your_secret_api_key"

ADMIN_NAME="admin"
ADMIN_PASSWORD="Admin@12345"
ADMIN_EMAIL="admin@example.com"
ADMIN_PHONENUMBER="+1234567890"
```

### 3.2. Cài đặt Dependencies

Cài đặt các package cần thiết cho dự án.

```bash
npm install
```

## 4. Khởi chạy Ứng dụng

### 4.1. Chạy Database Migration

Lệnh này sẽ tạo cấu trúc (bảng, cột...) cho database của bạn dựa trên schema của Prisma.

```bash
npx prisma migrate dev
```

### 4.2. Chèn Dữ liệu Mẫu (Seeding)

Lệnh này sẽ chèn các dữ liệu ban đầu, ví dụ như tạo tài khoản admin.

```bash
npx ts-node prisma/seed.ts
```

### 4.3. Khởi động Server

Chạy server backend ở chế độ development.

```bash
npm run start:dev
```

Sau khi hoàn tất, server sẽ chạy tại địa chỉ `http://localhost:3000`.
