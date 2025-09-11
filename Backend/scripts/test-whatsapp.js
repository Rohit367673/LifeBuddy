/*
 Test WhatsApp send via custom WAHA gateway through backend n8n endpoint
 Usage: node scripts/test-whatsapp.js
*/

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env from Backend directory
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('✅ Loaded .env from', envPath);
  } else {
    dotenv.config();
    console.log('ℹ️ .env not found at', envPath, '- using process.env');
  }
} catch (e) {
  console.log('ℹ️ dotenv load issue:', e.message);
}

const BACKEND_URL = process.env.BACKEND_URL || 'https://lifebuddy-backend-production.up.railway.app';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const TO_NUMBER = process.env.BUSINESS_WHATSAPP_NUMBER || '+918988140922';

const CUSTOM_WHATSAPP_BASE_URL = process.env.CUSTOM_WHATSAPP_BASE_URL || '';
const CUSTOM_WHATSAPP_MODE = (process.env.CUSTOM_WHATSAPP_MODE || '').toLowerCase();
const CUSTOM_WHATSAPP_SESSION = process.env.CUSTOM_WHATSAPP_SESSION || 'lifebuddy';

async function main() {
  // Ensure fetch exists (Node18+) or polyfill
  let fetchFn = global.fetch;
  if (!fetchFn) {
    try { fetchFn = require('node-fetch'); } catch (_) {}
  }
  if (!fetchFn) {
    console.error('❌ No fetch available. Please run with Node 18+ or install node-fetch');
    process.exit(1);
  }

  console.log('=== WhatsApp Test (Custom Gateway via Backend) ===');
  console.log('Backend URL:', BACKEND_URL);
  console.log('To Number:', TO_NUMBER);
  console.log('N8N_API_KEY set:', !!N8N_API_KEY);
  console.log('Custom WAHA Base URL:', CUSTOM_WHATSAPP_BASE_URL);
  console.log('WAHA Mode:', CUSTOM_WHATSAPP_MODE || 'waha (default)');
  console.log('WAHA Session:', CUSTOM_WHATSAPP_SESSION);

  if (!N8N_API_KEY) {
    console.warn('⚠️ N8N_API_KEY is empty. The backend will reject the request. Set N8N_API_KEY in .env');
  }

  // Prepare payload
  const payload = {
    to: TO_NUMBER,
    title: 'Your Daily LifeBuddy Schedule',
    daily_content: 'Day 1: Deep Focus session, resources and exercises.\n• 50 min focus\n• 10 min break\n• Repeat 3x',
    scheduleId: 'test-' + Date.now(),
    user_name: 'Rohit'
  };

  try {
    const url = `${BACKEND_URL}/api/n8n/whatsapp/send-reminder`;
    const resp = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_API_KEY,
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    console.log('HTTP Status:', resp.status);
    console.log('Response:', data);

    if (resp.ok && data.success) {
      console.log('✅ Test succeeded. Check WhatsApp on', TO_NUMBER);
      process.exit(0);
    } else {
      console.log('❌ Test failed. See details above.');
      await printDiagnostics(fetchFn);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Request error:', err.message);
    await printDiagnostics(fetchFn);
    process.exit(2);
  }
}

async function printDiagnostics(fetchFn) {
  console.log('\n=== Diagnostics ===');
  try {
    if (CUSTOM_WHATSAPP_BASE_URL) {
      // Try WAHA simple health endpoints if available
      const healthUrl = `${CUSTOM_WHATSAPP_BASE_URL.replace(/\/$/, '')}/api/health`;
      try {
        const r = await fetchFn(healthUrl);
        console.log('WAHA /api/health status:', r.status);
      } catch (e) {
        console.log('WAHA /api/health error:', e.message);
      }

      const sessionsUrl = `${CUSTOM_WHATSAPP_BASE_URL.replace(/\/$/, '')}/api/sessions`;
      try {
        const r = await fetchFn(sessionsUrl);
        const j = await r.json().catch(() => ({}));
        console.log('WAHA /api/sessions status:', r.status);
        console.log('WAHA /api/sessions body:', Array.isArray(j) ? j.map(s => ({ name: s.name, status: s.status })) : j);
      } catch (e) {
        console.log('WAHA /api/sessions error:', e.message);
      }
    }
  } catch (_) {}
}

main();
