# PayPal Webhook Setup Guide

This guide provides step-by-step instructions for setting up PayPal webhooks for your visa application system.

## 📋 Prerequisites

- PayPal Business Account (Sandbox or Production)
- Your application deployed with HTTPS (required for production)
- PayPal webhook endpoint configured in your backend

## 🔧 Webhook Endpoint

Your webhook endpoint should be:

```
https://yourdomain.com/api/v1/payment/paypal/webhook
```

For local development with ngrok:

```
https://abc123.ngrok.io/api/v1/payment/paypal/webhook
```

## 🏖️ Sandbox Setup

### Step 1: Access PayPal Developer Dashboard

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Navigate to your sandbox account
4. Click on "Apps & Credentials"
5. Select your sandbox app or create a new one

### Step 2: Configure Webhooks

1. In your sandbox app, scroll down to "Webhooks"
2. Click "Add Webhook"
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/v1/payment/paypal/webhook
   ```
4. Select the following events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `PAYMENT.CAPTURE.PENDING` (optional)

### Step 3: Get Webhook ID

1. After creating the webhook, copy the "Webhook ID"
2. Add it to your `.env` file:
   ```env
   PAYPAL_WEBHOOK_ID=your_sandbox_webhook_id
   ```

### Step 4: Test Webhook

Use the PayPal webhook simulator or make test payments to verify webhook delivery.

## 🚀 Production Setup

### Step 1: Access PayPal Business Account

1. Go to [PayPal Business](https://www.paypal.com/business)
2. Log in with your business account
3. Navigate to "Account Settings" > "Notifications"
4. Click "Update" next to "Instant Payment Notifications"

### Step 2: Configure IPN/Webhook

1. Enable Instant Payment Notifications
2. Enter your notification URL:
   ```
   https://yourdomain.com/api/v1/payment/paypal/webhook
   ```
3. Save your settings

### Step 3: Alternative - Use PayPal Developer Portal

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Log in with your business account
3. Go to "My Apps & Credentials"
4. Select your production app
5. Configure webhooks as described in sandbox setup

### Step 4: Update Environment Variables

1. Update your `.env` file with production credentials:
   ```env
   PAYPAL_MODE=production
   PAYPAL_CLIENT_ID=your_production_client_id
   PAYPAL_CLIENT_SECRET=your_production_client_secret
   PAYPAL_WEBHOOK_ID=your_production_webhook_id
   ```

## 🔒 Security Considerations

### HTTPS Requirement

- **Production**: Webhooks must use HTTPS
- **Sandbox**: HTTP is allowed for testing

### Webhook Signature Verification

The system automatically verifies webhook signatures using:

- Transmission signature
- Certificate URL
- Transmission ID
- Webhook ID

### IP Whitelisting (Optional)

For additional security, you can whitelist PayPal's IP addresses:

- `173.0.84.0/24`
- `173.0.85.0/24`
- `173.0.86.0/24`

## 🧪 Testing Webhooks

### Local Development

1. **Install ngrok**:

   ```bash
   npm install -g ngrok
   ```

2. **Start your local server**:

   ```bash
   npm run dev
   ```

3. **Expose local server**:

   ```bash
   ngrok http 3000
   ```

4. **Update webhook URL** in PayPal with ngrok URL

### Sandbox Testing

1. **Use PayPal's webhook simulator**:
   - Go to Developer Dashboard > Webhooks
   - Select your webhook
   - Click "Test" next to any event

2. **Make test payments**:
   - Use sandbox buyer/seller accounts
   - Complete payment flow
   - Verify webhook delivery in logs

### Production Testing

1. **Use small amounts**: Test with $1-2 payments
2. **Monitor logs**: Check for webhook delivery
3. **Verify data**: Ensure payment data is correctly processed

## 📊 Webhook Events

### PAYMENT.CAPTURE.COMPLETED

Triggered when a payment is successfully captured.

```json
{
  "id": "WH-1234567890",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "id": "8AC96375WN7079234",
    "amount": {
      "value": "84.00",
      "currency_code": "USD"
    },
    "status": "COMPLETED",
    "supplementary_data": {
      "related_ids": {
        "order_id": "5O190127TN364715T"
      }
    }
  }
}
```

### PAYMENT.CAPTURE.DENIED

Triggered when a payment is denied or fails.

```json
{
  "id": "WH-1234567891",
  "event_type": "PAYMENT.CAPTURE.DENIED",
  "resource": {
    "id": "8AC96375WN7079235",
    "amount": {
      "value": "84.00",
      "currency_code": "USD"
    },
    "status": "DENIED",
    "status_details": {
      "reason": "INSUFFICIENT_FUNDS"
    }
  }
}
```

### PAYMENT.CAPTURE.REFUNDED

Triggered when a payment is refunded.

```json
{
  "id": "WH-1234567892",
  "event_type": "PAYMENT.CAPTURE.REFUNDED",
  "resource": {
    "id": "8AC96375WN7079236",
    "amount": {
      "value": "84.00",
      "currency_code": "USD"
    },
    "status": "REFUNDED"
  }
}
```

## 🔍 Troubleshooting

### Webhook Not Received

1. **Check URL**: Ensure webhook URL is correct and accessible
2. **HTTPS**: Verify HTTPS is working (required for production)
3. **Firewall**: Check if firewall blocks PayPal IPs
4. **Logs**: Check application logs for webhook processing

### Signature Verification Failed

1. **Webhook ID**: Ensure correct webhook ID is configured
2. **Environment**: Verify sandbox/production webhook IDs match
3. **Headers**: Check all required headers are present

### Webhook Delivery Issues

1. **Retry Logic**: PayPal automatically retries failed deliveries
2. **Response Time**: Ensure webhook endpoint responds within 30 seconds
3. **Status Codes**: Return 2xx status codes for successful processing

## 📝 Environment Variables

### Sandbox Configuration

```env
# PayPal Sandbox
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_WEBHOOK_ID=your_sandbox_webhook_id

# Application
FRONTEND_URL=http://localhost:3000
```

### Production Configuration

```env
# PayPal Production
PAYPAL_MODE=production
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret
PAYPAL_WEBHOOK_ID=your_production_webhook_id

# Application
FRONTEND_URL=https://yourdomain.com
```

## 🆘 Support

### Common Issues

**Q: Webhook signature verification fails**
A: Ensure webhook ID matches the one configured in PayPal dashboard

**Q: Webhooks not being delivered**
A: Check HTTPS setup and firewall configuration

**Q: Duplicate webhook events**
A: Implement idempotency using event IDs in your application

### PayPal Resources

- [PayPal Webhooks Documentation](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
- [Webhook Event Types](https://developer.paypal.com/docs/api-basics/notifications/webhooks/event-names/)
- [Webhook Simulator](https://developer.paypal.com/developer/webhooksSimulator)

---

## ✅ Verification Checklist

- [ ] Webhook URL configured in PayPal dashboard
- [ ] HTTPS enabled for production
- [ ] Webhook ID added to environment variables
- [ ] Test webhook delivery with simulator
- [ ] Verify signature verification in logs
- [ ] Test complete payment flow
- [ ] Monitor webhook delivery in production

For additional help, check the [main documentation](../README.md) or [Turkey-specific guide](../turkey.md).
