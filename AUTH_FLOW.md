# 🔐 Authentication API Documentation

> **Backend API URL:** `http://localhost:3000`  
> **Prefix:** `/auth`

## Tổng quan

Hệ thống Auth hỗ trợ:
- Đăng ký/Đăng nhập với Email/Password
- Two-Factor Authentication (2FA)
- Device Tracking & Session Management
- Token Refresh Rotation
- OTP Verification qua Email
- Role-Based Access Control

---

## 1. ĐĂNG KÝ (Registration)

### Step 1: Gửi OTP
`POST /auth/send-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "type": "REGISTER"
}
```

**Response 200:**
```json
{
  "message": "OTP sent successfully."
}
```

**Errors:**
- **422**: Email đã tồn tại

---

### Step 2: Đăng ký với OTP
`POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Nguyễn Văn A",
  "phoneNumber": "0987654321",
  "code": "123456"
}
```

**Response 201:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Nguyễn Văn A",
  "phoneNumber": "0987654321",
  "roleId": 2,
  "createdAt": "2025-12-23T10:00:00.000Z"
}
```

**Errors:**
- **422**: OTP không hợp lệ hoặc hết hạn

---

## 2. ĐĂNG NHẬP (Login)

### Trường hợp 1: Login thông thường
`POST /auth/login`

**Request Headers:**
```
user-agent: Mozilla/5.0 ...
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- **422**: Email không tồn tại hoặc sai mật khẩu

---

### Trường hợp 2: Login với 2FA

Khi user đã bật 2FA, cần thêm `totpCode` hoặc `code`:

**Request (với TOTP):**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "totpCode": "123456"
}
```

**Request (với Email OTP):**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "code": "654321"
}
```

**Errors:**
- **422**: Yêu cầu 2FA code nếu chưa có trong request

---

## 3. LÀM MỚI TOKEN (Refresh)

`POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Lưu ý:** Refresh token cũ sẽ bị xóa (one-time use)

**Errors:**
- **401**: Token đã bị sử dụng hoặc không hợp lệ

---

## 4. ĐĂNG XUẤT (Logout)

`POST /auth/logout`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "message": "Logout successful."
}
```

---

## 5. QUÊN MẬT KHẨU (Forgot Password)

### Step 1: Gửi OTP
`POST /auth/send-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "type": "FORGOT_PASSWORD"
}
```

---

### Step 2: Reset mật khẩu
`POST /auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Response 200:**
```json
{
  "message": "Password has been reset successfully."
}
```

---

## 6. TWO-FACTOR AUTHENTICATION (2FA)

### Bật 2FA
`POST /auth/2fa/setup`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "url": "otpauth://totp/NboxAI:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=NboxAI"
}
```

**Lưu ý:** 
- `secret`: Dùng để backup hoặc nhập manual
- `url`: Dùng để tạo QR code

---

### Tắt 2FA
`POST /auth/2fa/disable`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request (Option A - TOTP):**
```json
{
  "totpCode": "123456"
}
```

**Request (Option B - Email OTP):**
```json
{
  "code": "654321"
}
```

**Response 200:**
```json
{
  "message": "Two-factor authentication has been disabled."
}
```

---

## 7. LẤY THÔNG TIN USER

`GET /auth/me`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Nguyễn Văn A",
  "phoneNumber": "0987654321",
  "roleId": 2,
  "role": {
    "id": 2,
    "name": "CLIENT",
    "description": "Client role"
  },
  "totpSecret": "JBSWY3DPEHPK3PXP",
  "createdAt": "2025-12-23T10:00:00.000Z"
}
```

---

## 8. QUẢN LÝ THIẾT BỊ

`GET /auth/devices`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "devices": [
    {
      "id": 1,
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      "ip": "123.45.67.89",
      "isActive": true,
      "createdAt": "2025-12-23T10:00:00.000Z"
    }
  ]
}
```

---

## JWT TOKEN STRUCTURE

### Access Token (15 phút)
```json
{
  "userId": 123,
  "deviceId": 456,
  "roleId": 2,
  "roleName": "CLIENT",
  "iat": 1703260800,
  "exp": 1703261700
}
```

### Refresh Token (7 ngày)
```json
{
  "userId": 123,
  "iat": 1703260800,
  "exp": 1703865600
}
```

---

## ERROR RESPONSES

**Format:**
```json
{
  "statusCode": 422,
  "message": "Error message",
  "path": "fieldName"
}
```

**Multiple Errors:**
```json
{
  "statusCode": 422,
  "errors": [
    { "message": "Error 1", "path": "field1" },
    { "message": "Error 2", "path": "field2" }
  ]
}
```

---

## STATUS CODES

| Code | Ý nghĩa |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (Token invalid/expired) |
| 403 | Forbidden (Không đủ quyền) |
| 422 | Unprocessable Entity (Business logic error) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## API ENDPOINTS SUMMARY

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/send-otp` | ❌ | Gửi OTP verification |
| POST | `/auth/register` | ❌ | Đăng ký tài khoản |
| POST | `/auth/login` | ❌ | Đăng nhập |
| POST | `/auth/refresh` | ❌ | Làm mới token |
| POST | `/auth/logout` | ❌ | Đăng xuất |
| POST | `/auth/forgot-password` | ❌ | Reset mật khẩu |
| GET | `/auth/me` | ✅ | Lấy thông tin user |
| GET | `/auth/devices` | ✅ | Danh sách thiết bị |
| POST | `/auth/2fa/setup` | ✅ | Bật 2FA |
| POST | `/auth/2fa/disable` | ✅ | Tắt 2FA |

---

## VALIDATION RULES

- **Email:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password:** Min 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
- **OTP/TOTP:** 6 chữ số `/^\d{6}$/`
- **Phone (VN):** `/^(0|\+84)[3-9]\d{8}$/`

---

**Last Updated:** December 23, 2025  
**Version:** 1.0.0
