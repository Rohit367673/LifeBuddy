# WAHA WhatsApp Integration Setup Guide for LifeBuddy

## Overview
WAHA (WhatsApp HTTP API) allows you to use your existing WhatsApp Business account without needing the Cloud API. This is perfect for your use case.

## Setup Steps

### 1. Install WAHA Community Node in n8n
```bash
# In your n8n instance, go to:
# Settings → Community nodes → Install
@devlikeapro/n8n-nodes-waha
```

### 2. Setup WAHA Docker Container
```yaml
# docker-compose.yml
version: '3.8'
services:
  waha:
    image: devlikeapro/waha
    ports:
      - "3000:3000"
    environment:
      - WAHA_API_KEY=your-secret-api-key-321
      - WAHA_WEBHOOK_URL=http://your-n8n-instance/webhook/waha
    volumes:
      - ./waha-sessions:/app/sessions
```

### 3. Start WAHA Container
```bash
docker-compose up -d waha
```

### 4. Configure WAHA Credentials in n8n
1. Go to n8n → Credentials → Add credential
2. Search for "WAHA API"
3. Configure:
   - Host URL: `http://localhost:3000` (or your WAHA server URL)
   - API Key: `your-secret-api-key-321`

### 5. Setup WhatsApp Session
1. Open WAHA Dashboard: `http://localhost:3000/dashboard/`
2. Login with: `waha/waha`
3. Create new session with your phone number
4. Scan QR code with your WhatsApp Business account
5. Wait for session status to show "WORKING"

### 6. Import Updated Workflow
Import the `WAHA_N8N_WORKFLOW.json` file which includes:
- WAHA WhatsApp node instead of Cloud API
- Proper message formatting for WhatsApp Business
- Direct integration with your existing backend

## Key Benefits
- ✅ Uses your existing WhatsApp Business number
- ✅ No Cloud API setup required
- ✅ Free to use (no Meta charges)
- ✅ Full message formatting support
- ✅ Webhook integration for real-time delivery

## Message Format
The workflow sends branded messages like:
```
🚀 *LifeBuddy Daily Schedule*

Good morning, [Name]! 🌅

*Daily Productivity Schedule*

[Your daily content here]

💪 *Today's Motivation:*
"Success is not final, failure is not fatal: it is the courage to continue that counts. Make today count with your LifeBuddy schedule!"

🔗 View Full Schedule: https://www.lifebuddy.space/schedule/[id]

Powered by *LifeBuddy* - Your AI Productivity Partner 🤖
```

## Troubleshooting
- Ensure WAHA container is running: `docker ps`
- Check session status in dashboard
- Verify webhook URL is accessible from WAHA
- Test with a simple message first

## Next Steps
1. Install WAHA node in n8n
2. Setup Docker container
3. Configure credentials
4. Import workflow
5. Test with your WhatsApp Business account
