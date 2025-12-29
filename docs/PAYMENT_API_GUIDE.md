# Hướng Dẫn Tích Hợp Payment API

## Tổng Quan

Hệ thống payment cho phép người dùng nạp tiền vào ví thông qua chuyển khoản ngân hàng với VietQR.

## Flow Thanh Toán

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAYMENT FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User nhập số tiền          2. Server tạo Payment Order       │
│  ┌─────────────────┐          ┌─────────────────────────┐       │
│  │ amount: 500000  │ ──────▶  │ Payment {               │       │
│  │ gateway: BANK   │          │   id: 123               │       │
│  └─────────────────┘          │   status: PENDING       │       │
│                               │   amount: 500000        │       │
│                               │ }                       │       │
│                               └───────────┬─────────────┘       │
│                                           │                     │
│  3. Server trả về QR Code                 ▼                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ {                                                       │     │
│  │   paymentId: 123,                                       │     │
│  │   qrCodeUrl: "https://img.vietqr.io/...",              │     │
│  │   bankInfo: {                                           │     │
│  │     bankId: "MB",                                       │     │
│  │     accountNo: "123456789",                            │     │
│  │     accountName: "NGUYEN VAN A",                       │     │
│  │     transferContent: "NBOX123"   <-- Payment ID        │     │
│  │   }                                                     │     │
│  │ }                                                       │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  4. User quét QR & chuyển tiền  5. Webhook từ Sepay             │
│  ┌─────────────────┐          ┌─────────────────────────┐       │
│  │ [QR CODE]       │          │ POST /payment/receiver  │       │
│  │ Scan to pay     │ ──────▶  │ content: "NBOX123"     │       │
│  │ 500,000 VND     │  Bank    │ transferAmount: 500000  │       │
│  └─────────────────┘          └───────────┬─────────────┘       │
│                                           │                     │
│  6. Server xử lý webhook                  ▼                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ - Parse paymentId từ content (NBOX123 → 123)           │     │
│  │ - Cập nhật Payment status → SUCCESS                     │     │
│  │ - Cộng tiền vào Wallet của user                        │     │
│  │ - Tạo TopUp record                                      │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  7. User kiểm tra status                                        │
│  ┌─────────────────┐          ┌─────────────────────────┐       │
│  │ GET /payment/123│ ──────▶  │ { status: "SUCCESS" }   │       │
│  └─────────────────┘          └─────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Cấu Hình Môi Trường

Thêm vào file `.env`:

```env
# Payment Bank Config
BANK_ID=MB                    # Mã ngân hàng (MB, VCB, TCB, ACB, BIDV, etc.)
BANK_ACCOUNT_NO=123456789     # Số tài khoản ngân hàng
BANK_ACCOUNT_NAME=NGUYEN VAN A # Tên chủ tài khoản (KHÔNG DẤU, IN HOA)
PAYMENT_DESCRIPTION_PREFIX=NBOX # Prefix cho nội dung chuyển khoản
```

### Danh sách mã ngân hàng (BANK_ID):

| Mã   | Ngân hàng   |
| ---- | ----------- |
| MB   | MB Bank     |
| VCB  | Vietcombank |
| TCB  | Techcombank |
| ACB  | ACB         |
| BIDV | BIDV        |
| VPB  | VPBank      |
| TPB  | TPBank      |
| VIB  | VIB         |
| STB  | Sacombank   |
| MSB  | MSB         |

## API Endpoints

### 1. Tạo Payment Order

**Endpoint:** `POST /payment/create`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": 500000, // Số tiền (VND) - Min: 10,000, Max: 100,000,000
  "gateway": "BANK_TRANSFER" // Optional, mặc định: BANK_TRANSFER
}
```

**Response (200 OK):**

```json
{
  "paymentId": 123,
  "amount": 500000,
  "status": "PENDING",
  "qrCodeUrl": "https://img.vietqr.io/image/MB-123456789-compact2.png?amount=500000&addInfo=NBOX123&accountName=NGUYEN%20VAN%20A",
  "bankInfo": {
    "bankId": "MB",
    "accountNo": "123456789",
    "accountName": "NGUYEN VAN A",
    "transferContent": "NBOX123"
  },
  "expiresAt": "2024-12-29T14:30:00.000Z"
}
```

### 2. Lấy Danh Sách Payments

**Endpoint:** `GET /payment/list`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | number | No | Trang (default: 1) |
| limit | number | No | Số lượng/trang (default: 10) |
| status | string | No | Filter theo status: PENDING, SUCCESS, FAILED, CANCELLED |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 123,
      "amount": 500000,
      "status": "SUCCESS",
      "gateway": "BANK_TRANSFER",
      "transferContent": "NBOX123",
      "createdAt": "2024-12-29T14:00:00.000Z",
      "updatedAt": "2024-12-29T14:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3. Lấy Chi Tiết Payment

**Endpoint:** `GET /payment/:paymentId`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "id": 123,
  "amount": 500000,
  "status": "PENDING",
  "gateway": "BANK_TRANSFER",
  "transferContent": "NBOX123",
  "createdAt": "2024-12-29T14:00:00.000Z",
  "updatedAt": "2024-12-29T14:00:00.000Z"
}
```

