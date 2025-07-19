const { generateScheduleWithOpenRouter } = require('../services/openRouterService');
const { MessagingService } = require('../services/messagingService');
require('dotenv').config();

async function testOpenRouterToTelegram() {
  const title = 'Build a personal productivity system';
  const requirements = 'Focus on time management and healthy habits';
  const startDate = new Date();
  const endDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 3 days
  const telegramChatId = '6644184480'; // Use your numeric chat ID

  console.log('Generating schedule with OpenRouter...');
  const schedule = await generateScheduleWithOpenRouter(title, requirements, startDate, endDate);
  console.log('Generated schedule:', schedule);

  const firstDay = schedule[0];
  if (!firstDay) {
    console.error('No schedule generated.');
    return;
  }

  const messagingService = new MessagingService();
  const messageContent = {
    title: `Day 1: ${title}`,
    body: `${firstDay.subtask}\n\nMotivation: ${firstDay.motivationTip}\nResources: ${firstDay.resources?.join(', ')}\nExercises: ${firstDay.exercises?.join(', ')}\nNotes: ${firstDay.notes}`
  };

  console.log('Sending to Telegram...');
  const result = await messagingService.platforms.telegram.send(telegramChatId, messageContent);
  if (result) {
    console.log('✅ Message sent to Telegram!');
  } else {
    console.error('❌ Failed to send message to Telegram.');
  }
}

testOpenRouterToTelegram(); 