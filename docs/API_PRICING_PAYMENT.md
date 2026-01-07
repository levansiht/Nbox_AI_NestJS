# API Tính Tiền và Payment - NBox AI

## 📋 Tổng Quan

Hệ thống gồm 3 nhóm API chính:

1. **Wallet API** - Quản lý số dư và lịch sử giao dịch
2. **Payment API** - Nạp tiền vào ví
3. **Gemini AI API** - Sử dụng AI và tự động trừ tiền

---

## 💰 WALLET API

Base URL: `/wallet`

### 1. Lấy Số Dư Ví

**Endpoint:** `GET /wallet/balance`  
**Auth:** Bearer Token (bắt buộc)  
**Mô tả:** Lấy số dư hiện tại của người dùng

**Response:**

```json
{
  "balance": 100000
}
```

---

### 2. Lịch Sử Giao Dịch

**Endpoint:** `GET /wallet/credit-history`  
**Auth:** Bearer Token (bắt buộc)  
**Mô tả:** Xem lịch sử các lần trừ tiền khi dùng AI

**Query Parameters:**

- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng mỗi trang (mặc định: 10)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "userId": 123,
      "action": "generate-images",
      "amount": 5000,
      "description": "Generate Images (Flash Model, 1 ảnh)",
      "createdAt": "2026-01-07T06:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 3. Ước Tính Chi Phí

**Endpoint:** `POST /wallet/estimate-cost`  
**Auth:** Bearer Token (bắt buộc)  
**Mô tả:** Tính trước chi phí cho một hành động AI

**Request Body:**

```json
{
  "action": "generate-images",
  "imageCount": 2,
  "usePro": true,
  "resolution": "4K"
}
```

**Response:**

```json
{
  "action": "generate-images",
  "estimatedCost": 24000,
  "breakdown": {
    "model": "gemini-3-pro-image-preview",
    "costPerImage": 12000,
    "imageCount": 2,
    "resolution": "4K"
  }
}
```

---

## 💳 PAYMENT API

Base URL: `/payment`

### 1. Tạo Yêu Cầu Nạp Tiền

**Endpoint:** `POST /payment/create`  
**Auth:** Bearer Token (bắt buộc)  
**Mô tả:** Tạo mã QR để nạp tiền vào ví

**Request Body:**

```json
{
  "amount": 100000
}
```

**Response:**

```json
{
  "paymentId": "abc123",
  "amount": 100000,
  "bankId": "MB",
  "accountNo": "101106010106",
  "accountName": "LE VAN SY",
  "description": "NBOX abc123",
  "qrCodeUrl": "https://img.vietqr.io/image/MB-101106010106-compact2.png?amount=100000&addInfo=NBOX%20abc123",
  "status": "pending",
  "expiresAt": "2026-01-07T07:00:00.000Z"
}
```

---

### 2. Danh Sách Giao Dịch Nạp Tiền

**Endpoint:** `GET /payment/list`  
**Auth:** Bearer Token (bắt buộc)  
**Mô tả:** Xem lịch sử các lần nạp tiền

**Query Parameters:**

- `page` (optional): Số trang
- `limit` (optional): Số lượng mỗi trang
- `status` (optional): Lọc theo trạng thái (pending, completed, cancelled, failed)

**Response:**

```json
{
  "data": [
    {
      "id": "abc123",
      "amount": 100000,
      "status": "completed",
      "createdAt": "2026-01-07T06:00:00.000Z",
      "completedAt": "2026-01-07T06:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  }
}
```

---

### 3. Chi Tiết Giao Dịch

**Endpoint:** `GET /payment/:paymentId`  
**Auth:** Bearer Token (bắt buộc)  
**Mô tả:** Xem chi tiết một giao dịch nạp tiền

**Response:**

```json
{
  "id": "abc123",
  "userId": 123,
  "amount": 100000,
  "status": "completed",
  "bankId": "MB",
  "accountNo": "101106010106",
  "accountName": "LE VAN SY",
  "description": "NBOX abc123",
  "qrCodeUrl": "...",
  "createdAt": "2026-01-07T06:00:00.000Z",
  "completedAt": "2026-01-07T06:05:00.000Z"
}
```

