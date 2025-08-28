const express = require('express');
const router = express.Router();
const { getPlanPrice, getCurrencyByCountry, getSupportedCurrencies } = require('../utils/currencyConverter');

// GET /api/pricing/plans - Get plan pricing for different currencies
router.get('/plans', async (req, res) => {
  try {
    const { currency = 'USD', country } = req.query;
    
    // Detect currency from country if provided
    const detectedCurrency = country ? getCurrencyByCountry(country) : 'USD';
    const finalCurrency = country ? detectedCurrency : currency;
    
    const monthlyPrice = getPlanPrice('monthly', finalCurrency);
    const yearlyPrice = getPlanPrice('yearly', finalCurrency);
    
    // Calculate savings
    const monthlyCost = monthlyPrice * 12;
    const yearlySavings = monthlyCost - yearlyPrice;
    const savingsPercentage = Math.round((yearlySavings / monthlyCost) * 100);
    
    res.json({
      success: true,
      currency: finalCurrency,
      pricing: {
        monthly: {
          price: monthlyPrice,
          currency: finalCurrency,
          period: 'month'
        },
        yearly: {
          price: yearlyPrice,
          currency: finalCurrency,
          period: 'year',
          savings: {
            amount: yearlySavings,
            percentage: savingsPercentage
          }
        }
      },
      supportedCurrencies: getSupportedCurrencies()
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pricing information' 
    });
  }
});

// GET /api/pricing/currency/:country - Get currency for a specific country
router.get('/currency/:country', (req, res) => {
  try {
    const { country } = req.params;
    const currency = getCurrencyByCountry(country);
    
    res.json({
      success: true,
      country: country.toUpperCase(),
      currency
    });
  } catch (error) {
    console.error('Error detecting currency:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to detect currency' 
    });
  }
});

module.exports = router;
