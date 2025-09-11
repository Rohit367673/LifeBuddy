# Complete WAHA WhatsApp Agent Setup for n8n

## Step 1: Install WAHA Community Node in n8n

1. Go to **Settings** → **Community nodes**
2. Click **Install**
3. Enter: `@devlikeapro/n8n-nodes-waha`
4. Click **Install** and wait for completion

## Step 2: Setup WAHA Docker Container

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  waha:
    image: devlikeapro/waha
    ports:
      - "3000:3000"
    environment:
      - WAHA_API_KEY=your-secret-key-321
      - WAHA_PRINT_QR=true
      - WAHA_LOG_LEVEL=info
    volumes:
      - ./waha-sessions:/app/sessions
    restart: unless-stopped
    networks:
      - waha-network

networks:
  waha-network:
    driver: bridge
```

Run the container:
```bash
docker-compose up -d waha
```

## Step 3: Configure WAHA Credentials in n8n

1. Go to **Credentials** → **Add credential**
2. Search for "WAHA API"
3. Configure:
   - **Host URL**: `http://localhost:3000`
   - **API Key**: `your-secret-key-321`
4. Test connection and save

## Step 4: Setup WhatsApp Business Session

1. Open WAHA dashboard: `http://localhost:3000/dashboard/`
2. Default login: `waha/waha`
3. Click **Start New Session**
4. Session name: `lifebuddy`
5. Scan QR code with WhatsApp Business account (+91 7807932322)
6. Wait for status: **WORKING**

## Step 5: Import the Improved Workflow

Use the `IMPROVED_N8N_WAHA_WORKFLOW.json` file which includes:

### Key Improvements:
- **Proper WAHA Agent Node**: Uses `@devlikeapro/n8n-nodes-waha.waha` instead of HTTP requests
- **Phone Number Formatting**: Automatically formats phone numbers to WhatsApp chat IDs
- **Better Error Handling**: Enhanced logging and status tracking
- **Markdown Support**: Rich text formatting for WhatsApp messages
- **Session Management**: Uses named session "lifebuddy"

### WhatsApp Node Configuration:
```json
{
  "parameters": {
    "resource": "message",
    "operation": "sendText",
    "sessionName": "lifebuddy",
    "chatId": "={{ $json.whatsapp_chat_id }}",
    "text": "🚀 *LifeBuddy Daily Schedule*...",
    "additionalFields": {
      "parseMode": "markdown"
    }
  }
}
```

## Step 6: Test WhatsApp Delivery

1. Create test user with phone +917807932322
2. Run the test script:
```bash
cd /Applications/folders/LifeBuddy/Backend
node test-schedule-generation.js
```

3. Manually trigger n8n workflow
4. Check WhatsApp for message delivery

## Step 7: Backend API Integration

Ensure your backend has the n8n API endpoints:

```javascript
// /api/n8n/schedules/today
router.get('/schedules/today', async (req, res) => {
  const schedules = await getActiveSchedules();
  res.json(schedules.map(s => ({
    _id: s._id,
    user_id: s.user._id,
    user_email: s.user.email,
    user_phone: s.user.phoneNumber,
    user_telegram_id: s.user.telegramChatId,
    user_name: s.user.displayName,
    title: s.title,
    daily_content: s.generatedSchedule[s.currentDay - 1]?.subtask,
    reminder_platforms: [s.user.notificationPlatform]
  })));
});
```

## Troubleshooting

### WAHA Container Issues:
```bash
# Check container status
docker ps | grep waha

# View logs
docker logs waha_container_name

# Restart container
docker-compose restart waha
```

### Session Problems:
- **QR Code not showing**: Set `WAHA_PRINT_QR=true` in docker-compose.yml
- **Session disconnected**: Re-scan QR code in dashboard
- **Messages not sending**: Check session status is WORKING

### n8n Integration Issues:
- **Credential errors**: Verify API key matches docker environment
- **Node not found**: Ensure WAHA community node is installed
- **Connection failed**: Check WAHA container is running on port 3000

## Production Deployment

For production, update docker-compose.yml:

```yaml
services:
  waha:
    image: devlikeapro/waha
    ports:
      - "3000:3000"
    environment:
      - WAHA_API_KEY=${WAHA_API_KEY}
      - WAHA_WEBHOOK_URL=${N8N_WEBHOOK_URL}
    volumes:
      - waha-sessions:/app/sessions
    restart: unless-stopped

volumes:
  waha-sessions:
```

Set environment variables:
- `WAHA_API_KEY`: Strong random key
- `N8N_WEBHOOK_URL`: Your n8n webhook endpoint

## Testing Checklist

- [ ] WAHA container running
- [ ] WhatsApp session WORKING
- [ ] n8n WAHA node installed
- [ ] Credentials configured
- [ ] Workflow imported
- [ ] Test message sent to +917807932322
- [ ] Backend API endpoints working
- [ ] Daily schedule trigger configured

## Message Format

The workflow sends formatted messages like:

```
🚀 *LifeBuddy Daily Schedule*

Good morning, User! 🌅

*Learn JavaScript Programming*

Day 1: JavaScript Basics - Variables and Data Types

💪 *Today's Motivation:*
_"Every expert was once a beginner. Start your JavaScript journey today!"_

🔗 View Full Schedule: https://www.lifebuddy.space/schedule/123

Powered by *LifeBuddy* - Your AI Productivity Partner 🤖
```
