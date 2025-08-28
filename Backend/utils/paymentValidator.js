// Payment validation utility to ensure proper gateway configuration
const validatePaymentGateways = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const validationResults = {
    paypal: {
      configured: false,
      environment: 'unknown',
      issues: []
    },
    cashfree: {
      configured: false,
      environment: 'unknown',
      issues: []
    },
    overall: {
      ready: false,
      warnings: []
    }
  };

  // PayPal validation
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (paypalClientId && paypalClientSecret) {
    validationResults.paypal.configured = true;
    
    // Detect environment from client ID
    if (paypalClientId.includes('sandbox') || paypalClientId.startsWith('AV') || paypalClientId.startsWith('Ab')) {
      validationResults.paypal.environment = 'sandbox';
    } else {
      validationResults.paypal.environment = 'live';
    }
    
    // Check for environment mismatch
    if (isProduction && validationResults.paypal.environment === 'sandbox') {
      validationResults.paypal.issues.push('Using sandbox credentials in production');
    }
    if (!isProduction && validationResults.paypal.environment === 'live') {
      validationResults.paypal.issues.push('Using live credentials in development');
    }
  } else {
    validationResults.paypal.issues.push('Missing PayPal credentials');
  }

  // Cashfree validation
  const cashfreeAppId = process.env.CASHFREE_APP_ID;
  const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
  
  if (cashfreeAppId && cashfreeSecretKey) {
    validationResults.cashfree.configured = true;
    
    // Detect environment from app ID pattern
    if (cashfreeAppId.includes('TEST') || cashfreeAppId.startsWith('TEST')) {
      validationResults.cashfree.environment = 'sandbox';
    } else {
      validationResults.cashfree.environment = 'live';
    }
    
    // Check for environment mismatch
    if (isProduction && validationResults.cashfree.environment === 'sandbox') {
      validationResults.cashfree.issues.push('Using test credentials in production');
    }
    if (!isProduction && validationResults.cashfree.environment === 'live') {
      validationResults.cashfree.issues.push('Using live credentials in development');
    }
  } else {
    validationResults.cashfree.issues.push('Missing Cashfree credentials');
  }

  // Overall validation
  const hasAtLeastOneGateway = validationResults.paypal.configured || validationResults.cashfree.configured;
  validationResults.overall.ready = hasAtLeastOneGateway;
  
  if (!hasAtLeastOneGateway) {
    validationResults.overall.warnings.push('No payment gateways configured');
  }
  
  if (isProduction) {
    if (validationResults.paypal.configured && validationResults.paypal.environment === 'sandbox') {
      validationResults.overall.warnings.push('PayPal sandbox in production');
    }
    if (validationResults.cashfree.configured && validationResults.cashfree.environment === 'sandbox') {
      validationResults.overall.warnings.push('Cashfree test environment in production');
    }
  }

  return validationResults;
};

const logPaymentStatus = () => {
  const validation = validatePaymentGateways();
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('=== Payment Gateway Status ===');
  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  // PayPal status
  console.log(`PayPal: ${validation.paypal.configured ? '✅' : '❌'} ${validation.paypal.configured ? `(${validation.paypal.environment})` : 'Not configured'}`);
  if (validation.paypal.issues.length > 0) {
    validation.paypal.issues.forEach(issue => console.warn(`   ⚠️  ${issue}`));
  }
  
  // Cashfree status
  console.log(`Cashfree: ${validation.cashfree.configured ? '✅' : '❌'} ${validation.cashfree.configured ? `(${validation.cashfree.environment})` : 'Not configured'}`);
  if (validation.cashfree.issues.length > 0) {
    validation.cashfree.issues.forEach(issue => console.warn(`   ⚠️  ${issue}`));
  }
  
  // Overall warnings
  if (validation.overall.warnings.length > 0) {
    console.warn('⚠️  Payment Warnings:');
    validation.overall.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  console.log(`Payment System: ${validation.overall.ready ? '✅ Ready' : '❌ Not Ready'}`);
  console.log('==============================');
  
  return validation;
};

module.exports = {
  validatePaymentGateways,
  logPaymentStatus
};
