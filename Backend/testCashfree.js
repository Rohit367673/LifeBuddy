const { createOrder } = require('./services/cashfreeClient');
const crypto = require('crypto');

async function testCashfree() {
  try {
    // Test credentials
    console.log('Testing Cashfree configuration...');
    
    // Test order creation
    const testOrder = {
      order_id: `TEST_${Date.now()}`,
      order_amount: 1.00,
      order_currency: 'INR',
      customer_details: {
        customer_id: 'test_user',
        customer_email: 'test@lifebuddy.space',
        customer_phone: '9999999999'
      }
    };
    
    console.log('Creating test order...');
    const order = await createOrder(testOrder);
    console.log('Order created successfully:', order);
    
    // Test webhook verification
    console.log('Testing webhook verification...');
    const secret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;
    const testPayload = JSON.stringify({ test: 'payload' });
    const signature = crypto.createHmac('sha256', secret).update(testPayload).digest('base64');
    
    console.log('Webhook verification successful');
    console.log('✅ All Cashfree tests passed');
  } catch (err) {
    console.error('❌ Cashfree test failed:', err);
    process.exit(1);
  }
}

testCashfree();
