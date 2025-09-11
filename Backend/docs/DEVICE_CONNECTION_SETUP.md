# Device Connection Setup Guide

## Overview
This system allows users to connect their Telegram and WhatsApp accounts to receive daily schedule reminders directly on their devices.

## How It Works

### 1. Telegram Connection
- User clicks "Connect Telegram" on the website
- System generates a unique connection code
- User sends `/connect CODE` to @LifeBuddyBot on Telegram
- Bot confirms connection and stores chat ID
- Daily reminders are sent to the connected Telegram chat

### 2. WhatsApp Connection  
- User enters phone number and clicks "Connect WhatsApp"
- System generates a unique connection code
- User sends "CONNECT CODE" to the LifeBuddy WhatsApp number
- WAHA webhook processes the message and confirms connection
- Daily reminders are sent via WhatsApp

## Backend Components

### Device Connection Routes (`/api/device-connection/`)
- `POST /telegram/start-connection` - Start Telegram connection process
- `GET /telegram/connection-status/:code` - Check connection status
- `POST /telegram/webhook` - Handle Telegram bot messages
- `POST /whatsapp/start-connection` - Start WhatsApp connection process
- `GET /whatsapp/connection-status/:code` - Check WhatsApp connection status
- `POST /whatsapp/webhook` - Handle WhatsApp WAHA messages
- `GET /user/:userId/devices` - Get user's connected devices

### Telegram Bot
- Bot token: `7919506032:AAGqvJJdGCMwqfGvqJLzgNUQEOTRYNhRBBc`
- Handles `/start`, `/help`, and `/connect` commands
- Provides user guidance and connection confirmation

## Frontend Component

### DeviceConnection.jsx
- React component for device connection interface
- Real-time status polling during connection process
- Shows connected devices and connection instructions
- Handles both Telegram and WhatsApp connection flows

## Usage Flow

1. User visits `/connect-devices` page
2. Chooses platform (Telegram or WhatsApp)
3. Follows connection instructions
4. System polls for connection status
5. Shows success message when connected
6. User receives daily reminders on connected devices

## Integration with n8n

The connected device IDs can be used in n8n workflows:
- Telegram: Use `chatId` from connection data
- WhatsApp: Use `phoneNumber` and `chatId` from connection data

## Security Features

- Connection codes expire after 5-10 minutes
- Unique codes prevent unauthorized connections
- User authentication required for connection initiation
- Webhook validation for message processing

## Testing

1. Start the backend server
2. Start the Telegram bot (if not using webhook)
3. Set up WAHA for WhatsApp (if using WhatsApp)
4. Visit `/connect-devices` on the frontend
5. Follow connection process for each platform
6. Verify devices appear in connected devices list
