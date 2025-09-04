import crypto from 'crypto';
import fetch from 'node-fetch';
import { secret } from '../config/env.js';

class PayPalService {
  constructor() {
    this.baseUrl =
      secret.paypalMode === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    this.clientId = secret.paypalClientId;
    this.clientSecret = secret.paypalClientSecret;
    this.webhookId = secret.paypalWebhookId;

    this.accessToken = null;
    this.tokenExpiry = null;
    this.isConfigured = !!(this.clientId && this.clientSecret);
  }

  // Get OAuth2 access token
  async getAccessToken() {
    if (!this.isConfigured) {
      throw new Error(
        'PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.'
      );
    }

    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString('base64');

      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(
          `PayPal auth failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      // Set expiry time (subtract 5 minutes for safety margin)
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('PayPal getAccessToken error:', error);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  // Make authenticated request to PayPal API
  async makeRequest(endpoint, options = {}) {
    const token = await this.getAccessToken();

    const defaultOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, finalOptions);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `PayPal API error: ${response.status} ${response.statusText} - ${errorData}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('PayPal API request error:', error);
      throw error;
    }
  }

  // Create PayPal order
  async createOrder(
    amount,
    currency = 'USD',
    description = 'Visa Application Payment'
  ) {
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: description,
        },
      ],
      application_context: {
        return_url:
          secret.frontendUrl || 'http://localhost:3000/payment/success',
        cancel_url:
          secret.frontendUrl || 'http://localhost:3000/payment/cancel',
        user_action: 'PAY_NOW',
        brand_name: 'Visa Collect',
      },
    };

    return await this.makeRequest('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Capture PayPal order
  async captureOrder(orderId) {
    return await this.makeRequest(`/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
    });
  }

  // Get order details
  async getOrder(orderId) {
    return await this.makeRequest(`/v2/checkout/orders/${orderId}`, {
      method: 'GET',
    });
  }

  // Refund payment
  async refundPayment(
    captureId,
    amount,
    reason = 'Refund requested by customer'
  ) {
    const refundData = {
      amount: {
        value: amount.toFixed(2),
        currency_code: 'USD',
      },
      reason: reason,
    };

    return await this.makeRequest(`/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  }

  // Verify webhook signature
  async verifyWebhookSignature(webhookBody, signature) {
    if (!this.webhookId) {
      console.warn(
        'PayPal webhook ID not configured - skipping signature verification'
      );
      return true; // Allow webhook in development
    }

    const verificationData = {
      auth_algo: signature.auth_algo,
      cert_url: signature.cert_url,
      transmission_id: signature.transmission_id,
      transmission_sig: signature.transmission_sig,
      transmission_time: signature.transmission_time,
      webhook_id: this.webhookId,
      webhook_event: webhookBody,
    };

    try {
      const response = await this.makeRequest(
        '/v1/notifications/verify-webhook-signature',
        {
          method: 'POST',
          body: JSON.stringify(verificationData),
        }
      );

      return response.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  // Parse webhook event
  parseWebhookEvent(event) {
    const eventType = event.event_type;
    const resource = event.resource;

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        return {
          type: 'PAYMENT_COMPLETED',
          orderId: resource.supplementary_data?.related_ids?.order_id,
          transactionId: resource.id,
          amount: parseFloat(resource.amount?.value || 0),
          currency: resource.amount?.currency_code,
          payerEmail: resource.payee?.email_address,
          status: 'COMPLETED',
        };

      case 'PAYMENT.CAPTURE.DENIED':
        return {
          type: 'PAYMENT_DENIED',
          orderId: resource.supplementary_data?.related_ids?.order_id,
          transactionId: resource.id,
          reason: resource.status_details?.reason,
          status: 'FAILED',
        };

      case 'PAYMENT.CAPTURE.REFUNDED':
        return {
          type: 'PAYMENT_REFUNDED',
          orderId: resource.supplementary_data?.related_ids?.order_id,
          transactionId: resource.id,
          refundAmount: parseFloat(resource.amount?.value || 0),
          status: 'REFUNDED',
        };

      default:
        return {
          type: 'UNKNOWN_EVENT',
          eventType,
          resource,
        };
    }
  }

  // Generate idempotency key
  static generateIdempotencyKey() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Validate currency
  static isValidCurrency(currency) {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
    return validCurrencies.includes(currency.toUpperCase());
  }

  // Validate amount
  static isValidAmount(amount) {
    return typeof amount === 'number' && amount > 0 && amount <= 10000; // Max $10,000
  }
}

// Export singleton instance
const paypalService = new PayPalService();

export default paypalService;
export { PayPalService };
