const fetch = require('node-fetch');

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY || '';
const ELEVEN_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

async function synthesizeWithElevenLabs(text, voiceId = 'Rachel') {
  if (!ELEVEN_API_KEY) {
    throw new Error('Missing ELEVENLABS_API_KEY in environment');
  }
  const url = `${ELEVEN_TTS_URL}/${encodeURIComponent(voiceId)}?optimize_streaming_latency=0`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: String(text || '').slice(0, 5000),
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    })
  });
  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${errTxt}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = { synthesizeWithElevenLabs };



