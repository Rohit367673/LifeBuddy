# LifeBuddy n8n Integration Setup Guide

This guide explains how to set up the n8n automation workflow for LifeBuddy schedule reminders.

## Prerequisites

1. **n8n Instance**: Self-hosted or cloud n8n instance
2. **MongoDB Access**: Your LifeBuddy backend must be connected to MongoDB
3. **Free Notification Services**:
   - Email: SMTP server (Gmail, etc.)
   - WhatsApp: Meta WhatsApp Cloud API (free tier)
   - Telegram: Telegram Bot API (free)

## Environment Variables

Add these environment variables to your LifeBuddy backend:

```bash
# n8n API Authentication
N8N_API_KEY=your-secure-api-key-here

# Telegram Bot (Free)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# WhatsApp Cloud API (Free)
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token

# SMTP Email (Free with Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Free Service Setup

### 1. Telegram Bot Setup (100% Free)

1. Message @BotFather on Telegram
2. Create new bot: `/newbot`
3. Get your bot token
4. Add token to `TELEGRAM_BOT_TOKEN`

### 2. WhatsApp Cloud API Setup (Free Tier)

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app → Business → WhatsApp
3. Get Phone Number ID and Access Token
4. Add to environment variables
5. Free tier: 1000 messages/month

### 3. Gmail SMTP Setup (Free)

1. Enable 2-factor authentication on Gmail
2. Generate App Password: Google Account → Security → App passwords
3. Use your email and app password in environment variables

## n8n Workflow Configuration

### 1. Import the Workflow

Copy the provided JSON workflow into your n8n instance:

```json
{
  "name": "LifeBuddy Schedule Reminder Automation",
  // ... (use the JSON from your original request)
}
```

### 2. Configure Credentials

#### MongoDB Credentials
- **Connection String**: Your MongoDB URI
- **Database**: lifebuddy (or your database name)

#### SMTP Credentials (for Email)
- **Host**: smtp.gmail.com
- **Port**: 587
- **User**: your-email@gmail.com
- **Password**: your-app-password

#### WhatsApp API Credentials
- **Header Auth**: Authorization: Bearer YOUR_ACCESS_TOKEN

#### Telegram Bot Credentials
- **Bot Token**: Your Telegram bot token

### 3. Set Workflow Variables

In n8n workflow settings, add these variables:

```json
{
  "whatsapp_phone_number_id": "your-phone-number-id",
  "backend_api_url": "https://your-backend-url.com/api",
  "n8n_api_key": "your-secure-api-key"
}
```

## API Endpoints for n8n

Your n8n workflow will use these endpoints:

### Get Today's Schedules
```
GET /api/n8n/schedules/today
Headers: x-api-key: YOUR_N8N_API_KEY
```

### Mark Reminder as Sent
```
PUT /api/n8n/schedules/:id/reminder-sent
Headers: x-api-key: YOUR_N8N_API_KEY
Body: { "platform": "email|whatsapp|telegram", "success": true }
```

### Test Connection
```
POST /api/n8n/test-connection
Headers: x-api-key: YOUR_N8N_API_KEY
```

## Workflow Schedule

The workflow runs daily at 9:00 AM (configurable):

```
Cron Expression: 0 9 * * *
```

To change the time, modify the cron expression in the Schedule Trigger node.

## Testing the Setup

1. **Test API Connection**:
   ```bash
   curl -X POST "https://your-backend.com/api/n8n/test-connection" \
     -H "x-api-key: YOUR_API_KEY"
   ```

2. **Create a Test Schedule**:
   ```bash
   curl -X POST "https://your-backend.com/api/schedule" \
     -H "Authorization: Bearer USER_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Schedule",
       "prompt": "Create a simple daily routine",
       "duration_days": 3,
       "reminder_platforms": ["email"],
       "schedule_time": "09:00"
     }'
   ```

3. **Check Today's Schedules**:
   ```bash
   curl -X GET "https://your-backend.com/api/n8n/schedules/today" \
     -H "x-api-key: YOUR_API_KEY"
   ```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Check MongoDB URI in n8n credentials
   - Ensure database name is correct

2. **Email Not Sending**:
   - Verify Gmail app password
   - Check SMTP settings in n8n

3. **WhatsApp Not Working**:
   - Verify phone number format (+1234567890)
   - Check access token validity
   - Ensure phone number is verified with Meta

4. **Telegram Not Working**:
   - Verify bot token
   - Ensure user has started conversation with bot
   - Check telegram_id format

### Debug Steps

1. **Check n8n Execution Logs**:
   - Go to n8n → Executions
   - Check failed executions for error details

2. **Verify Backend Logs**:
   ```bash
   # Check backend logs for API calls
   tail -f /path/to/backend/logs
   ```

3. **Test Individual Components**:
   - Test each notification platform separately
   - Verify database queries return expected data

## Security Notes

1. **API Key Security**:
   - Use a strong, unique API key for n8n
   - Store securely in environment variables
   - Rotate regularly

2. **Credential Management**:
   - Never commit credentials to version control
   - Use n8n's credential system for sensitive data
   - Enable encryption in n8n

3. **Network Security**:
   - Use HTTPS for all API calls
   - Consider IP whitelisting for n8n access
   - Monitor API usage for anomalies

## Scaling Considerations

- **Free Tier Limits**:
  - WhatsApp: 1000 messages/month
  - Telegram: No limits
  - Gmail SMTP: 500 emails/day

- **Performance**:
  - Workflow processes up to 1000 schedules per run
  - Consider batching for larger user bases
  - Monitor MongoDB performance

## Support

For issues with this integration:

1. Check n8n community forums
2. Review LifeBuddy backend logs
3. Test individual API endpoints
4. Verify all credentials and environment variables
