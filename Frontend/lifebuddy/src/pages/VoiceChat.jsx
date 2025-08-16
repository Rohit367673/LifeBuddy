import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MicrophoneIcon, StopIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { getApiUrl } from '../utils/config';
import { useAuth } from '../context/AuthContext';

/**
 * VoiceChat.jsx
 *
 * A single-file React component that provides a ChatGPT-like circular voice bubble
 * with responsive animations for these states:
 *  - idle    : small subtle pulse
 *  - listening: mic + ripple + animated level bars (recording or speech-recognizer active)
 *  - thinking : three-dot loader inside circle
 *  - speaking : waveform bars animated while TTS speaks
 *
 * Features:
 *  - Works with Web Speech API (SpeechRecognition) where available (Chrome desktop/Android)
 *  - MediaRecorder fallback for browsers without SpeechRecognition (iOS Safari) — posts audio to /api/ai-chat/ask-audio
 *  - Robust pointer/touch handling for press-and-hold PTT and single-tap toggle
 *  - Responsive sizes (small on mobile, larger on desktop)
 *  - Tailwind CSS classes are used; convert to plain CSS if you don't use Tailwind
 *
 * Usage: drop this file into your React app and import it where needed.
 * Ensure getApiUrl() returns backend origin and you have POST endpoints:
 *   POST `${getApiUrl()}/api/ai-chat/ask` (JSON with { message }) => { response: '...' }
 *   POST `${getApiUrl()}/api/ai-chat/ask-audio` (multipart form-data 'file') => { transcript: '...' } or { response: '...' }
 */

