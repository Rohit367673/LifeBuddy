const TelegramBot = require('node-telegram-bot-api');

// Bot token - replace with your actual bot token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7919506032:AAGqvJJdGCMwqfGvqJLzgNUQEOTRYNhRBBc';

// Create bot instance
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 LifeBuddy Telegram Bot started');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🌟 *Welcome to LifeBuddy Bot!*

I'm here to help you connect your Telegram account to receive daily schedule reminders.

*How to connect:*
1. Go to the LifeBuddy website
2. Click "Connect Telegram" 
3. You'll get a connection code
4. Send me: \`/connect YOUR_CODE\`

*Commands:*
/start - Show this welcome message
/connect CODE - Connect your account
/help - Get help

Ready to boost your productivity? Let's get started! 🚀
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
🆘 *LifeBuddy Bot Help*

*Available Commands:*
/start - Welcome message
/connect CODE - Connect your account with the code from LifeBuddy website
/help - Show this help message

*How to connect your account:*
1. Visit the LifeBuddy website
2. Go to "Connect Devices" section
3. Click "Connect Telegram"
4. Copy the connection code
5. Send me: \`/connect YOUR_CODE\`

*Need more help?*
Visit: https://www.lifebuddy.space/support

Happy scheduling! 📅✨
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Handle /connect command - this will be processed by the webhook
bot.onText(/\/connect (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const connectionCode = match[1];
  
  // Send temporary message while processing
  bot.sendMessage(chatId, `🔄 Processing connection code: ${connectionCode}...`);
  
  // The actual connection logic is handled by the webhook in deviceConnection.js
  // This is just to acknowledge the command
});

// Handle other messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Skip if it's a command (starts with /)
  if (text && text.startsWith('/')) {
    return;
  }
  
  // For any other message, provide guidance
  const guideMessage = `
👋 Hi there! I'm the LifeBuddy Bot.

To connect your account and receive daily reminders:
1. Visit the LifeBuddy website
2. Get your connection code
3. Send me: \`/connect YOUR_CODE\`

Type /help for more information! 🤖
  `;
  
  bot.sendMessage(chatId, guideMessage, { parse_mode: 'Markdown' });
});

// Error handling
bot.on('error', (error) => {
  console.error('Telegram Bot Error:', error);
});

// Polling error handling
bot.on('polling_error', (error) => {
  console.error('Telegram Bot Polling Error:', error);
});

module.exports = bot;
