// Test OpenRouter API connection with DeepSeek R1
const fetch = require('node-fetch');

async function testOpenRouter() {
  // Load API key from environment
  require('dotenv').config();
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
    console.error('❌ Please set your OpenRouter API key in this file or in .env');
    console.log('Get your free API key from: https://openrouter.ai/keys');
    return;
  }

  const model = 'deepseek/deepseek-r1:free';
  const messages = [
    { role: 'system', content: 'You are LifeBuddy AI, a helpful assistant.' },
    { role: 'user', content: 'Hello, can you help me with productivity tips?' }
  ];

  try {
    console.log(`🧪 Testing OpenRouter with model: ${model}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'LifeBuddy (Local)'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      return;
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message;
    // DeepSeek R1 puts response in 'reasoning' field, regular models use 'content'
    const content = (message?.content?.trim?.() || message?.reasoning?.trim?.() || '');
    
    if (content) {
      console.log('✅ OpenRouter API working!');
      console.log('🤖 AI Response:', content);
      console.log('\n📝 Backend is ready - restart your server to use real AI responses!');
    } else {
      console.log('❌ No content found in response');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOpenRouter();
