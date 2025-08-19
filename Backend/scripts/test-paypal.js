/*
  Simple PayPal health-check script
  - Loads env from Backend/.env
  - Creates a small $1.00 USD order via PayPal SDK
  - Prints order id and status, exits 0 on success
*/

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const paypal = require('@paypal/checkout-server-sdk');
const { client: paypalClient } = require('../services/paypalClient');

async function main() {
  try {
    const env = (process.env.PAYPAL_ENVIRONMENT || 'sandbox').toLowerCase();
    const hasId = !!process.env.PAYPAL_CLIENT_ID;
    const hasSecret = !!process.env.PAYPAL_CLIENT_SECRET;

    console.log('[PayPal Test] Environment:', env);
    console.log('[PayPal Test] Client ID present:', hasId);
    console.log('[PayPal Test] Client Secret present:', hasSecret);

    if (!hasId || !hasSecret) {
      throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in .env');
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: '1.00'
          },
          description: 'LifeBuddy PayPal connectivity test',
          custom_id: 'lifebuddy-healthcheck'
        }
      ]
    });

    const response = await paypalClient().execute(request);
    const orderId = response?.result?.id;
    const status = response?.result?.status;

    if (!orderId) {
      throw new Error('No order id returned from PayPal');
    }

    console.log('[PayPal Test] Order created successfully');
    console.log(' orderId:', orderId);
    console.log(' status:', status);

    // Note: We do not capture here; this is only a connectivity test.

    console.log('[PayPal Test] SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error('[PayPal Test] FAILED:', err?.message || err);
    process.exit(1);
  }
}

main();
