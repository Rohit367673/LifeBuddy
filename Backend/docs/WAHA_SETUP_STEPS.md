# WAHA WhatsApp Setup - Like YouTubers Use

## What is WAHA?
WAHA connects to your personal WhatsApp account (like YouTubers do for automation) - no Cloud API needed.

## Step-by-Step Setup

### 1. Start WAHA Container
```bash
docker run -it --rm \
  -p 3000:3000/tcp \
  -e WAHA_API_KEY=your-secret-key-321 \
  devlikeapro/waha
```

### 2. Start WhatsApp Session
```bash
curl -X POST http://localhost:3000/api/sessions/start \
  -H "X-API-Key: your-secret-key-321" \
  -H "Content-Type: application/json" \
  -d '{"name": "default"}'
```

### 3. Get QR Code to Connect Your WhatsApp
```bash
curl -X GET http://localhost:3000/api/sessions/default/auth/qr \
  -H "X-API-Key: your-secret-key-321"
```

### 4. Scan QR Code
- Open WhatsApp on your phone
- Go to Settings → Linked Devices
- Scan the QR code from step 3

### 5. Test WhatsApp Messaging
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

### 6. Import Updated Workflow
Import the updated `WORKING_N8N_WORKFLOW.json` which now uses WAHA at `localhost:3000`

## Phone Number Format
- Use international format: `+1234567890@c.us`
- Example: `+919876543210@c.us` for Indian number

## Keep WAHA Running
The Docker container must stay running for WhatsApp to work. Consider using:
```bash
docker run -d --restart=always \
  -p 3000:3000/tcp \
  -e WAHA_API_KEY=your-secret-key-321 \
  --name waha-lifebuddy \
  devlikeapro/waha
```

This setup connects to your personal WhatsApp like automation tools YouTubers use.