---

### 4. Hủy Giao Dịch

**Endpoint:** `POST /payment/:paymentId/cancel`  
**Auth:** Bearer Token (bắt buộc)  
**Mô tả:** Hủy giao dịch đang chờ thanh toán

**Response:**

```json
{
  "message": "Payment cancelled successfully"
}
```

---

### 5. Webhook Nhận Thanh Toán (Internal)

**Endpoint:** `POST /payment/receiver`  
**Auth:** Payment API Key (header `x-api-key`)  
**Mô tả:** API cho Sepay gọi khi có giao dịch chuyển khoản thành công

**Request Body:**

```json
{
  "id": "txn_123",
  "gateway": "MB",
  "transactionDate": "2026-01-07 06:05:00",
  "accountNumber": "101106010106",
  "transferType": "in",
  "transferAmount": 100000,
  "description": "NBOX abc123",
  "referenceNumber": "FT26007123456"
}
```

**Response:**

```json
{
  "message": "Payment processed successfully"
}
```

---

## 🎨 GEMINI AI API (Tự động trừ tiền)

Base URL: `/gemini`

Tất cả API dưới đây đều **yêu cầu Bearer Token** và **tự động trừ tiền** trước khi thực thi.

### Bảng Giá Cước

| Model  | Độ phân giải | Giá/ảnh         | Ghi chú                     |
| ------ | ------------ | --------------- | --------------------------- |
| Flash  | Mặc định     | 5,000 VND       | Model nhanh, chất lượng tốt |
| Pro 2K | 2K           | 7,000 VND       | Chất lượng cao              |
| Pro 4K | 4K           | 12,000 VND      | Chất lượng tối đa           |
| Video  | -            | 8,000 VND/video | Tạo video ngắn              |

### Các API Gemini

#### 1. Generate Images

**Endpoint:** `POST /gemini/generate-images`  
**Mô tả:** Tạo ảnh render từ ảnh gốc và prompt  
**Chi phí:** 5,000 - 12,000 VND/ảnh (tùy model)

**Request Body:**

```json
{
  "sourceImage": "base64_string_or_url",
  "prompt": "Modern minimalist living room",
  "renderType": "interior",
  "count": 2,
  "aspectRatio": "16:9",
  "modelConfig": {
    "usePro": true,
    "resolution": "4K"
  }
}
```

---

#### 2. Upscale Image

**Endpoint:** `POST /gemini/upscale`  
**Mô tả:** Nâng cấp độ phân giải ảnh  
**Chi phí:** 5,000 - 12,000 VND

---

#### 3. Edit Image

**Endpoint:** `POST /gemini/edit-image`  
**Mô tả:** Chỉnh sửa ảnh với mask  
**Chi phí:** 5,000 - 12,000 VND

---

#### 4. Generate From Text

**Endpoint:** `POST /gemini/generate-from-text`  
**Mô tả:** Tạo ảnh từ mô tả text  
**Chi phí:** 5,000 - 12,000 VND

---

#### 5. Generate Video

**Endpoint:** `POST /gemini/generate-video`  
**Mô tả:** Tạo video ngắn  
**Chi phí:** 8,000 VND/video

---

#### 6. Virtual Tour

**Endpoint:** `POST /gemini/virtual-tour`  
**Mô tả:** Tạo góc nhìn tour ảo  
**Chi phí:** 5,000 - 12,000 VND

---

#### 7. Mood Images

**Endpoint:** `POST /gemini/mood-images`  
**Mô tả:** Tạo 4 ảnh mood board  
**Chi phí:** 20,000 - 48,000 VND (4 ảnh)

---

#### 8. Merge Furniture

**Endpoint:** `POST /gemini/merge-furniture`  
**Mô tả:** Ghép nội thất vào không gian  
**Chi phí:** 5,000 - 12,000 VND

---

#### 9. Change Material