### 4. Hủy Payment

**Endpoint:** `POST /payment/:paymentId/cancel`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "message": "Payment cancelled successfully"
}
```

### 5. Webhook Receiver (Cho Sepay/Payment Gateway)

**Endpoint:** `POST /payment/receiver`

**Headers:**

```
Authorization: Apikey <PAYMENT_API_KEY>
Content-Type: application/json
```

**Request Body (từ Sepay):**

```json
{
  "id": 12345,
  "gateway": "MB",
  "transactionDate": "2024-12-29 14:05:30",
  "accountNumber": "123456789",
  "code": null,
  "content": "NBOX123 chuyen tien",
  "transferType": "in",
  "transferAmount": 500000,
  "accumulated": 1500000,
  "subAccount": null,
  "referenceCode": "FT24364XXXXX",
  "description": "NBOX123 chuyen tien"
}
```

**Response (200 OK):**

```json
{
  "message": "Payment completed successfully"
}
```

## Tích Hợp Frontend

### React/Vue Example

```typescript
// 1. Tạo payment và hiển thị QR
async function createPayment(amount: number) {
  const response = await fetch('/api/payment/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });

  const data = await response.json();

  // Hiển thị QR code
  return {
    qrCodeUrl: data.qrCodeUrl, // Hiển thị dạng <img src={qrCodeUrl} />
    transferContent: data.bankInfo.transferContent,
    paymentId: data.paymentId,
  };
}

// 2. Polling để check status
async function pollPaymentStatus(paymentId: number) {
  const checkStatus = async () => {
    const response = await fetch(`/api/payment/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    return data.status;
  };

  // Poll mỗi 5 giây trong 30 phút
  for (let i = 0; i < 360; i++) {
    const status = await checkStatus();
    if (status === 'SUCCESS') {
      return { success: true };
    }
    if (status === 'CANCELLED' || status === 'FAILED') {
      return { success: false, status };
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return { success: false, status: 'TIMEOUT' };
}
```

### Hiển Thị QR Code

```html
<!-- Sử dụng trực tiếp URL từ API -->
<img
  src="https://img.vietqr.io/image/MB-123456789-compact2.png?amount=500000&addInfo=NBOX123&accountName=NGUYEN%20VAN%20A"
  alt="QR Payment"
  style="width: 300px; height: 300px;"
/>

<!-- Hoặc với React -->
<img src="{paymentData.qrCodeUrl}" alt="QR Payment" />
```

## Tích Hợp Sepay Webhook

### Bước 1: Đăng ký Sepay

1. Truy cập https://my.sepay.vn
2. Đăng ký tài khoản và liên kết ngân hàng

### Bước 2: Cấu hình Webhook

1. Vào Settings > Webhook
2. Thêm webhook URL: `https://your-domain.com/payment/receiver`
3. Thêm API Key vào header

### Bước 3: Test Webhook

```bash
# Test webhook với cURL
curl -X POST https://your-domain.com/payment/receiver \
  -H "Authorization: Apikey YOUR_PAYMENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "gateway": "MB",
    "transactionDate": "2024-12-29 14:00:00",
    "accountNumber": "123456789",
    "code": null,
    "content": "NBOX1",
    "transferType": "in",
    "transferAmount": 500000,
    "accumulated": 500000,
    "subAccount": null,
    "referenceCode": "FT24364TEST",
    "description": "Test payment"
  }'
```

## Lưu Ý Quan Trọng

1. **Nội dung chuyển khoản**: User PHẢI chuyển khoản với đúng nội dung `NBOX{paymentId}` để hệ thống nhận diện được payment.

2. **Số tiền**: Hệ thống cho phép số tiền chuyển >= số tiền đơn hàng (trường hợp user chuyển thừa).

3. **Thời gian hết hạn**: Payment sẽ có thời gian hết hạn (mặc định 30 phút), sau đó user cần tạo payment mới.

4. **Security**:
   - API `/payment/receiver` được bảo vệ bởi `PaymentAPIKey`
   - Các API khác yêu cầu Bearer token
   - User chỉ có thể xem/hủy payment của chính mình

5. **Idempotency**: Webhook có thể được gọi nhiều lần với cùng một giao dịch, hệ thống sẽ xử lý đúng (không cộng tiền trùng).
