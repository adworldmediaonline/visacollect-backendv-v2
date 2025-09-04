#!/usr/bin/env node

/**
 * PayPal Payment Integration Test Script
 *
 * This script tests all PayPal payment endpoints to ensure they work correctly.
 * Run this script after setting up your PayPal credentials in the .env file.
 *
 * Usage:
 *   node scripts/testPayments.js
 *
 * Requirements:
 *   - MongoDB running with visa application data
 *   - PayPal sandbox credentials configured
 *   - Node.js environment
 */

import { readFileSync } from 'fs';
import fetch from 'node-fetch';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
let envConfig = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      envConfig[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.warn('⚠️  Could not load .env file, using environment variables');
}

const BASE_URL = envConfig.PORT
  ? `http://localhost:${envConfig.PORT}`
  : 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_APPLICATION_ID = 'TUR-TEST123'; // Will be created during test

// Test utilities
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName, success = null) {
  const icon = success === null ? '🔄' : success ? '✅' : '❌';
  const color =
    success === null ? colors.blue : success ? colors.green : colors.red;
  log(color, `${icon} ${testName}`);
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { response: null, data: { error: error.message } };
  }
}

async function testHealthCheck() {
  logTest('Testing Health Check', null);
  const { response, data } = await makeRequest('/health');

  if (response && response.ok && data.success) {
    logTest('Testing Health Check', true);
    return true;
  } else {
    logTest('Testing Health Check', false);
    log(colors.red, `   Error: ${data.error || 'Health check failed'}`);
    return false;
  }
}

async function testCreateTurkeyApplication() {
  logTest('Creating Test Turkey Application', null);

  const applicationData = {
    passportCountry: 'United States',
    email: TEST_EMAIL,
    visaType: 'Electronic Visa',
    destination: 'Turkey',
  };

  const { response, data } = await makeRequest('/api/v1/turkey/start', {
    method: 'POST',
    body: JSON.stringify(applicationData),
  });

  if (response && response.ok && data.success) {
    logTest('Creating Test Turkey Application', true);
    log(colors.green, `   Application ID: ${data.data.applicationId}`);
    return data.data.applicationId;
  } else {
    logTest('Creating Test Turkey Application', false);
    log(
      colors.red,
      `   Error: ${data.error?.message || 'Failed to create application'}`
    );
    return null;
  }
}

async function testGetApplication(applicationId) {
  logTest('Getting Application Details', null);

  const { response, data } = await makeRequest(
    `/api/v1/turkey/application/${applicationId}?email=${TEST_EMAIL}`
  );

  if (response && response.ok && data.success) {
    logTest('Getting Application Details', true);
    log(colors.green, `   Status: ${data.data.status}`);
    return data.data;
  } else {
    logTest('Getting Application Details', false);
    log(
      colors.red,
      `   Error: ${data.error?.message || 'Failed to get application'}`
    );
    return null;
  }
}

async function testPayPalCredentials() {
  logTest('Checking PayPal Credentials', null);

  const paypalMode = envConfig.PAYPAL_MODE || process.env.PAYPAL_MODE;
  const clientId = envConfig.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
  const clientSecret =
    envConfig.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    logTest('Checking PayPal Credentials', false);
    log(colors.red, '   PayPal credentials not configured');
    log(
      colors.yellow,
      '   Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env file'
    );
    return false;
  }

  logTest('Checking PayPal Credentials', true);
  log(colors.green, `   Mode: ${paypalMode || 'sandbox'}`);
  return true;
}

async function testCreatePayPalOrder(applicationId) {
  logTest('Creating PayPal Order', null);

  const orderData = {
    applicationId,
    amount: 84,
    currency: 'USD',
    description: 'Test Turkey Visa Application Payment',
  };

  const { response, data } = await makeRequest(
    '/api/v1/payment/paypal/create',
    {
      method: 'POST',
      body: JSON.stringify(orderData),
    }
  );

  if (response && response.ok && data.success) {
    logTest('Creating PayPal Order', true);
    log(colors.green, `   Payment ID: ${data.data.paymentId}`);
    log(colors.green, `   Order ID: ${data.data.orderId}`);
    log(colors.green, `   Approval URL: ${data.data.approvalUrl}`);
    return data.data;
  } else {
    logTest('Creating PayPal Order', false);
    log(
      colors.red,
      `   Error: ${data.error?.message || 'Failed to create PayPal order'}`
    );
    return null;
  }
}

async function testGetPaymentStatus(paymentId) {
  logTest('Getting Payment Status', null);

  const { response, data } = await makeRequest(`/api/v1/payment/${paymentId}`);

  if (response && response.ok && data.success) {
    logTest('Getting Payment Status', true);
    log(colors.green, `   Status: ${data.data.status}`);
    log(colors.green, `   Amount: ${data.data.currency} ${data.data.amount}`);
    return data.data;
  } else {
    logTest('Getting Payment Status', false);
    log(
      colors.red,
      `   Error: ${data.error?.message || 'Failed to get payment status'}`
    );
    return null;
  }
}

