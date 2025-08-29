// Environment validation utility for production deployment
const validateEnvironment = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  const paymentEnvVars = [
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'CASHFREE_APP_ID',
    'CASHFREE_SECRET_KEY'
  ];

  const missingVars = [];
  const warnings = [];

  // Check required environment variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // MongoDB URI: accept either MONGODB_URI or MONGO_URI (app.js uses MONGODB_URI)
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    missingVars.push('MONGODB_URI (or MONGO_URI)');
  }

  // Check payment environment variables
  paymentEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`Payment variable ${varName} is not set`);
    }
  });

  // Validate NODE_ENV
  const validNodeEnvs = ['development', 'production', 'test'];
  if (!validNodeEnvs.includes(process.env.NODE_ENV)) {
    warnings.push(`NODE_ENV should be one of: ${validNodeEnvs.join(', ')}`);
  }

  // Check for sandbox vs production consistency
  if (process.env.NODE_ENV === 'production') {
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_ID.includes('sandbox')) {
      warnings.push('Using sandbox PayPal credentials in production environment');
    }
    if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_APP_ID.includes('TEST')) {
      warnings.push('Using test Cashfree credentials in production environment');
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
    environment: process.env.NODE_ENV || 'development'
  };
};

const logEnvironmentStatus = () => {
  const validation = validateEnvironment();
  
  console.log('=== Environment Validation ===');
  console.log(`Environment: ${validation.environment.toUpperCase()}`);
  console.log(`Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  if (validation.missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    validation.missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }
  
  // Payment gateway status
  const paypalConfigured = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const cashfreeConfigured = !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
  
  console.log('=== Payment Gateways ===');
  console.log(`PayPal: ${paypalConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Cashfree: ${cashfreeConfigured ? '✅ Configured' : '❌ Not configured'}`);
  
  if (validation.environment === 'production' && (!paypalConfigured && !cashfreeConfigured)) {
    console.error('❌ No payment gateways configured for production!');
  }
  
  console.log('===============================');
  
  return validation;
};

module.exports = {
  validateEnvironment,
  logEnvironmentStatus
};