export default function VoiceChat() {
  const { token } = useAuth?.() || {};

  // UI state: 'idle' | 'listening' | 'thinking' | 'speaking'
  const [state, setState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // TTS options
  const [voicePref, setVoicePref] = useState(() => { try { return localStorage.getItem('LB_VOICE_PREF') || 'female'; } catch { return 'female'; } });
  const [ttsRate, setTtsRate] = useState(() => { try { return parseFloat(localStorage.getItem('LB_TTS_RATE') || '0.95'); } catch { return 0.95; } });
  const [ttsPitch, setTtsPitch] = useState(() => { try { return parseFloat(localStorage.getItem('LB_TTS_PITCH') || '1.0'); } catch { return 1.0; } });

  // Refs for recognition/fallback/tts
  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);

  // MediaRecorder fallback
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // TTS voices
  const voicesRef = useRef([]);
  const preferredVoiceRef = useRef(null);

  // internal flags
  const hadSpeechRef = useRef(false);
  const heardSpeechRef = useRef(false);

  const isMobileDevice = useMemo(() => {
    try { return /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768; } catch { return false; }
  }, []);

  // -----------------------
  // Initialize SpeechRecognition (if available)
  // -----------------------
  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        recognitionRef.current = null;
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = false; // PTT sessions handled on press/release
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        recognitionActiveRef.current = true;
        hadSpeechRef.current = false;
        heardSpeechRef.current = false;
      };
      rec.onend = () => {
        recognitionActiveRef.current = false;
      };
      rec.onaudiostart = () => { heardSpeechRef.current = true; };
      rec.onspeechstart = () => { heardSpeechRef.current = true; };

      rec.onresult = async (e) => {
        try {
          const text = (e.results?.[0]?.[0]?.transcript || '').trim();
          if (text.length) hadSpeechRef.current = true;
          setTranscript(text);
          // Move into thinking and call AI
          setState('thinking');
          await handleVoiceQuery(text);
        } catch (err) { console.error('rec.onresult err', err); }
      };

      rec.onerror = (e) => {
        console.warn('SpeechRecognition error', e);
      };

      recognitionRef.current = rec;
    } catch (err) {
      console.error('Speech init error', err);
      recognitionRef.current = null;
    }
  }, []);

  // -----------------------
  // Load voices for TTS
  // -----------------------
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      preferredVoiceRef.current = pickPreferredVoice(voicePref);
    };
    loadVoices();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, [voicePref]);

  const pickPreferredVoice = (pref) => {
    if (!window.speechSynthesis) return null;
    const vs = window.speechSynthesis.getVoices() || [];
    if (!vs.length) return null;
    const female = ['Samantha','Victoria','Fiona','Google UK English Female','Google US English'];
    const male = ['Alex','Daniel','Fred','Google US English'];
    const list = pref === 'male' ? male : female;
    const filtered = vs.filter(v => list.some(n => v.name.toLowerCase().includes(n.toLowerCase())));
    return filtered.length ? filtered[0] : vs[0];
  };

  const speakWithBrowserTTS = async (text) => {
    if (!window.speechSynthesis || isMuted) return;
    try { window.speechSynthesis.cancel(); } catch {}

    if (!preferredVoiceRef.current) preferredVoiceRef.current = pickPreferredVoice(voicePref);
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = preferredVoiceRef.current || null;
    utter.rate = Math.min(1.2, Math.max(0.7, ttsRate));
    utter.pitch = Math.min(2.0, Math.max(0.5, ttsPitch));
    utter.volume = 0.98;
    utter.onstart = () => setState('speaking');
    utter.onend = () => setState('idle');
    utter.onerror = () => setState('idle');

    // Break into short chunks to avoid cutting off long text
    const MAX = 220;
    if (text.length > MAX) {
      const chunks = text.match(new RegExp(`.{1,${MAX}}(\s|$)`, 'g')) || [text];
      for (let i = 0; i < chunks.length; i++) {
        const c = new SpeechSynthesisUtterance(chunks[i]);
        c.voice = utter.voice; c.rate = utter.rate; c.pitch = utter.pitch; c.volume = utter.volume;
        if (i === 0) c.onstart = () => setState('speaking');
        if (i === chunks.length - 1) c.onend = () => setState('idle');
        window.speechSynthesis.speak(c);
      }
    } else {
      window.speechSynthesis.speak(utter);
    }
  };

  // -----------------------
  // Start / Stop PTT
  // -----------------------
  const startPTT = async (ev) => {
    try { ev?.preventDefault?.(); ev?.stopPropagation?.(); } catch {}
    setState('listening');
    hadSpeechRef.current = false;
    heardSpeechRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create analyser for visual bars
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch (err) { analyserRef.current = null; }

      // Prefer SpeechRecognition
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { console.warn('rec start failed', e); }
        return;
      }

      // Fallback: MediaRecorder
      if (!window.MediaRecorder) {
        setErrorMessage('Recording fallback not supported. Use Chrome/Android or implement server-side STT.');
        return;
      }

      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data?.size) recordedChunksRef.current.push(e.data); };
      mr.onerror = (e) => console.error('MediaRecorder error', e);
      mr.start();
    } catch (err) {
      console.error('startPTT mic error', err);
      setErrorMessage('Microphone access denied or unavailable.');
      setState('idle');
      cleanupMedia();
    }
  };

  const stopPTT = async (ev) => {
    try { ev?.preventDefault?.(); ev?.stopPropagation?.(); } catch {}
    // stop analyser / tracks
    cleanupMedia();

    // If SpeechRecognition used, stop it — onresult will fire and we handle AI call there
    if (recognitionRef.current && recognitionActiveRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { console.warn('rec stop', e); }
      // result handler will set thinking and call AI
      return;
    }

    // If we recorded via MediaRecorder, upload and ask server-side STT
    if (mediaRecorderRef.current) {
      try {
        await new Promise((resolve) => { mediaRecorderRef.current.onstop = resolve; mediaRecorderRef.current.stop(); });
      } catch (err) { console.warn('stop recorder err', err); }

      const chunks = recordedChunksRef.current || [];
      recordedChunksRef.current = [];
      mediaRecorderRef.current = null;

      if (!chunks.length) {
        setState('idle');
        return;
      }

      const blob = new Blob(chunks, { type: 'audio/webm' });
      // upload
      setState('thinking');
      try {
        const fd = new FormData();
        fd.append('file', blob, 'ptt.webm');

        const authToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
        const resp = await fetch(`${getApiUrl()}/api/ai-chat/ask-audio`, {
          method: 'POST', headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}, body: fd,
        });

        const data = await resp.json().catch(() => ({}));
        const finalText = data?.transcript || data?.text || '';
        if (finalText) {
          setTranscript(finalText);
          await handleVoiceQuery(finalText);
        } else if (data?.response) {
          setAiReply(data.response);
          await speakWithBrowserTTS(data.response);
        } else {
          setErrorMessage('No transcript from server.');
          setState('idle');
        }
      } catch (err) {
        console.error('audio upload error', err);
        setErrorMessage('Audio upload/transcription failed.');
        setState('idle');
      }
    } else {
      // Nothing recorded and not using recognition, go idle
      setState('idle');
    }
  };

  const cleanupMedia = () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
    } catch {}
    analyserRef.current = null;
  };

  // -----------------------
  // handleVoiceQuery — call AI and TTS
  // -----------------------
  const handleVoiceQuery = async (text) => {
    setTranscript(text);
    setAiReply('');
    if (!text || !text.trim()) { setState('idle'); return; }
    try {
      const authToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
      const resp = await fetch(`${getApiUrl()}/api/ai-chat/ask`, {
        method: 'POST',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      let finalText = '';
      if (resp.ok) {
        const data = await resp.json();
        finalText = (data && (data.response || data.reply || data.message)) || '';
      } else {
        try { finalText = (await resp.json()).message || ''; } catch { finalText = "Sorry, I couldn't get a response."; }
      }

      if (!finalText) finalText = "Sorry, I'm having trouble responding right now.";
      setAiReply(finalText);

      // Speak and animate
      await speakWithBrowserTTS(finalText);
    } catch (err) {
      console.error('handleVoiceQuery error', err);
      setErrorMessage('AI request failed.');
      setState('idle');
    }
  };

  // -----------------------
  // UI helper: animate bars from analyser (optional)
  // -----------------------
  const [levels, setLevels] = useState([0,0,0,0,0]);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      try {
        const analyser = analyserRef.current;
        if (analyser) {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          // sample 5 bands
          const step = Math.max(1, Math.floor(data.length / 5));
          const values = [0,0,0,0,0].map((_,i)=> {
            let sum = 0; for (let j=0;j<step;j++){ sum += data[i*step + j] || 0; } return Math.min(1, (sum / (255*step))*1.6);
          });
          setLevels(values);
        } else {
          // subtle idle animation when not listening
          if (state === 'idle') {
            const idleVals = [0,0,0,0,0].map((_,i)=> 0.04 + 0.02*Math.abs(Math.sin(Date.now()/600 + i)));
            setLevels(idleVals);
          }
        }
      } catch (e) {}
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  // -----------------------
  // Pointer/touch handlers and small toggle
  // -----------------------
  const onPointerDown = (e) => startPTT(e);
  const onPointerUp = (e) => stopPTT(e);
  const onPointerCancel = (e) => stopPTT(e);
  const onPointerLeave = (e) => { if (state === 'listening') stopPTT(e); };

  const togglePTT = async () => { if (state === 'listening') await stopPTT({}); else await startPTT({}); };

  // -----------------------
  // Render circle UI and animations
  // -----------------------
  // Sizes responsive: small on mobile, big on desktop
  const sizeClass = 'w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56';

  return (
    <div className="min-h-screen bg-[#0b1020] text-white flex items-center justify-center p-6">

      <style>{`
        /* bubble animations */
        .bubble-ripple { animation: ripple 1.6s infinite; }
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.6 } 50% { transform: scale(1.14); opacity: 0.95 } 100% { transform: scale(1); opacity: 0.6 } }

        .dot-pulse { animation: dotPulse 1.2s infinite; }
        @keyframes dotPulse { 0% { transform: translateY(0); opacity: 0.6 } 50% { transform: translateY(-6px); opacity: 1 } 100% { transform: translateY(0); opacity: 0.6 } }

        .thinking-dots > div { animation: thinking 1s infinite; }
        .thinking-dots > div:nth-child(1){ animation-delay: 0s } .thinking-dots > div:nth-child(2){ animation-delay: 0.15s } .thinking-dots > div:nth-child(3){ animation-delay: 0.3s }
        @keyframes thinking { 0%{ transform: translateY(0); opacity: 0.35 } 50%{ transform: translateY(-8px); opacity: 1 } 100%{ transform: translateY(0); opacity: 0.35 } }

        .bar { transition: height 120ms linear; }
      `}</style>

      <div className="flex flex-col items-center gap-6">
        {/* bubble */}
        <div className={`relative flex items-center justify-center rounded-full ${sizeClass} bg-gradient-to-br from-sky-400/20 to-blue-900/40 border border-white/10 shadow-2xl`}>

          {/* outer ripple when listening */}
          <div className={`absolute rounded-full inset-0 ${state === 'listening' ? 'bubble-ripple' : ''}`} style={{ boxShadow: state === 'listening' ? '0 10px 30px rgba(59,130,246,0.15)' : 'none' }} />

          {/* inner circle */}
          <div className={`relative rounded-full bg-white/9 flex items-center justify-center ${state === 'listening' ? 'backdrop-blur-sm' : ''} w-5/6 h-5/6`}>

            {/* content per state */}
            {state === 'idle' && (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-200 to-blue-500 flex items-center justify-center shadow-lg">
                  <MicrophoneIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs text-white/70">Tap & hold to speak</div>
              </div>
            )}

            {state === 'listening' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/90 flex items-center justify-center shadow-lg">
                  <StopIcon className="w-6 h-6 text-white" />
                </div>

                {/* animated bars showing levels */}
                <div className="flex items-end gap-1 h-8">
                  {levels.map((v,i)=>(
                    <div key={i} className="w-2 rounded bar bg-white" style={{ height: `${6 + v*36}px`, opacity: 0.9 }} />
                  ))}
                </div>

                <div className="text-xs text-white/80">Listening...</div>
              </div>
            )}

            {state === 'thinking' && (
              <div className="flex flex-col items-center gap-2">
                <div className="thinking-dots flex items-end gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/90" />
                  <div className="w-3 h-3 rounded-full bg-white/70" />
                  <div className="w-3 h-3 rounded-full bg-white/50" />
                </div>
                <div className="text-xs text-white/80">Thinking...</div>
              </div>
            )}

            {state === 'speaking' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/90 flex items-center justify-center shadow-lg">
                    <SpeakerWaveIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex items-end gap-1 h-8">
                  {levels.map((v,i)=>(
                    <div key={i} className="w-2 rounded bg-white/90 bar" style={{ height: `${8 + (0.2 + 0.8*Math.abs(Math.sin((Date.now()/200)+i)))*36}px` }} />
                  ))}
                </div>
                <div className="text-xs text-white/80">Speaking...</div>
              </div>
            )}

          </div>

          {/* press/hold transparent overlay to capture pointer/touch */}
          <button
            aria-label="Push to Talk"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerLeave={onPointerLeave}
            onClick={(e)=>{ e.preventDefault(); togglePTT(); }}
            className="absolute inset-0 rounded-full bg-transparent"
            style={{ touchAction: 'manipulation' }}
          />
        </div>

        {/* transcript / ai reply */}
        <div className="max-w-xl text-center text-sm text-white/80 px-4">
          {state === 'listening' && (<div>Listening... {transcript ? ` — ${transcript}` : ''}</div>)}
          {state === 'thinking' && (<div>Processing your message...</div>)}
          {state === 'speaking' && (<div>Speaking: {aiReply ? aiReply.substring(0,120) + (aiReply.length>120? '...':'') : ''}</div>)}
          {state === 'idle' && (<div>{transcript ? `You: ${transcript}` : 'Ready — tap & hold the circle to speak'}</div>)}
        </div>

        {/* small controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/6 px-3 py-1 rounded-full border border-white/8">
            <button onClick={() => { setVoicePref('female'); try{localStorage.setItem('LB_VOICE_PREF','female')}catch{} preferredVoiceRef.current = pickPreferredVoice('female'); }} className={`text-xs px-2 py-1 rounded-full ${voicePref === 'female' ? 'bg-white text-blue-700' : 'text-white/80'}`}>Female</button>
            <button onClick={() => { setVoicePref('male'); try{localStorage.setItem('LB_VOICE_PREF','male')}catch{} preferredVoiceRef.current = pickPreferredVoice('male'); }} className={`text-xs px-2 py-1 rounded-full ${voicePref === 'male' ? 'bg-white text-blue-700' : 'text-white/80'}`}>Male</button>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/70">
            <label>Rate</label>
            <input type="range" min="0.7" max="1.2" step="0.05" value={ttsRate} onChange={(e)=>{ const v=parseFloat(e.target.value); setTtsRate(v); try{localStorage.setItem('LB_TTS_RATE',String(v))}catch{} }} />
            <label>Pitch</label>
            <input type="range" min="0.6" max="1.6" step="0.05" value={ttsPitch} onChange={(e)=>{ const v=parseFloat(e.target.value); setTtsPitch(v); try{localStorage.setItem('LB_TTS_PITCH',String(v))}catch{} }} />
          </div>

          <button onClick={() => setIsMuted(s => !s)} className="text-xs px-3 py-1 rounded-full bg-white/6 border border-white/8">
            {isMuted ? 'Muted' : 'TTS On'}
          </button>
        </div>

        {errorMessage && <div className="text-xs text-red-400">{errorMessage}</div>}

      </div>
    </div>
  );
}
