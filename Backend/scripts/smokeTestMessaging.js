/*
  Simple smoke test for messaging delivery.
  It sends a small test message via Telegram using the configured bot token.
  Adjust chatId below to your own Telegram user/chat id before running.
*/

const { MessagingService } = require('../services/messagingService');

async function main() {
  try {
    const chatId = process.env.TEST_TELEGRAM_CHAT_ID || '6644184480';
    const messaging = new MessagingService();

    const user = {
      email: 'test@example.com',
      notificationPlatform: 'telegram',
      telegramChatId: chatId,
    };

    const task = {
      title: 'Smoke Test Plan',
      generatedSchedule: [
        {
          day: 1,
          subtask: 'Verify messaging path end-to-end',
          notes: 'This is a short smoke test message from LifeBuddy.',
          resources: ['https://lifebuddy.space'],
          exercises: ['Confirm reception on Telegram'],
          motivation: 'Keep shipping!',
          motivationTip: 'Small steps, consistent progress.',
          status: 'pending',
        },
      ],
    };

    console.log('Sending Telegram smoke test message...');
    const result = await messaging.sendMessage(user, task, 1);
    console.log('Result:', result);
    if (!result.success) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exitCode = 1;
  }
}

main();


