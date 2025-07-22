const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

// Helper: Split message for Telegram (by section or 4000 chars)
function splitForTelegram(content) {
  const maxLen = 4000;
  if (content.length <= maxLen) return [content];
  // Try to split by numbered sections ("1.", "2.", etc.)
  const parts = content.split(/\n(?=\d+\.)/g).map(s => s.trim()).filter(Boolean);
  let messages = [];
  let current = '';
  for (const part of parts) {
    if ((current + '\n' + part).length > maxLen) {
      if (current) messages.push(current);
      current = part;
    } else {
      current = current ? current + '\n' + part : part;
    }
  }
  if (current) messages.push(current);
  // If splitting by section didn't work, fallback to chunking by maxLen
  if (messages.length === 1 && messages[0].length > maxLen) {
    messages = [];
    for (let i = 0; i < content.length; i += maxLen) {
      messages.push(content.slice(i, i + maxLen));
    }
  }
  return messages;
}

class MessagingService {
  constructor() {
    this.platforms = {
      [PLATFORMS.WHATSAPP]: new WhatsAppService(),
      [PLATFORMS.TELEGRAM]: new TelegramService(),
      [PLATFORMS.EMAIL]: new EmailService()
    };
  }

  // Send message to user's preferred platform
  async sendMessage(user, task, dayNumber) {
    try {
      const platform = user.notificationPlatform || PLATFORMS.EMAIL;
      const contactInfo = this.getContactInfo(user, platform);
      if (!contactInfo) {
        console.error(`No contact info found for platform: ${platform}`);
        return { success: false, error: 'No contact information available' };
      }
      // Use the content from the task (single message)
      const fullContent = task.generatedSchedule[0]?.content || 'No content available.';
      let messages = [fullContent];
      if (platform === PLATFORMS.TELEGRAM) {
        messages = splitForTelegram(fullContent);
      }
      const platformService = this.platforms[platform];
      if (platform === PLATFORMS.TELEGRAM || platform === PLATFORMS.WHATSAPP) {
        // Send multiple messages for Telegram and WhatsApp
        const results = await platformService.sendMultipleMessages(contactInfo, messages);
        const successCount = results.filter(r => r.success).length;
        console.log(`📱 Sent ${successCount}/${messages.length} messages via ${platform}`);
        return {
          success: successCount > 0,
          messagesSent: successCount,
          totalMessages: messages.length,
          platform
        };
      } else {
        // Send single comprehensive message for email
        const result = await platformService.sendMessage(contactInfo, fullContent);
        return { ...result, platform };
      }
    } catch (error) {
      console.error('Messaging service error:', error);
      return { success: false, error: error.message };
    }
  }
} 