**Endpoint:** `POST /gemini/change-material`  
**Mô tả:** Thay đổi chất liệu bề mặt  
**Chi phí:** 5,000 - 12,000 VND

---

#### 10. Replace Model

**Endpoint:** `POST /gemini/replace-model`  
**Mô tả:** Thay thế đối tượng trong ảnh  
**Chi phí:** 5,000 - 12,000 VND

---

#### 11. Insert Building

**Endpoint:** `POST /gemini/insert-building`  
**Mô tả:** Chèn tòa nhà vào ảnh  
**Chi phí:** 5,000 - 12,000 VND

---

#### 12. Generate Prompts

**Endpoint:** `POST /gemini/generate-prompts`  
**Mô tả:** Tạo gợi ý prompt từ ảnh  
**Chi phí:** MIỄN PHÍ

---

#### 13. Add Character

**Endpoint:** `POST /gemini/add-character`  
**Mô tả:** Thêm nhân vật vào ảnh  
**Chi phí:** 5,000 - 12,000 VND

---

#### 14. Analyze Floorplan

**Endpoint:** `POST /gemini/analyze-floorplan`  
**Mô tả:** Phân tích mặt bằng  
**Chi phí:** MIỄN PHÍ

---

#### 15. Analyze Masterplan

**Endpoint:** `POST /gemini/analyze-masterplan`  
**Mô tả:** Phân tích quy hoạch tổng thể  
**Chi phí:** MIỄN PHÍ

---

#### 16. Colorize Floorplan

**Endpoint:** `POST /gemini/colorize-floorplan`  
**Mô tả:** Tô màu mặt bằng  
**Chi phí:** 5,000 - 12,000 VND

---

## 🔄 Luồng Hoạt Động

### 1. Nạp Tiền

```
User → POST /payment/create
     → Nhận QR code
     → Chuyển khoản qua ngân hàng
     → Sepay webhook → POST /payment/receiver
     → Cộng tiền vào wallet
```

### 2. Sử dụng AI

```
User → POST /gemini/generate-images
     → Kiểm tra balance
     → Trừ tiền trước (deduct credit)
     → Gọi Gemini API
     → Trả kết quả
     → Lưu log vào credit_history
```

### 3. Xem Lịch Sử

```
User → GET /wallet/credit-history (lịch sử trừ tiền)
User → GET /payment/list (lịch sử nạp tiền)
```

---

## ⚙️ Cấu Hình Cần Thiết

### Environment Variables

```env
# Payment
BANK_ID=MB
BANK_ACCOUNT_NO=101106010106
BANK_ACCOUNT_NAME=LE VAN SY
PAYMENT_DESCRIPTION_PREFIX=NBOX
PAYMENT_API_KEY=your_payment_api_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🛡️ Xử Lý Lỗi

### Không đủ tiền

```json
{
  "statusCode": 400,
  "message": "Insufficient balance. Required: 12000 VND, Available: 5000 VND"
}
```

### Payment hết hạn

```json
{
  "statusCode": 400,
  "message": "Payment has expired"
}
```

---

## 📊 Database Schema

### Wallet

```prisma
model Wallet {
  id        Int      @id @default(autoincrement())
  userId    Int      @unique
  balance   Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### CreditLog

```prisma
model CreditLog {
  id          Int      @id @default(autoincrement())
  userId      Int
  action      String
  amount      Float
  description String
  createdAt   DateTime @default(now())
}
```

### Payment

```prisma
model Payment {
  id           String   @id @default(uuid())
  userId       Int
  amount       Float
  status       String   // pending, completed, cancelled, failed
  description  String
  createdAt    DateTime @default(now())
  completedAt  DateTime?
  expiresAt    DateTime
}
```

---

## 📝 Notes
    
- Tất cả API Gemini đều trừ tiền **trước khi** gọi AI để tránh gian lận
- Webhook payment cần bảo mật bằng `PAYMENT_API_KEY`
- QR code tự động tạo theo chuẩn VietQR
- Payment hết hạn sau 15 phút (có thể cấu hình)

---

**Phiên bản:** 1.0  
**Cập nhật:** 07/01/2026
