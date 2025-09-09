# LifeBuddy n8n Workflow Documentation

## Overview

This document explains the complete n8n automation workflow for LifeBuddy schedule reminders. The workflow automatically sends daily reminders to users based on their AI-generated schedules through multiple free platforms.

## Workflow Architecture

```
Daily Trigger (9:00 AM)
    ↓
Find Today's Schedules (MongoDB)
    ↓
Check If Schedules Exist
    ↓
Process Schedules & Generate Messages
    ↓
Route by Platform (Email/WhatsApp/Telegram)
    ↓
Send Notifications
    ↓
Mark Reminders as Sent (MongoDB)
```

## Database Schema

### Schedule Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId, // Reference to User
  title: String, // "7-Day Fitness Plan"
  description: String, // Original user prompt
  schedule_date: Date, // When schedule starts
  schedule_time: String, // "09:00"
  duration_days: Number, // 7
  current_day: Number, // 1-7
  status: String, // "active", "completed", "paused"
  
  // User contact info for notifications
  user_email: String,
  user_phone: String, // WhatsApp number
  user_telegram_id: String,
  
  // Reminder preferences
  reminder_platforms: [String], // ["email", "whatsapp"]
  reminder_sent: Boolean, // Reset daily
  last_reminder_sent: Date,
  reminder_count: Number,
  
  // Daily schedule content
  daily_schedules: [{
    day: Number,
    content: String, // AI-generated content for this day
    tasks: [String],
    completed: Boolean,
    completed_at: Date
  }],
  
  // Metadata
  original_prompt: String,
  ai_model_used: String,
  generation_metadata: Object,
  preferences: {
    reminder_time: String,
    timezone: String,
    motivational_style: String
  }
}
```

### User Collection Updates

```javascript
{
  // Enhanced notification preferences
  notificationPreferences: {
    scheduleReminders: {
      enabled: Boolean,
      platforms: [String], // ["email", "whatsapp", "telegram"]
      time: String, // "09:00"
      timezone: String // "UTC"
    },
    motivationalStyle: String // "encouraging", "direct", "casual"
  },
  
  // Contact information
  whatsappNumber: String, // "+1234567890"
  telegramChatId: String,
  telegramUsername: String
}
```

## n8n Workflow Nodes

### 1. Schedule Trigger
- **Type**: Schedule Trigger
- **Cron**: `0 9 * * *` (Daily at 9:00 AM)
- **Purpose**: Initiates the daily reminder process

### 2. MongoDB Find
- **Type**: MongoDB
- **Operation**: Find
- **Collection**: `schedules`
- **Query**: 
  ```javascript
  {
    "schedule_date": { "$eq": "{{ DateTime.now().toISODate() }}" },
    "reminder_sent": { "$ne": true },
    "status": "active"
  }
  ```

### 3. Condition Check
- **Type**: IF Node
- **Condition**: `{{ $json.length > 0 }}`
- **Purpose**: Only proceed if schedules exist

### 4. Process Schedules
- **Type**: Code Node
- **Purpose**: Transform data and generate motivational messages
- **Key Functions**:
  - Generate random motivational messages
  - Prepare platform-specific data
  - Format reminder content

### 5. Platform Routing
Three parallel IF nodes to route by platform:
- Email: `{{ $json.platform === "email" }}`
- WhatsApp: `{{ $json.platform === "whatsapp" }}`
- Telegram: `{{ $json.platform === "telegram" }}`

### 6. Notification Nodes

#### Email Node (HTTP Request)
- **Method**: POST
- **URL**: SMTP endpoint
- **Body**: Email content with HTML formatting
- **Free Service**: Gmail SMTP

#### WhatsApp Node (HTTP Request)
- **Method**: POST
- **URL**: `https://graph.facebook.com/v18.0/{phone-number-id}/messages`
- **Headers**: `Authorization: Bearer {access-token}`
- **Body**: WhatsApp message format
- **Free Service**: Meta WhatsApp Cloud API

#### Telegram Node (Telegram)
- **Type**: Telegram Bot
- **Action**: Send Message
- **Chat ID**: User's Telegram chat ID
- **Free Service**: Telegram Bot API

### 7. Update Reminder Status
- **Type**: MongoDB
- **Operation**: Update
- **Purpose**: Mark reminder as sent to prevent duplicates

## Message Generation

### Motivational Messages
```javascript
const motivationalMessages = [
  '🌟 Time to make today amazing! Your scheduled activity awaits.',
  '💪 You\'ve got this! Let\'s tackle your planned task.',
  '🎯 Focus on your goal - every step counts!',
  '⭐ Today is the perfect day to achieve your dreams!',
  '🚀 Ready to make progress? Your schedule is calling!'
];
```

