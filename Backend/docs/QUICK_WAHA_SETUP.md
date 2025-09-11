# Quick WAHA Setup for WhatsApp Messaging

## Problem Solved
Fixed the "Unrecognized node type: @devlikeapro/n8n-nodes-waha.waha" error by using HTTP requests instead of the community node.

## Step 1: Start WAHA Container

```bash
cd /Applications/folders/LifeBuddy/Backend
docker-compose -f docker-compose.waha.yml up -d
```

## Step 2: Setup WhatsApp Session

1. Open: `http://localhost:3000/dashboard/`
2. Login: `waha/waha`
3. Click **Start New Session**
4. Session name: `lifebuddy`
5. Scan QR code with WhatsApp Business (+91 7807932322)
6. Wait for status: **WORKING**

## Step 3: Import Updated Workflow

The `IMPROVED_N8N_WAHA_WORKFLOW.json` now uses HTTP requests:

```json
{
  "name": "Send WhatsApp via WAHA HTTP",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "http://localhost:3000/api/sendText",
    "headers": {
      "X-API-Key": "your-secret-key-321"
    },
    "body": {
      "session": "lifebuddy",
      "chatId": "917807932322@c.us",
      "text": "🚀 LifeBuddy Daily Schedule..."
    }
  }
}
```

## Step 4: Test the Setup

```bash
# Test WAHA API directly
curl -X POST http://localhost:3000/api/sendText \
  -H "X-API-Key: your-secret-key-321" \
  -H "Content-Type: application/json" \
  -d '{
    "session": "lifebuddy",
    "chatId": "917807932322@c.us",
    "text": "Test message from LifeBuddy!"
  }'
```

## Ready to Use

- ✅ No community node installation required
- ✅ Uses standard HTTP Request node
- ✅ Direct WAHA API integration
- ✅ Phone number: +91 7807932322 ready for testing
