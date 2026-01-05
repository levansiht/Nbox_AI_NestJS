# 🔐 Authentication API Documentation

> **Backend API URL:** `http://localhost:3000`  
> **Prefix:** `/auth`

## Tổng quan

Hệ thống Auth hỗ trợ:
- Đăng ký/Đăng nhập với Email/Password
- OTP Verification qua Email
- Quên mật khẩu (Forgot Password)
- Token Refresh Rotation

**⚠️ Lưu ý quan trọng:** Tất cả các API của Gemini đều yêu cầu đăng nhập (Bearer Token). User phải login thành công trước khi sử dụng các dịch vụ AI.

---

## 1. ĐĂNG KÝ (Registration)

### Step 1: Gửi OTP
`POST /auth/otp`

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
  "confirmPassword": "SecurePass123!",
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
- **422**: Email đã tồn tại
- **422**: Passwords do not match

---

## 2. ĐĂNG NHẬP (Login)

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
- **422**: Email not found
- **422**: Invalid password

---

## 3. LÀM MỚI TOKEN (Refresh)

`POST /auth/refresh-token`

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
- **401**: Refresh token has been used hoặc không hợp lệ

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
`POST /auth/otp`

**Request:**
```json
{
  "email": "user@example.com",
  "type": "FORGOT_PASSWORD"
}
```

**Response 200:**
```json
{
  "message": "OTP sent successfully."
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
  "newPassword": "NewSecurePass123!",
  "confirmNewPassword": "NewSecurePass123!"
}
```

**Response 200:**
```json
{
  "message": "Password has been reset successfully."
}
```

**Errors:**
- **422**: Invalid verification code
- **422**: Verification code has expired
- **422**: Passwords do not match

---

## 6. SỬ DỤNG DỊCH VỤ GEMINI (AI Services)

> ⚠️ **Yêu cầu xác thực:** Tất cả các endpoint của Gemini đều yêu cầu Bearer Token

**Headers cho mọi request Gemini:**
```
Authorization: Bearer {accessToken}
```

**Ví dụ request:**
```bash
curl -X POST http://localhost:3000/gemini/generate-images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"sourceImage": "base64...", "prompt": "modern interior"}'
```

**Lỗi khi không có token:**
- **401**: Unauthorized - Token không hợp lệ hoặc không có

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
| POST | `/auth/otp` | ❌ | Gửi OTP verification |
| POST | `/auth/register` | ❌ | Đăng ký tài khoản |
| POST | `/auth/login` | ❌ | Đăng nhập |
| POST | `/auth/refresh-token` | ❌ | Làm mới token |
| POST | `/auth/logout` | ❌ | Đăng xuất |
| POST | `/auth/forgot-password` | ❌ | Reset mật khẩu |

### Gemini API (Yêu cầu Auth ✅)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/gemini/generate-images` | Tạo ảnh từ ảnh gốc |
| POST | `/gemini/upscale` | Upscale ảnh |
| POST | `/gemini/edit-image` | Chỉnh sửa ảnh |
| POST | `/gemini/generate-from-text` | Tạo ảnh từ text |
| ... | ... | Các endpoint khác |

---

## VALIDATION RULES

- **Email:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password:** Min 8 ký tự, max 100 ký tự
- **OTP:** 6 chữ số `/^\d{6}$/`
- **Phone (VN):** `/^(0|\+84)[3-9]\d{8}$/`

---

## FRONTEND IMPLEMENTATION FLOW

### 1. Registration Flow
```
[Nhập Email] → [Gửi OTP] → [Nhập OTP + Thông tin] → [Đăng ký] → [Chuyển đến Login]
```

### 2. Login Flow
```
[Nhập Email/Password] → [Login] → [Lưu Tokens] → [Redirect to App]
```

### 3. Token Management
```javascript
// Lưu tokens sau khi login
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Sử dụng token cho API calls
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
};

// Auto refresh khi token hết hạn
// Khi nhận 401, gọi /auth/refresh-token với refreshToken
// Lưu tokens mới và retry request
```

### 4. Forgot Password Flow
```
[Nhập Email] → [Gửi OTP] → [Nhập OTP + Mật khẩu mới] → [Reset] → [Chuyển đến Login]
```

---

**Last Updated:** January 5, 2026  
**Version:** 2.0.0
