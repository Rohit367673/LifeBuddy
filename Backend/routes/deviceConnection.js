const express = require('express');
const router = express.Router();
const TelegramBot = require('node-telegram-bot-api');

// Store temporary connection data
const connectionStore = new Map();

// Telegram Bot Setup
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7919506032:AAGqvJJdGCMwqfGvqJLzgNUQEOTRYNhRBBc';
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Generate connection code
function generateConnectionCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Start Telegram connection process
router.post('/telegram/start-connection', async (req, res) => {
    try {
        const { userId, email } = req.body;
        const connectionCode = generateConnectionCode();
        
        // Store connection request
        connectionStore.set(connectionCode, {
            userId,
            email,
            platform: 'telegram',
            timestamp: Date.now(),
            status: 'pending'
        });
        
        // Set expiry (5 minutes)
        setTimeout(() => {
            connectionStore.delete(connectionCode);
        }, 5 * 60 * 1000);
        
        res.json({
            success: true,
            connectionCode,
            instructions: `Send the message "/connect ${connectionCode}" to @LifeBuddyBot on Telegram`,
            botUsername: 'LifeBuddyBot',
            expiresIn: 300 // 5 minutes
        });
    } catch (error) {
        console.error('Telegram connection start error:', error);
        res.status(500).json({ error: 'Failed to start Telegram connection' });
    }
});

// Check Telegram connection status
router.get('/telegram/connection-status/:code', (req, res) => {
    const { code } = req.params;
    const connection = connectionStore.get(code);
    
    if (!connection) {
        return res.json({ status: 'expired', message: 'Connection code expired' });
    }
    
    res.json({
        status: connection.status,
        chatId: connection.chatId,
        username: connection.username
    });
});

// Telegram webhook for bot messages
router.post('/telegram/webhook', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (message && message.text && message.text.startsWith('/connect ')) {
            const connectionCode = message.text.split(' ')[1];
            const connection = connectionStore.get(connectionCode);
            
            if (connection) {
                // Update connection with chat ID
                connection.status = 'connected';
                connection.chatId = message.chat.id.toString();
                connection.username = message.from.username || message.from.first_name;
                
                // Send confirmation to user
                await bot.sendMessage(message.chat.id, 
                    `✅ Successfully connected to LifeBuddy!\n\n` +
                    `🎯 You'll now receive daily schedule reminders here.\n` +
                    `📱 Chat ID: ${message.chat.id}\n\n` +
                    `You can close this chat and return to the LifeBuddy website.`
                );
                
                console.log(`Telegram connected: ${connection.email} -> ${message.chat.id}`);
            } else {
                await bot.sendMessage(message.chat.id, 
                    `❌ Invalid or expired connection code.\n\n` +
                    `Please generate a new code from the LifeBuddy website.`
                );
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Start WhatsApp connection process
router.post('/whatsapp/start-connection', async (req, res) => {
    try {
        const { userId, email, phoneNumber } = req.body;
        const connectionCode = generateConnectionCode();
        
        // Validate phone number format
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }
        
        // Format phone number
        const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
        
        // Store connection request
        connectionStore.set(connectionCode, {
            userId,
            email,
            phoneNumber: formattedPhone,
            platform: 'whatsapp',
            timestamp: Date.now(),
            status: 'pending'
        });
        
        // Set expiry (10 minutes)
        setTimeout(() => {
            connectionStore.delete(connectionCode);
        }, 10 * 60 * 1000);
        
        res.json({
            success: true,
            connectionCode,
            phoneNumber: formattedPhone,
            instructions: `Send "CONNECT ${connectionCode}" to +91 78079 32322 on WhatsApp`,
            expiresIn: 600 // 10 minutes
        });
    } catch (error) {
        console.error('WhatsApp connection start error:', error);
        res.status(500).json({ error: 'Failed to start WhatsApp connection' });
    }
});

// Check WhatsApp connection status
router.get('/whatsapp/connection-status/:code', (req, res) => {
    const { code } = req.params;
    const connection = connectionStore.get(code);
    
    if (!connection) {
        return res.json({ status: 'expired', message: 'Connection code expired' });
    }
    
    res.json({
        status: connection.status,
        phoneNumber: connection.phoneNumber,
        chatId: connection.chatId
    });
});

// WhatsApp webhook for WAHA messages
router.post('/whatsapp/webhook', async (req, res) => {
    try {
        const { body, from } = req.body;
        
        if (body && body.toUpperCase().startsWith('CONNECT ')) {
            const connectionCode = body.split(' ')[1];
            const connection = connectionStore.get(connectionCode);
            
            if (connection && connection.platform === 'whatsapp') {
                // Update connection with WhatsApp chat ID
                connection.status = 'connected';
                connection.chatId = from;
                
                // Send confirmation via WAHA
                const wahaResponse = await fetch('http://localhost:3000/api/sendText', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session: 'default',
                        chatId: from,
                        text: `✅ *LifeBuddy Connected Successfully!*\n\n` +
                              `🎯 You'll receive daily schedule reminders here.\n` +
                              `📱 WhatsApp ID: ${from}\n\n` +
                              `You can now return to the LifeBuddy website.`
                    })
                });
                
                console.log(`WhatsApp connected: ${connection.email} -> ${from}`);
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('WhatsApp webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Get user's connected devices
router.get('/user/:userId/devices', (req, res) => {
    const { userId } = req.params;
    
    // In a real app, this would query a database
    // For now, return mock data
    const devices = [];
    
    for (const [code, connection] of connectionStore.entries()) {
        if (connection.userId === userId && connection.status === 'connected') {
            devices.push({
                platform: connection.platform,
                id: connection.chatId,
                username: connection.username,
                phoneNumber: connection.phoneNumber,
                connectedAt: connection.timestamp
            });
        }
    }
    
    res.json({ devices });
});

module.exports = router;
