#!/usr/bin/env node

/**
 * Google Login Test Script for LifeBuddy
 * Tests the complete Google login flow to identify issues
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
  frontendUrl: 'http://localhost:5173',
  backendUrl: 'http://localhost:5001',
  timeout: 30000,
  headless: false, // Set to true for headless testing
  slowMo: 100 // Slow down actions for debugging
};

class GoogleLoginTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
  }

  async init() {
    console.log('🚀 Initializing Google Login Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (text.includes('🔥') || text.includes('✅') || text.includes('❌') || text.includes('🚀')) {
        console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
      }
    });

    // Enable error logging
    this.page.on('pageerror', error => {
      console.error('❌ [PAGE ERROR]', error.message);
    });

    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Running test: ${name}`);
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ Test passed: ${name} (${duration}ms)`);
      
      this.results.tests.push({
        name,
        status: 'PASSED',
        duration,
        error: null
      });
      this.results.summary.passed++;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Test failed: ${name} (${duration}ms)`);
      console.error(`   Error: ${error.message}`);
      
      this.results.tests.push({
        name,
        status: 'FAILED',
        duration,
        error: error.message
      });
      this.results.summary.failed++;
    }
    
    this.results.summary.total++;
  }

  async testBackendHealth() {
    const response = await fetch(TEST_CONFIG.backendUrl + '/api/health');
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`Backend not healthy: ${JSON.stringify(data)}`);
    }
  }

  async testFrontendLoads() {
    await this.page.goto(TEST_CONFIG.frontendUrl, { 
      waitUntil: 'networkidle0',
      timeout: TEST_CONFIG.timeout 
    });
    
    const title = await this.page.title();
    if (!title.includes('LifeBuddy')) {
      throw new Error(`Unexpected page title: ${title}`);
    }
  }

  async testLoginPageLoads() {
    await this.page.goto(TEST_CONFIG.frontendUrl + '/login', { 
      waitUntil: 'networkidle0',
      timeout: TEST_CONFIG.timeout 
    });
    
    // Wait for Firebase to initialize
    await this.page.waitForFunction(
      () => window.console.logs?.some(log => log.includes('Firebase initialized')) || 
            document.querySelector('button[type="button"]'),
      { timeout: 10000 }
    );
  }

  async testGoogleButtonExists() {
    const googleButton = await this.page.$('button[type="button"]:has-text("Continue with Google"), button:has-text("Continue with Google")');
    if (!googleButton) {
      // Try alternative selectors
      const buttons = await this.page.$$('button');
      let found = false;
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text.includes('Google')) {
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error('Google login button not found on page');
      }
    }
  }

  async testGoogleButtonClick() {
    // Wait for any loading states to complete
    await this.page.waitForTimeout(2000);
    
    // Find and click the Google button
    const googleButton = await this.page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Google'));
    });
    
    if (!googleButton.asElement()) {
      throw new Error('Could not find Google login button');
    }

    // Check if button is disabled
    const isDisabled = await googleButton.evaluate(btn => btn.disabled);
    if (isDisabled) {
      throw new Error('Google login button is disabled');
    }

    // Click the button and wait for console logs
    await googleButton.click();
    
    // Wait for expected console logs
    await this.page.waitForFunction(
      () => {
        const logs = Array.from(document.querySelectorAll('*')).map(el => el.textContent).join(' ');
        return window.console?.logs?.some(log => log.includes('🔥 Google button clicked')) ||
               logs.includes('Google button clicked');
      },
      { timeout: 5000 }
    ).catch(() => {
      throw new Error('Google button click did not trigger expected console logs');
    });
  }

  async testFirebaseInitialization() {
    const firebaseInitialized = await this.page.evaluate(() => {
      return window.firebase !== undefined || 
             window.auth !== undefined ||
             document.querySelector('script[src*="firebase"]') !== null;
    });
    
    if (!firebaseInitialized) {
      throw new Error('Firebase not properly initialized');
    }
  }

  async testApiUrlConfiguration() {
    const apiUrl = await this.page.evaluate(async () => {
      if (window.getApiUrl) {
        return await window.getApiUrl();
      }
      return 'API URL function not available';
    });
    
    console.log(`📡 API URL being used: ${apiUrl}`);
    
    if (!apiUrl.includes('localhost:5001')) {
      console.warn(`⚠️ API URL is not localhost: ${apiUrl}`);
    }
  }

  async generateReport() {
    const reportPath = path.join(__dirname, 'google-login-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`📊 Total: ${this.results.summary.total}`);
    console.log(`📄 Report saved to: ${reportPath}`);
    
    if (this.results.summary.failed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   ❌ ${test.name}: ${test.error}`);
        });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      await this.runTest('Backend Health Check', () => this.testBackendHealth());
      await this.runTest('Frontend Loads', () => this.testFrontendLoads());
      await this.runTest('Login Page Loads', () => this.testLoginPageLoads());
      await this.runTest('Firebase Initialization', () => this.testFirebaseInitialization());
      await this.runTest('Google Button Exists', () => this.testGoogleButtonExists());
      await this.runTest('API URL Configuration', () => this.testApiUrlConfiguration());
      await this.runTest('Google Button Click', () => this.testGoogleButtonClick());
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new GoogleLoginTester();
  tester.run().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = GoogleLoginTester;
