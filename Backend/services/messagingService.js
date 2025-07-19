const nodemailer = require('nodemailer');

// Messaging platform types
const PLATFORMS = {
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
  EMAIL: 'email'
};

// Mock messaging service for development
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
        console.log(`No contact info found for platform: ${platform}`);
        return false;
      }

      const messageContent = this.formatMessage(task, dayNumber);
      const service = this.platforms[platform];
      
      if (!service) {
        console.log(`Platform not supported: ${platform}`);
        return false;
      }

      const result = await service.send(contactInfo, messageContent);
      console.log(`Message sent via ${platform} to ${contactInfo}: ${result ? 'Success' : 'Failed'}`);
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Get contact info based on platform
  getContactInfo(user, platform) {
    switch (platform) {
      case PLATFORMS.WHATSAPP:
        return user.phoneNumber;
      case PLATFORMS.TELEGRAM:
        return user.telegramUsername;
      case PLATFORMS.EMAIL:
        return user.email;
      default:
        return null;
    }
  }

  // Format message content
  formatMessage(task, dayNumber) {
    const todaySubtask = task.generatedSchedule.find(s => s.day === dayNumber);
    if (!todaySubtask) {
      return null;
    }

    const resources = todaySubtask.resources?.join('\n• ') || 'Check documentation';
    const exercises = todaySubtask.exercises?.join('\n• ') || 'Practice coding';

    return {
      title: `📚 Day ${dayNumber}: ${task.title}`,
      body: `${todaySubtask.subtask}\n\n📚 Resources:\n• ${resources}\n\n💪 Exercises:\n• ${exercises}\n\n📝 Notes: ${todaySubtask.notes || 'Focus on practical application'}\n\n🎯 Motivation: ${todaySubtask.motivationTip}`,
      data: {
        taskId: task._id.toString(),
        dayNumber: dayNumber.toString(),
        resources: todaySubtask.resources || [],
        exercises: todaySubtask.exercises || [],
        notes: todaySubtask.notes || '',
        motivationTip: todaySubtask.motivationTip
      }
    };
  }
}

// WhatsApp Service (Mock implementation)
class WhatsAppService {
  async send(phoneNumber, messageContent) {
    try {
      // Mock WhatsApp API call
      console.log(`📱 WhatsApp message to ${phoneNumber}:`);
      console.log(`Title: ${messageContent.title}`);
      console.log(`Body: ${messageContent.body.substring(0, 100)}...`);
      
      // In real implementation, you would use WhatsApp Business API
      // const response = await whatsappAPI.sendMessage(phoneNumber, messageContent);
      
      return true; // Mock success
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return false;
    }
  }
}

// Telegram Service (Mock implementation)
class TelegramService {
  async send(telegramUsername, messageContent) {
    try {
      // Mock Telegram API call
      console.log(`📱 Telegram message to @${telegramUsername}:`);
      console.log(`Title: ${messageContent.title}`);
      console.log(`Body: ${messageContent.body.substring(0, 100)}...`);
      
      // In real implementation, you would use Telegram Bot API
      // const response = await telegramBot.sendMessage(telegramUsername, messageContent);
      
      return true; // Mock success
    } catch (error) {
      console.error('Telegram send error:', error);
      return false;
    }
  }
}

// Email Service (Real implementation with nodemailer)
class EmailService {
  constructor() {
    // Configure email transporter (you'll need to set up your email service)
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async send(email, messageContent) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: messageContent.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">${messageContent.title}</h2>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">${messageContent.body}</p>
            </div>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; font-weight: bold;">🎯 Motivation: ${messageContent.data.motivationTip}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">Powered by LifeBuddy AI</p>
            </div>
          </div>
        `
      };

      // For now, just log the email (mock)
      console.log(`📧 Email to ${email}:`);
      console.log(`Subject: ${messageContent.title}`);
      console.log(`Body: ${messageContent.body.substring(0, 100)}...`);
      
      // Uncomment when you have email credentials
      // const result = await this.transporter.sendMail(mailOptions);
      // return result;
      
      return true; // Mock success
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }
}

module.exports = {
  MessagingService,
  PLATFORMS
}; 