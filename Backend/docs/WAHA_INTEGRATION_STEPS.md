# WAHA WhatsApp Integration - Step by Step Setup

## What You Need to Do

### 1. Install WAHA Community Node
In your n8n instance:
1. Go to **Settings** → **Community nodes**
2. Click **Install**
3. Enter: `@devlikeapro/n8n-nodes-waha`
4. Click **Install**

### 2. Setup WAHA Docker Container
Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  waha:
    image: devlikeapro/waha
    ports:
      - "3000:3000"
    environment:
      - WAHA_API_KEY=your-secret-key-321
    volumes:
      - ./waha-sessions:/app/sessions
    restart: unless-stopped
```

Run: `docker-compose up -d waha`

### 3. Configure WAHA Credentials in n8n
1. Go to **Credentials** → **Add credential**
2. Search for "WAHA API"
3. Configure:
   - **Host URL**: `http://localhost:3000`
   - **API Key**: `your-secret-key-321`
4. Test and save

### 4. Setup WhatsApp Business Session
1. Open: `http://localhost:3000/dashboard/`
2. Login: `waha/waha`
3. Click **Start New Session**
4. Enter session name (e.g., "lifebuddy")
5. Scan QR code with your WhatsApp Business account
6. Wait for status: **WORKING**

### 5. Import Updated Workflow
Use the `UPDATED_WAHA_WORKFLOW.json` file which replaces the WhatsApp HTTP request with the WAHA node.

## Key Changes Made

**Before (Your Current Setup):**
```json
{
  "name": "Send WhatsApp Reminder",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://lifebuddy-backend-production.up.railway.app/api/n8n/whatsapp/send-reminder"
  }
}
```

**After (WAHA Integration):**
```json
{
  "name": "Send WhatsApp via WAHA",
  "type": "@devlikeapro/n8n-nodes-waha.waha",
  "parameters": {
    "operation": "sendText",
    "chatId": "={{ $json.user_phone }}",
    "text": "🚀 *LifeBuddy Daily Schedule*..."
  }
}
```

## Benefits
- ✅ Uses your existing WhatsApp Business number
- ✅ No Cloud API required
- ✅ Direct message sending (no backend dependency)
- ✅ Better reliability and formatting
- ✅ Free to use

## Testing
1. Import the new workflow
2. Ensure WAHA session is WORKING
3. Test with a manual execution
4. Check WhatsApp Business for message delivery

## Troubleshooting
- **Session not working**: Restart WAHA container and re-scan QR
- **Messages not sending**: Check WAHA logs: `docker logs <container_name>`
- **Credential errors**: Verify API key matches docker-compose.yml
