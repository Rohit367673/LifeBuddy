const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN || '7685199300:AAF1kWXVSZmIaGA-5O5j8QJ9SRG1jVeS_p4';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';

console.log('Starting LifeBuddy Telegram bot with token:', token.substring(0, 10) + '...');

const bot = new TelegramBot(token, { polling: true });

// For demo: use a placeholder userId (replace with real logic in production)
const DEMO_USER_ID = 'PLACEHOLDER_USER_ID';

bot.onText(/\/start(?:\s+(\S+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const token = match[1];
  
  console.log(`Received /start command from chat ID: ${chatId}, token: ${token || 'none'}`);
  
  if (!token) {
    bot.sendMessage(chatId, 'Welcome to LifeBuddy!\n\nTo link your account, please use the Connect Telegram button in the website.');
    return;
  }
  
  bot.sendMessage(chatId, 'Linking your Telegram to your LifeBuddy account...');
  try {
    const res = await fetch(`${backendUrl}/api/users/telegram/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, chatId })
    });
    
    if (res.ok) {
      const data = await res.json();
      bot.sendMessage(chatId, '✅ Your Telegram is now linked to your LifeBuddy account! You will receive daily schedules and motivational messages.');
    } else {
      const data = await res.json();
      bot.sendMessage(chatId, `❌ Failed to link: ${data.message}`);
    }
  } catch (err) {
    console.error('Error linking Telegram:', err);
    bot.sendMessage(chatId, '❌ Error linking your Telegram. Please try again.');
  }
});

console.log('LifeBuddy Telegram bot is running...'); 