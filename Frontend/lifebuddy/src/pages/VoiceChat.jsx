import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { getApiUrl } from '../utils/config';
import { useAuth } from '../context/AuthContext';

export default function VoiceChat() {
  const { token } = useAuth();
  const [isTalking, setIsTalking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioDataRef = useRef(new Uint8Array(64));
  const [aiReply, setAiReply] = useState('');
  const bgCanvasRef = useRef(null);
  const avatarCanvasRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hadSpeechRef = useRef(false);
  const voicesRef = useRef([]);
  const preferredVoiceRef = useRef(null);
  const [voicePref, setVoicePref] = useState(() => {
    try { return localStorage.getItem('LB_VOICE_PREF') || 'female'; } catch (_) { return 'female'; }
  });
  const [ttsRate, setTtsRate] = useState(() => {
    try { return parseFloat(localStorage.getItem('LB_TTS_RATE') || '0.85'); } catch (_) { return 0.85; }
  });
  const [ttsPitch, setTtsPitch] = useState(() => {
    try { return parseFloat(localStorage.getItem('LB_TTS_PITCH') || '1.0'); } catch (_) { return 1.0; }
  });

  // Performance profile
  const PERF = useMemo(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    return {
      dpr: Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5),
      fps2d: isMobile ? 24 : 30,
      pathCount: isMobile ? 10 : 18,
      particleCount: isMobile ? 60 : 120,
    };
  }, []);

  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorMessage('Voice not supported on this browser. Try Chrome desktop or Android Chrome.');
        return;
      }
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onstart = () => { recognitionActiveRef.current = true; };
      rec.onend = () => { recognitionActiveRef.current = false; };
      rec.onresult = async (e) => {
        try {
          const text = (e.results?.[0]?.[0]?.transcript || '').trim();
          if (text.length > 0) hadSpeechRef.current = true;
          await handleVoiceQuery(text);
        } catch (err) {
          console.error('Voice handler error', err);
        }
      };
      rec.onerror = (e) => {
        console.error('Speech error', e);
      };
      recognitionRef.current = rec;
    } catch (err) {
      console.error('Speech init error', err);
      setErrorMessage('Failed to initialize voice.');
    }
  }, [token]);

  // Lightweight 2D avatar canvas
  useEffect(() => {
    const canvas = avatarCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let rafId;
    let lastFrame = 0;
    
    // Avatar state
    let blinkPhase = 0;
    let nextBlinkAt = performance.now() + 2000 + Math.random() * 3000;
    let mouthOpen = 0;
    let headBob = 0;
    
    function resize() {
      const isDesktop = window.innerWidth >= 1024;
      const sidebar = isDesktop ? 256 : 0;
      const header = 64;
      const width = window.innerWidth - sidebar;
      const height = window.innerHeight - header;
      
      canvas.width = Math.floor(width * PERF.dpr);
      canvas.height = Math.floor(height * PERF.dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.style.left = sidebar + 'px';
      canvas.style.top = header + 'px';
      ctx.setTransform(PERF.dpr, 0, 0, PERF.dpr, 0, 0);
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    const animate = () => {
      const now = performance.now();
      if (now - lastFrame < (1000 / PERF.fps2d)) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      lastFrame = now;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width / PERF.dpr, canvas.height / PERF.dpr);
      
      // Blink logic
      if (now >= nextBlinkAt) {
        blinkPhase = 1;
        nextBlinkAt = now + 2500 + Math.random() * 3000;
      }
      if (blinkPhase > 0) {
        blinkPhase = Math.max(0, blinkPhase - 0.15);
      }
      
      // Mouth animation
      if (isTalking) {
        mouthOpen = Math.min(1, mouthOpen + 0.1);
      } else if (isSpeaking) {
        const t = now * 0.006;
        mouthOpen = Math.abs(Math.sin(t) * 0.8);
      } else {
        mouthOpen = Math.max(0, mouthOpen - 0.05);
      }
      
      // Head movement when speaking
      if (isSpeaking) {
        const t = now * 0.0016;
        headBob = Math.sin(t * 1.3) * 0.02;
      } else {
        headBob = Math.max(0, headBob - 0.01);
      }
      
      // Draw ChatGPT-style circular avatar with movements
      const centerX = (canvas.width / PERF.dpr) / 2;
      const centerY = (canvas.height / PERF.dpr) / 2;
      const baseSize = Math.min(canvas.width, canvas.height) / PERF.dpr * 0.25; // Smaller size
      
      // Dynamic size changes based on voice activity (like ChatGPT)
      let dynamicSize = baseSize;
      if (isTalking) {
        dynamicSize = baseSize * 1.1; // Grow when talking
      } else if (isSpeaking) {
        dynamicSize = baseSize * 1.05; // Slightly grow when AI speaks
      } else {
        dynamicSize = baseSize * 0.95; // Slightly shrink when idle
      }
      
      // Add breathing effect
      const breathing = Math.sin(performance.now() * 0.003) * 0.02;
      dynamicSize *= (1 + breathing);
      
      // Create smooth blue gradient like ChatGPT (from center)
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, dynamicSize
      );
      gradient.addColorStop(0, '#ffffff'); // Pure white center
      gradient.addColorStop(0.2, '#e3f2fd'); // Light blue
      gradient.addColorStop(0.5, '#bbdefb'); // Medium light blue
      gradient.addColorStop(0.8, '#90caf9'); // Medium blue
      gradient.addColorStop(1, '#64b5f6'); // Deeper blue at edges
      
      // Main circle with ChatGPT blue gradient
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY + headBob * dynamicSize, dynamicSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Inner highlight for premium look
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX - dynamicSize * 0.2, centerY - dynamicSize * 0.2 + headBob * dynamicSize, dynamicSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // The avatar now has smooth movements like ChatGPT voice chat
      
      rafId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [isTalking, isSpeaking, PERF.dpr, PERF.fps2d]);

  // Animated cyber background (circuit lines, pulses, particles) on 2D canvas
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId;
    let t0 = performance.now();
    const DPR = PERF.dpr;
    let last = 0;
    let running = true;

    function resize() {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Generate circuit paths
    const paths = [];
    const nodes = [];
    const particles = [];
    const pathCount = PERF.pathCount;
    const particleCount = PERF.particleCount;

    // Create circuit paths
    for (let i = 0; i < pathCount; i++) {
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY + (Math.random() - 0.5) * 200;
      paths.push({
        x1: startX, y1: startY,
        x2: endX, y2: endY,
        progress: Math.random(),
        speed: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.4
      });
    }

    // Create nodes
    for (let i = 0; i < pathCount / 2; i++) {
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 2 + Math.random() * 4,
        pulse: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03
      });
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.4
      });
    }

    function animate(t) {
      if (!running) return;
      
      if (t - last < (1000 / PERF.fps2d)) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      last = t;

      const dt = t - t0;
      t0 = t;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(11, 16, 32, 0.1)';
      ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);

      // Update and draw paths
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      paths.forEach(path => {
        path.progress += path.speed * dt * 0.001;
        if (path.progress > 1) path.progress = 0;

        const x = path.x1 + (path.x2 - path.x1) * path.progress;
        const y = path.y1 + (path.y2 - path.y1) * path.progress;

        ctx.globalAlpha = path.alpha;
        ctx.beginPath();
        ctx.moveTo(path.x1, path.y1);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // Update and draw nodes
      ctx.fillStyle = '#60a5fa';
      nodes.forEach(node => {
        node.pulse += node.speed * dt;
        const scale = 1 + Math.sin(node.pulse) * 0.3;
        
        ctx.globalAlpha = 0.6 + Math.sin(node.pulse) * 0.2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw particles
      ctx.fillStyle = '#93c5fd';
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = window.innerWidth;
        if (particle.x > window.innerWidth) particle.x = 0;
        if (particle.y < 0) particle.y = window.innerHeight;
        if (particle.y > window.innerHeight) particle.y = 0;

        ctx.globalAlpha = particle.alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(animate);
    }

    // Pause animation when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else {
        running = true;
        t0 = performance.now();
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    rafId = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [PERF.dpr, PERF.fps2d, PERF.pathCount, PERF.particleCount]);

  // Voice functions
  const startPTT = async (ev) => {
    if (ev?.preventDefault) ev.preventDefault();
      setIsTalking(true);
    hadSpeechRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      if (recognitionRef.current && !recognitionActiveRef.current) {
      recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Microphone access error:', err);
      setIsTalking(false);
    }
  };

  const stopPTT = async (ev) => {
    if (ev?.preventDefault) ev.preventDefault();
    setIsTalking(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        if (recognitionActiveRef.current) {
      recognitionRef.current.stop();
        }
      } catch (_) {}
    }
    analyserRef.current = null;

    // If user released without speech, play a friendly prompt
    if (!hadSpeechRef.current) {
      const prompt = 'Hey there! How can I help you today?';
      setAiReply(prompt);
      try { await speakWithBrowserTTS(prompt); } catch (_) {}
    }
  };

  // Core handler for voice queries (stream → fallback → TTS)
  const handleVoiceQuery = async (text) => {
    setTranscript(text);
    setAiReply('');
    try {
      if (!text || text.trim().length === 0) return; // Empty handled on release

      // Try streaming with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(`${getApiUrl()}/api/ai-chat/stream`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      let finalText = '';

      if (resp.ok && resp.body) {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          if (d) { done = true; break; }
          const chunk = decoder.decode(value, { stream: true });
          finalText += chunk;
          setAiReply(prev => prev + chunk);
        }
      } else {
        // Try to parse error
        let errMsg = '';
        try { const j = await resp.json(); errMsg = j.message || ''; } catch (_) { try { errMsg = await resp.text(); } catch (_) {} }
        if (resp.status === 401 || resp.status === 402 || resp.status === 403) {
          finalText = errMsg || 'This feature requires a premium subscription or your session is not authorized.';
        }

        // Fallback to non-streaming endpoint if not an auth error
        if (!finalText) {
          const controller2 = new AbortController();
          const t2 = setTimeout(() => controller2.abort(), 12000);
          const alt = await fetch(`${getApiUrl()}/api/ai-chat/ask`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
            signal: controller2.signal
          });
          clearTimeout(t2);
          if (alt.ok) {
            const data = await alt.json();
            finalText = data.response || '';
            setAiReply(finalText);
          } else {
            let err2 = '';
            try { const j2 = await alt.json(); err2 = j2.message || ''; } catch (_) { try { err2 = await alt.text(); } catch (_) {} }
            finalText = err2 || 'Sorry, I could not get a response from the AI service.';
          }
        }
      }

      if (!finalText || finalText.trim().length === 0) {
        finalText = "Sorry, I'm having trouble responding right now.";
      }
      setAiReply(finalText);
      await speakWithBrowserTTS(finalText);
    } catch (err) {
      console.error('Voice stream error', err);
      const finalText = "Sorry, I'm having trouble connecting to the AI right now.";
      setAiReply(finalText);
      try { await speakWithBrowserTTS(finalText); } catch (_) {}
    }
  };

  // Voice selection
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      voicesRef.current = voices;
      preferredVoiceRef.current = pickPreferredVoice(voicePref);
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [voicePref]);

  const pickPreferredVoice = (pref) => {
    const voices = voicesRef.current;
    if (!voices.length) return null;
    
    // Prefer clearer voices per platform; fallbacks included
    const femalePrefs = ['Samantha', 'Victoria', 'Fiona', 'Google UK English Female', 'Microsoft Zira'];
    const malePrefs = ['Alex', 'Daniel', 'Fred', 'Google US English', 'Microsoft David'];
    const prefList = pref === 'female' ? femalePrefs : malePrefs;
    const filtered = voices.filter(v =>
      prefList.some(name => v.name.toLowerCase().includes(name.toLowerCase()))
    );
    
    return filtered.length ? filtered[0] : voices[0];
  };

  const speakWithBrowserTTS = async (text) => {
    if (!window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = preferredVoiceRef.current;
    utterance.rate = Math.min(1.1, Math.max(0.7, ttsRate));
    utterance.pitch = Math.min(2.0, Math.max(0.5, ttsPitch));
    utterance.volume = 0.95;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Split long text into chunks for better performance
    const maxLength = 200;
    if (text.length > maxLength) {
      const chunks = text.match(new RegExp(`.{1,${maxLength}}(\\s|$)`, 'g')) || [text];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = new SpeechSynthesisUtterance(chunks[i]);
        chunk.voice = preferredVoiceRef.current;
        chunk.rate = Math.min(1.1, Math.max(0.7, ttsRate));
        chunk.pitch = Math.min(2.0, Math.max(0.5, ttsPitch));
        chunk.volume = 0.95;
        
        if (i === 0) chunk.onstart = () => setIsSpeaking(true);
        if (i === chunks.length - 1) chunk.onend = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(chunk);
      }
    } else {
      window.speechSynthesis.speak(utterance);
    }
  };

  // Animated background CSS
  const animatedBgCss = useMemo(() => `
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .ai-voice-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      background: radial-gradient(1000px circle at 10% 10%, rgba(59,130,246,0.25), transparent 40%),
                  radial-gradient(900px circle at 90% 30%, rgba(37,99,235,0.2), transparent 40%),
                  linear-gradient(120deg, #0b1020, #0e1b3a, #0a246a, #0b1020);
      background-size: 200% 200%;
      animation: gradientShift 12s ease-in-out infinite;
      filter: saturate(1.2) contrast(1.05);
    }
    .glass {
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.12);
    }
  `, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <style>{animatedBgCss}</style>
      <div className="ai-voice-bg" style={{ zIndex: 0, position: 'fixed' }} />
      <canvas ref={bgCanvasRef} className="fixed inset-0" style={{ zIndex: 200, pointerEvents: 'none' }} />

      {/* Lightweight avatar canvas */}
      <canvas ref={avatarCanvasRef} className="fixed" style={{ zIndex: 1200, pointerEvents: 'none' }} />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 p-4 flex items-center justify-between" style={{ zIndex: 2000 }}>
        <h1 className="text-white/90 text-xl font-semibold">Voice Chat</h1>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs text-white/80 max-w-lg truncate">
            {transcript || 'Hold the mic to speak'}
          </div>
          {errorMessage && (
            <div className="text-xs px-2 py-1 rounded bg-red-500/20 border border-red-400/40 text-red-100">
              {errorMessage}
            </div>
          )}
          {/* Voice preference */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1">
            <button
              onClick={() => { setVoicePref('female'); try { localStorage.setItem('LB_VOICE_PREF','female'); } catch (_) {} preferredVoiceRef.current = pickPreferredVoice('female'); }}
              className={`text-xs px-2 py-1 rounded-full ${voicePref==='female' ? 'bg-white text-blue-700' : 'text-white/80 hover:text-white'}`}
            >Female</button>
            <button
              onClick={() => { setVoicePref('male'); try { localStorage.setItem('LB_VOICE_PREF','male'); } catch (_) {} preferredVoiceRef.current = pickPreferredVoice('male'); }}
              className={`text-xs px-2 py-1 rounded-full ${voicePref==='male' ? 'bg-white text-blue-700' : 'text-white/80 hover:text-white'}`}
            >Male</button>
            {/* Clarity controls */}
            <div className="hidden md:flex items-center gap-2 ml-2 text-white/80">
              <label className="text-[10px]">Rate</label>
              <input type="range" min="0.7" max="1.1" step="0.05" value={ttsRate} onChange={(e)=>{ const v=parseFloat(e.target.value); setTtsRate(v); try{localStorage.setItem('LB_TTS_RATE',String(v));}catch(_){} }} />
              <label className="text-[10px]">Pitch</label>
              <input type="range" min="0.6" max="1.6" step="0.05" value={ttsPitch} onChange={(e)=>{ const v=parseFloat(e.target.value); setTtsPitch(v); try{localStorage.setItem('LB_TTS_PITCH',String(v));}catch(_){} }} />
            </div>
          </div>
        </div>
      </div>

      {/* Reply bubble */}
      {aiReply && (
        <div className="fixed left-4 right-4 bottom-24 sm:left-8 sm:right-auto sm:max-w-xl p-4 rounded-2xl glass text-white/90" style={{ zIndex: 2000 }}>
          {aiReply}
        </div>
      )}

      {/* Push-to-talk button */}
      <div className="fixed right-4 bottom-6" style={{ zIndex: 2000 }}>
            <button
              onMouseDown={startPTT}
              onMouseUp={stopPTT}
              onTouchStart={startPTT}
              onTouchEnd={stopPTT}
          className={`px-5 py-3 rounded-full text-white shadow-xl transition-colors flex items-center gap-2 ${isTalking ? 'bg-red-500' : 'bg-blue-600'}`}
          aria-label="Push to talk"
            >
              {isTalking ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
              {isTalking ? 'Release to stop' : 'Hold to talk'}
            </button>
      </div>
    </div>
  );
}


