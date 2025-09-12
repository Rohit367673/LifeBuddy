const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const { splitContentIntoMessages } = require('./openRouterService');

// Helper: build link to full schedule in the frontend
const FRONTEND_BASE = (process.env.FRONTEND_URL || process.env.OPENROUTER_REFERRER || '').replace(/\/$/, '') || 'https://lifebuddy.app';
const buildScheduleUrl = (dayNumber) => `${FRONTEND_BASE}/my-schedule?day=${encodeURIComponent(dayNumber)}&t=${Date.now()}`;

// Messaging platform types
const PLATFORMS = {
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
  EMAIL: 'email'
};

// WhatsApp Business API Service
class WhatsAppService {
  constructor() {
    // Cloud API config
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.sandboxCode = process.env.WHATSAPP_SANDBOX_CODE || 'GBmQD7SB';
    this.baseUrl = 'https://graph.facebook.com/v18.0';

    // Custom gateway config (e.g., WAHA or user bot)
    this.customBaseUrl = process.env.CUSTOM_WHATSAPP_BASE_URL || '';
    this.customEndpoint = process.env.CUSTOM_WHATSAPP_ENDPOINT || '/api/sendText';
    this.customApiKey = process.env.CUSTOM_WHATSAPP_API_KEY || '';
    this.customAuthHeader = process.env.CUSTOM_WHATSAPP_AUTH_HEADER || 'X-API-Key';
    this.customSession = process.env.CUSTOM_WHATSAPP_SESSION || 'lifebuddy';
    this.customMode = (process.env.CUSTOM_WHATSAPP_MODE || 'waha').toLowerCase(); // 'waha' | 'simple'
    this.chatIdSuffix = process.env.CUSTOM_WHATSAPP_CHATID_SUFFIX || '@c.us';
  }

  async sendMessage(contactInfo, message) {
    try {
      if (this.customBaseUrl) {
        // Route through custom gateway
        return await this.sendViaCustom(contactInfo, message);
      }

      // Default: WhatsApp Cloud API (with sandbox code if provided)
      // If a template is configured, attempt template send first (bypasses 24h session restriction)
      const useTemplate = String(process.env.WHATSAPP_USE_TEMPLATE || '').toLowerCase() === 'true' || !!process.env.WHATSAPP_TEMPLATE_NAME;
      if (useTemplate && process.env.WHATSAPP_TEMPLATE_NAME) {
        const templateResult = await this.sendTemplateMessage(contactInfo, message);
        if (templateResult?.success) {
          return templateResult;
        }
        // fall through to text send if template fails
        try { console.warn('WhatsApp template failed, falling back to text message'); } catch (_) {}
      }

      const sandboxMessage = `${this.sandboxCode}\n\n${message}`;
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: contactInfo,
          type: 'text',
          text: { body: sandboxMessage }
        })
      });

      const result = await response.json();
      if (result.error) {
        console.error('WhatsApp API error:', result.error);
        return { success: false, error: result.error };
      }

      console.log(`✅ WhatsApp (Cloud) message sent to ${contactInfo}`);
      return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error) {
      console.error('WhatsApp service error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTemplateMessage(contactInfo, message) {
    try {
      const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
      const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';
      if (!templateName) return { success: false, error: 'Template name not set' };
      const components = [];
      // if body supports a parameter, pass trimmed message
      components.push({
        type: 'body',
        parameters: [
          { type: 'text', text: String(message).slice(0, 1024) }
        ]
      });
      // optional button URL with schedule link
      const scheduleUrl = `${FRONTEND_BASE}/my-schedule`;
      if (process.env.WHATSAPP_TEMPLATE_INCLUDE_URL === 'true') {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [ { type: 'text', text: scheduleUrl } ]
        });
      }
      const payload = {
        messaging_product: 'whatsapp',
        to: contactInfo,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components
        }
      };
      const resp = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();
      if (!resp.ok || result.error) {
        console.error('WhatsApp template error:', result.error || result);
        return { success: false, error: result?.error?.message || 'Template send failed' };
      }
      console.log(`✅ WhatsApp (Template) message sent to ${contactInfo}`);
      return { success: true, messageId: result.messages?.[0]?.id, template: templateName };
    } catch (e) {
      console.error('WhatsApp template service error:', e);
      return { success: false, error: e.message };
    }
  }

  formatToChatId(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/[^0-9]/g, '');
    return `${digits}${this.chatIdSuffix}`;
  }

  async sendViaCustom(contactInfo, message) {
    try {
      const url = `${this.customBaseUrl.replace(/\/$/, '')}${this.customEndpoint}`;
      const headers = { 'Content-Type': 'application/json' };
      if (this.customApiKey) headers[this.customAuthHeader] = this.customApiKey;

      let body;
      if (this.customMode === 'waha') {
        // WAHA-style API
        body = {
          session: this.customSession,
          chatId: this.formatToChatId(contactInfo),
          text: message
        };
      } else {
        // Generic simple API: { to: '+911234...', text: '...' }
        body = { to: contactInfo, text: message };
      }

      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        console.error('Custom WhatsApp gateway error:', result || resp.statusText);
        return { success: false, error: result?.error || resp.statusText };
      }
      console.log(`✅ WhatsApp (Custom) message sent to ${contactInfo}`);
      return { success: true, result };
    } catch (err) {
      console.error('Custom WhatsApp service error:', err);
      return { success: false, error: err.message };
    }
  }

  async sendMultipleMessages(contactInfo, messages) {
    const results = [];
    for (const message of messages) {
      const result = await this.sendMessage(contactInfo, message);
      results.push(result);
      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    return results;
  }
}