### Message Format
```
{motivational_message}

📅 Schedule: {schedule_title}
⏰ Time: {schedule_time}
📝 Details: {daily_content}

Have a productive day! 🎉
```

## API Integration

### Backend Endpoints

#### Get Today's Schedules
```http
GET /api/n8n/schedules/today
Headers: x-api-key: {N8N_API_KEY}

Response:
[
  {
    "_id": "schedule_id",
    "user_id": "user_id",
    "title": "7-Day Fitness Plan",
    "description": "Get fit in a week",
    "user_email": "user@example.com",
    "user_phone": "+1234567890",
    "user_telegram_id": "123456789",
    "reminder_platforms": ["email", "whatsapp"],
    "daily_content": "Day 1: Start with 20 push-ups...",
    "schedule_time": "09:00"
  }
]
```

#### Mark Reminder Sent
```http
PUT /api/n8n/schedules/{id}/reminder-sent
Headers: x-api-key: {N8N_API_KEY}
Body: {
  "platform": "email",
  "success": true
}
```

### Frontend Integration

#### Enhanced Schedule Creation
```javascript
// POST /api/schedule
{
  "title": "7-Day Fitness Plan",
  "prompt": "Create a beginner-friendly fitness routine",
  "duration_days": 7,
  "reminder_platforms": ["email", "whatsapp"],
  "schedule_time": "09:00"
}
```

## Free Service Limits

### WhatsApp Cloud API
- **Free Tier**: 1,000 messages/month
- **Rate Limit**: 80 messages/second
- **Setup**: Meta for Developers account

### Telegram Bot API
- **Free Tier**: Unlimited messages
- **Rate Limit**: 30 messages/second
- **Setup**: @BotFather on Telegram

### Gmail SMTP
- **Free Tier**: 500 emails/day
- **Rate Limit**: 100 emails/hour
- **Setup**: Gmail App Password

## Error Handling

### Common Errors and Solutions

1. **MongoDB Connection Failed**
   - Check connection string
   - Verify database permissions
   - Ensure network access

2. **Email Delivery Failed**
   - Verify SMTP credentials
   - Check Gmail app password
   - Validate recipient email

3. **WhatsApp API Error**
   - Verify access token
   - Check phone number format
   - Ensure number is verified

4. **Telegram Bot Error**
   - Verify bot token
   - Check chat ID format
   - Ensure user started conversation

### Retry Logic
```javascript
// Implement in n8n workflow
const maxRetries = 3;
let attempt = 0;

while (attempt < maxRetries) {
  try {
    // Send notification
    break;
  } catch (error) {
    attempt++;
    if (attempt === maxRetries) {
      // Log failure and continue
    }
  }
}
```

## Monitoring and Analytics

### Key Metrics
- Daily schedules processed
- Successful reminder deliveries
- Failed delivery rate by platform
- User engagement with reminders

### Logging
```javascript
// Log format for n8n workflow
{
  timestamp: new Date().toISOString(),
  workflow: "schedule-reminders",
  action: "reminder-sent",
  platform: "email",
  user_id: "user123",
  schedule_id: "schedule456",
  success: true,
  error: null
}
```

## Deployment Checklist

### Backend Setup
- [ ] Schedule model created
- [ ] User model updated with notification preferences
- [ ] n8n API routes implemented
- [ ] Environment variables configured
- [ ] Database indexes created

### n8n Setup
- [ ] Workflow imported
- [ ] MongoDB credentials configured
- [ ] Email SMTP credentials added
- [ ] WhatsApp API credentials added
- [ ] Telegram bot credentials added
- [ ] Workflow variables set
- [ ] Schedule trigger configured

### Testing
- [ ] API endpoints tested
- [ ] Database queries verified
- [ ] Email delivery tested
- [ ] WhatsApp delivery tested
- [ ] Telegram delivery tested
- [ ] End-to-end workflow tested

### Production
- [ ] Monitoring configured
- [ ] Error alerting set up
- [ ] Backup procedures in place
- [ ] Security review completed
- [ ] Performance optimization done

## Future Enhancements

### Planned Features
1. **Smart Scheduling**: AI-powered optimal reminder times
2. **Personalized Messages**: User-specific motivational content
3. **Progress Tracking**: Integration with completion metrics
4. **Multi-language Support**: Localized reminder messages
5. **Advanced Analytics**: Detailed engagement reporting

### Scalability Improvements
1. **Batch Processing**: Handle larger user volumes
2. **Queue System**: Reliable message delivery
3. **Load Balancing**: Distribute workflow execution
4. **Caching**: Optimize database queries
5. **CDN Integration**: Faster content delivery

This workflow provides a robust, scalable, and cost-effective solution for automated schedule reminders using entirely free services.
