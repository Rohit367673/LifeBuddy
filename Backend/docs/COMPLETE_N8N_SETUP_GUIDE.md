# Complete LifeBuddy n8n Workflow Setup Guide

## Overview
This guide provides step-by-step instructions for setting up LifeBuddy's automated reminder system using n8n workflows. We have three workflow options based on your requirements.

## Available Workflows

### 1. WORKING_N8N_WORKFLOW.json (Recommended)
- **Platforms**: Email + Telegram
- **Status**: Fully functional
- **Features**: No problematic endpoints, reliable execution
- **Best for**: Users who want email and telegram reminders without WhatsApp

### 2. SIMPLIFIED_N8N_WORKFLOW.json
- **Platforms**: WhatsApp only (via WAHA)
- **Status**: Requires WAHA container setup
- **Features**: Direct WhatsApp messaging, bypasses backend dependencies
- **Best for**: Users who only want WhatsApp reminders

### 3. UPDATED_WAHA_WORKFLOW.json
- **Platforms**: Email + WhatsApp + Telegram
- **Status**: Advanced setup required
- **Features**: Full multi-platform support
- **Best for**: Users who want all three platforms

## Quick Start (Recommended)

### Step 1: Import Working Workflow
1. Open your n8n instance
2. Go to Workflows → Import from File
3. Select `WORKING_N8N_WORKFLOW.json`
4. Save the workflow

### Step 2: Test the Workflow
1. Click "Execute Workflow" in n8n
2. Check the execution log for success messages
3. Verify email and telegram endpoints respond correctly

## Detailed Setup Instructions

### Backend API Configuration
The workflows use these endpoints:
- `GET /api/n8n/schedules/today` - Fetch daily schedules
- `POST /api/n8n/email/send-reminder` - Send email reminders
- `POST /api/n8n/telegram/send-reminder` - Send telegram reminders

**API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzN2ZjOTU4OC01YWNlLTRkNjUtOTYzZS0wZTBiNzFkMjA3ZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU3MzM2NjEzfQ.Ieb9czhWybhL8s1EGa1sTG5VrJF9CbiuSSewspG7ywI`

### WhatsApp Setup (Optional)

If you want WhatsApp reminders, follow these steps:

#### Install WAHA Container
```bash
docker run -it --rm \
  -p 3000:3000/tcp \
  -e WAHA_API_KEY=your-secret-key-321 \
  devlikeapro/waha
```

#### Start WhatsApp Session
```bash
curl -X POST http://localhost:3000/api/sessions/start \
  -H "X-API-Key: your-secret-key-321" \
  -H "Content-Type: application/json" \
  -d '{"name": "default"}'
```

#### Get QR Code
```bash
curl -X GET http://localhost:3000/api/sessions/default/auth/qr \
  -H "X-API-Key: your-secret-key-321"
```

#### Test WhatsApp Messaging
```bash
curl -X POST http://localhost:3000/api/sendText \
  -H "X-API-Key: your-secret-key-321" \
  -H "Content-Type: application/json" \
  -d '{
    "session": "default",
    "chatId": "1234567890@c.us",
    "text": "Test message from LifeBuddy"
  }'
```

## Workflow Scheduling

### Default Schedule
- **Time**: 9:00 AM daily
- **Cron Expression**: `0 9 * * *`
- **Timezone**: Server timezone

### Custom Scheduling
To change the schedule time:
1. Open the workflow in n8n
2. Click on "Daily Schedule Trigger" node
3. Modify the cron expression:
   - `0 8 * * *` = 8:00 AM daily
   - `0 18 * * *` = 6:00 PM daily
   - `0 9 * * 1-5` = 9:00 AM weekdays only

## Troubleshooting

### Common Issues

#### 1. Backend Timeout Errors
**Symptoms**: 300-second timeouts, connection aborted
**Solution**: Use `WORKING_N8N_WORKFLOW.json` which bypasses problematic endpoints

#### 2. req.body Destructuring Errors
**Symptoms**: "Cannot destructure property" errors
**Solution**: Backend has been fixed to handle undefined req.body

#### 3. Mark Reminder Sent Errors
**Symptoms**: 500 errors on "Mark Reminder Sent" step
**Solution**: Use workflows without this step (WORKING or SIMPLIFIED versions)

#### 4. WAHA Connection Issues
**Symptoms**: WhatsApp messages not sending
**Solutions**:
- Ensure WAHA container is running on port 3000
- Verify API key matches in workflow
- Check WhatsApp session status
- Ensure phone numbers are in international format (+1234567890@c.us)

### Testing Commands

#### Test Backend Endpoints
```bash
# Test schedule fetch
curl -X GET "https://lifebuddy-backend-production.up.railway.app/api/n8n/schedules/today" \
  -H "x-api-key: YOUR_API_KEY"

# Test email reminder
curl -X POST "https://lifebuddy-backend-production.up.railway.app/api/n8n/email/send-reminder" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "daily_content": "Test", "title": "Test"}'

# Test telegram reminder
curl -X POST "https://lifebuddy-backend-production.up.railway.app/api/n8n/telegram/send-reminder" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"chatId": "123456789", "daily_content": "Test", "title": "Test"}'
```

## Workflow Comparison

| Feature | WORKING | SIMPLIFIED | UPDATED_WAHA |
|---------|---------|------------|--------------|
| Email | ✅ | ❌ | ✅ |
| Telegram | ✅ | ❌ | ✅ |
| WhatsApp | ❌ | ✅ | ✅ |
| Setup Complexity | Low | Medium | High |
| Dependencies | Backend only | WAHA container | Backend + WAHA |
| Reliability | High | High | Medium |
| Recommended | ✅ | For WhatsApp-only | Advanced users |

## Support

### Log Analysis
Check n8n execution logs for:
- HTTP response codes
- Error messages
- Execution times
- Data flow between nodes

### Backend Logs
Monitor Railway deployment logs for:
- API request details
- Error stack traces
- Response times
- Authentication issues

### Next Steps
1. Start with `WORKING_N8N_WORKFLOW.json`
2. Test email and telegram functionality
3. Add WhatsApp support if needed using WAHA
4. Monitor execution logs for any issues
5. Customize scheduling as required

This setup ensures reliable daily reminders for your LifeBuddy users across multiple platforms.
