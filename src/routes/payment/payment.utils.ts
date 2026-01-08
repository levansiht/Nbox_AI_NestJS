import crypto from 'crypto';
import envConfig from 'src/shared/config';

export function generateSePaySignature(data: Record<string, any>): string {
  const sortedKeys = Object.keys(data).sort();

  const signatureString = sortedKeys
    .map((key) => {
      const value = data[key];
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return `${key}=${value}`;
    })
    .filter((item) => item !== null)
    .join('&');

  const signature = crypto.createHmac('sha256', envConfig.SEPAY_SECRET_KEY).update(signatureString).digest('hex');

  return signature;
}

export function generateSePayCheckoutForm(orderData: {
  order_invoice_number: string;
  order_amount: number;
  order_description: string;
  currency: string;
  operation: string;
  success_url: string;
  error_url: string;
  cancel_url: string;
}): string {
  const formData = {
    merchant_id: envConfig.SEPAY_MERCHANT_ID,
    currency: orderData.currency,
    order_invoice_number: orderData.order_invoice_number,
    order_amount: orderData.order_amount,
    operation: orderData.operation,
    order_description: orderData.order_description,
    success_url: orderData.success_url,
    error_url: orderData.error_url,
    cancel_url: orderData.cancel_url,
  };

  // Generate signature
  const signature = generateSePaySignature(formData);

  // Build form HTML with hidden inputs
  const hiddenInputs = Object.entries(formData)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
    .join('\n    ');

  // URL Checkout chính thức từ SePay SDK
  const checkoutUrl = 'https://pay.sepay.vn/checkout/init';

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Đang chuyển hướng đến cổng thanh toán...</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .loading {
            text-align: center;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <p>Đang chuyển hướng đến cổng thanh toán SePay...</p>
    </div>
    <form id="sepay-checkout-form" method="POST" action="${checkoutUrl}">
    ${hiddenInputs}
    <input type="hidden" name="signature" value="${signature}" />
    </form>
    <script>
        // Auto submit when page loads
        window.onload = function() {
            document.getElementById('sepay-checkout-form').submit();
        };
    </script>
</body>
</html>
`;

  return html;
}

/**
 * Verify IPN signature from SePay
 * @param secretKey - Secret key from request header
 * @returns boolean indicating if signature is valid
 */
export function verifyIpnSignature(secretKey: string): boolean {
  return secretKey === envConfig.SEPAY_SECRET_KEY;
}