// Telegram Service
class TelegramService {
  constructor() {
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    this.botToken = envToken && envToken.trim().length > 0
      ? envToken
      : '7685199300:AAF1kWXVSZmIaGA-5O5j8QJ9SRG1jVeS_p4';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(chatId, message) {
    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        console.error('Telegram API error:', result);
        return { success: false, error: result.description };
      }

      console.log(`✅ Telegram message sent to ${chatId}`);
      return { success: true, messageId: result.result?.message_id };
    } catch (error) {
      console.error('Telegram service error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMultipleMessages(chatId, messages) {
    const results = [];
    for (const message of messages) {
      const result = await this.sendMessage(chatId, message);
      results.push(result);
      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return results;
  }
}

// Email Service
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  async sendMessage(email, message) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@lifebuddy.com',
        to: email,
        subject: '🎯 Your Daily Learning Schedule - LifeBuddy',
        html: this.formatEmailMessage(message)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  formatEmailMessage(content) {
    const scheduleUrl = `${FRONTEND_BASE}/my-schedule`;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>LifeBuddy Daily Schedule</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px; }
          .motivation { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: center; }
          .resource { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .code { background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; }
          .cta { margin-top: 16px; text-align: center; }
          .cta a { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff !important; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 LifeBuddy Daily Schedule</h1>
            <p>Your personalized learning journey starts here!</p>
          </div>
          <div class="content">
            ${content.replace(/\n/g, '<br>')}
            <div class="cta">
              <a href="${scheduleUrl}" target="_blank" rel="noopener">Open full schedule</a>
            </div>
          </div>
          <div class="motivation">
            <h3>💪 Stay Motivated!</h3>
            <p>Every expert was once a beginner. Keep pushing forward!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Main Messaging Service
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

      // Generate comprehensive content
      const schedule = task.generatedSchedule[dayNumber - 1];
      let fullContent = await this.generateComprehensiveContent(task, dayNumber);
      // For Telegram, send the full structured daily plan, not just a short summary
      if (platform === PLATFORMS.TELEGRAM && schedule) {
        fullContent =
          `✨ <b>Day ${dayNumber}: ${task.title}</b>\n` +
          (schedule.dayTitle ? `\n<b>Day Title:</b> ${schedule.dayTitle}` : '') +
          (schedule.keyPoints && schedule.keyPoints.length ? `\n<b>Key Points:</b>\n- ${schedule.keyPoints.join('\n- ')}` : '') +
          (schedule.example ? `\n<b>Example/Analogy:</b> ${schedule.example}` : '') +
          (schedule.resources && schedule.resources.length ? `\n<b>Resources:</b>\n- ${schedule.resources.join('\n- ')}` : '') +
          (schedule.tips ? `\n<b>Tips:</b> ${schedule.tips}` : '') +
          (schedule.duration ? `\n<b>Duration:</b> ${schedule.duration}` : '') +
          (schedule.motivation ? `\n<b>Motivation:</b> ${schedule.motivation}` : '');
      }

      // Split content for multi-message platforms
      const messages = splitContentIntoMessages(fullContent, task.title, dayNumber);
      // Append CTA link for platforms that send multiple messages
      const scheduleUrl = buildScheduleUrl(dayNumber);
      if (platform === PLATFORMS.TELEGRAM) {
        messages.push(`\n<b>🔗 View full schedule:</b> <a href="${scheduleUrl}">${scheduleUrl}</a>`);
      } else if (platform === PLATFORMS.WHATSAPP) {
        messages.push(`\n🔗 View full schedule: ${scheduleUrl}`);
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
        // Send single comprehensive message for email (CTA button added inside the template)
        const result = await platformService.sendMessage(contactInfo, fullContent);
        return { ...result, platform };
      }
    } catch (error) {
      console.error('Messaging service error:', error);
      return { success: false, error: error.message };
    }
  }

  getContactInfo(user, platform) {
    switch (platform) {
      case PLATFORMS.TELEGRAM:
        return user.telegramChatId;
      case PLATFORMS.WHATSAPP:
        return user.phoneNumber;
      case PLATFORMS.EMAIL:
        return user.email;
      default:
        return null;
    }
  }

  async generateComprehensiveContent(task, dayNumber) {
    const schedule = task.generatedSchedule[dayNumber - 1];
    if (!schedule) {
      return 'No schedule available for today.';
    }

    return `
📚 Day ${dayNumber}: ${task.title}

🎯 What You'll Learn Today:
• ${schedule.subtask}

📖 Deep Dive:
${schedule.notes || 'Focus on understanding the fundamentals and practicing regularly.'}

💻 Hands-On Practice:
${schedule.exercises ? schedule.exercises.join('\n• ') : 'Practice the concepts you learned today.'}

📚 Resources:
${schedule.resources ? schedule.resources.join('\n• ') : 'Check official documentation and tutorials.'}

💪 Motivation:
${schedule.motivationTip || 'Every expert was once a beginner. Keep pushing forward!'}

🚀 Pro Tips:
• Take breaks every 45 minutes
• Practice coding daily
• Join online communities
• Build small projects

🎯 Challenge:
Complete today's exercises and share your progress!

Remember: Consistency beats perfection. Keep going! 💪
    `.trim();
  }
}

module.exports = { MessagingService, PLATFORMS, TelegramService }; 