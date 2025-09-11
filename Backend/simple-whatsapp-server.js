const express = require('express');
const app = express();
app.use(express.json());

// Simple WhatsApp simulation server for testing
const PORT = 3000;

// Store for simulating WhatsApp sessions
let sessions = {};

// Start session endpoint
app.post('/api/sessions/start', (req, res) => {
  const { name } = req.body;
  sessions[name] = { status: 'ready', qr: 'simulated-qr-code' };
  console.log(`📱 WhatsApp session '${name}' started`);
  res.json({ success: true, session: name, status: 'ready' });
});

// Get QR code endpoint
app.get('/api/sessions/:session/auth/qr', (req, res) => {
  const { session } = req.params;
  console.log(`📱 QR code requested for session: ${session}`);
  res.json({ qr: 'data:image/png;base64,simulated-qr-code' });
});

// Send text message endpoint (WAHA style)
app.post('/api/sendText', (req, res) => {
  const { session, chatId, text } = req.body;
  
  console.log('\n📱 WhatsApp Message Sent (WAHA):');
  console.log('========================');
  console.log(`Session: ${session}`);
  console.log(`To: ${chatId}`);
  console.log(`Message: ${text}`);
  console.log('========================\n');
  
  res.json({ 
    success: true, 
    messageId: 'msg_' + Date.now(),
    chatId,
    text: text.substring(0, 50) + '...'
  });
});

// Send text message endpoint (Simple style for Option B)
app.post('/send', (req, res) => {
  const { to, text } = req.body;
  
  console.log('\n📱 WhatsApp Message Sent (Simple):');
  console.log('========================');
  console.log(`To: ${to}`);
  console.log(`Message: ${text}`);
  console.log('========================\n');
  
  res.json({ 
    success: true, 
    messageId: 'msg_' + Date.now(),
    to,
    text: text.substring(0, 50) + '...'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WhatsApp Simulator' });
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Simulator running on http://localhost:${PORT}`);
  console.log('📱 This simulates WAHA for testing purposes');
  console.log('💡 Use this while Docker/WAHA is being set up');
});

module.exports = app;