async function testPaymentStats() {
  logTest('Getting Payment Statistics', null);

  const { response, data } = await makeRequest('/api/v1/payment/stats/payment');

  if (response && response.ok && data.success) {
    logTest('Getting Payment Statistics', true);
    const stats = data.data;
    log(
      colors.green,
      `   Total Payments: ${Object.values(stats).reduce((sum, stat) => sum + stat.count, 0)}`
    );
    Object.entries(stats).forEach(([status, info]) => {
      log(
        colors.cyan,
        `   ${status}: ${info.count} payments ($${info.totalAmount})`
      );
    });
    return stats;
  } else {
    logTest('Getting Payment Statistics', false);
    log(
      colors.red,
      `   Error: ${data.error?.message || 'Failed to get payment statistics'}`
    );
    return null;
  }
}

async function testWebhookEndpoint() {
  logTest('Testing Webhook Endpoint (simulated)', null);

  // Simulate a PayPal webhook payload
  const webhookData = {
    id: 'WH-1234567890',
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: {
      id: '8AC96375WN7079234',
      amount: { value: '84.00', currency_code: 'USD' },
      status: 'COMPLETED',
      supplementary_data: {
        related_ids: {
          order_id: '5O190127TN364715T',
        },
      },
    },
  };

  const { response, data } = await makeRequest(
    '/api/v1/payment/paypal/webhook',
    {
      method: 'POST',
      body: JSON.stringify(webhookData),
      headers: {
        'Content-Type': 'application/json',
        'paypal-transmission-id': 'test-transmission-id',
        'paypal-transmission-time': new Date().toISOString(),
        'paypal-transmission-sig': 'test-signature',
        'paypal-cert-url':
          'https://api.paypal.com/v1/notifications/certs/test-cert',
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-webhook-id': envConfig.PAYPAL_WEBHOOK_ID || 'test-webhook-id',
      },
    }
  );

  if (response && response.ok && data.success) {
    logTest('Testing Webhook Endpoint (simulated)', true);
    return true;
  } else {
    logTest('Testing Webhook Endpoint (simulated)', false);
    log(
      colors.yellow,
      `   Note: Webhook verification may fail without proper PayPal webhook ID`
    );
    return false;
  }
}

async function runAllTests() {
  log(colors.magenta, '🚀 Starting PayPal Payment Integration Tests\n');

  let passed = 0;
  let total = 0;

  // Test 1: Health Check
  total++;
  if (await testHealthCheck()) passed++;

  // Test 2: PayPal Credentials
  total++;
  if (await testPayPalCredentials()) passed++;

  // Test 3: Create Application
  total++;
  const applicationId = await testCreateTurkeyApplication();
  if (applicationId) passed++;

  if (!applicationId) {
    log(colors.red, '\n❌ Cannot continue tests without a valid application');
    return;
  }

  // Test 4: Get Application
  total++;
  const application = await testGetApplication(applicationId);
  if (application) passed++;

  // Test 5: Create PayPal Order
  total++;
  const paymentData = await testCreatePayPalOrder(applicationId);
  if (paymentData) passed++;

  if (!paymentData) {
    log(
      colors.red,
      '\n❌ Cannot continue payment tests without a valid PayPal order'
    );
    return;
  }

  // Test 6: Get Payment Status
  total++;
  const paymentStatus = await testGetPaymentStatus(paymentData.paymentId);
  if (paymentStatus) passed++;

  // Test 7: Payment Statistics
  total++;
  const stats = await testPaymentStats();
  if (stats) passed++;

  // Test 8: Webhook Endpoint
  total++;
  await testWebhookEndpoint(); // This might fail due to webhook verification

  // Summary
  log(colors.magenta, '\n📊 Test Results:');
  log(colors.cyan, `   Passed: ${passed}/${total} tests`);
  log(colors.yellow, `   Failed: ${total - passed}/${total} tests`);

  if (passed === total) {
    log(
      colors.green,
      '\n🎉 All tests passed! PayPal integration is working correctly.'
    );
  } else if (passed >= total - 1) {
    log(
      colors.yellow,
      '\n⚠️  Most tests passed. Check webhook configuration if webhook test failed.'
    );
  } else {
    log(
      colors.red,
      '\n❌ Some tests failed. Please check your configuration and try again.'
    );
  }

  log(colors.blue, '\n💡 Next Steps:');
  log(
    colors.blue,
    '   1. Complete the application steps (applicant details, documents)'
  );
  log(
    colors.blue,
    '   2. Use the approval URL from create order test to complete payment'
  );
  log(colors.blue, '   3. Test the capture endpoint after payment approval');
  log(colors.blue, '   4. Set up real PayPal webhooks for production use');
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch((error) => {
    log(colors.red, `\n💥 Test script error: ${error.message}`);
    process.exit(1);
  });
}

export { makeRequest, runAllTests };
