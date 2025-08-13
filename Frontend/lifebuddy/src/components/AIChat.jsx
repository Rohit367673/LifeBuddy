import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/config';
import { PaperAirplaneIcon, MicrophoneIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function AIChat() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('LB_CHAT_HISTORY') || '[]'); } catch (_) { return []; }
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const endRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  const aiName = user?.aiAssistantName || 'LifeBuddy';

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);
  useEffect(() => { try { localStorage.setItem('LB_CHAT_HISTORY', JSON.stringify(messages)); } catch (_) {} }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(140, Math.max(44, el.scrollHeight)) + 'px';
  }, [input]);

  const sendMessage = async (text) => {
    if (!text || sending) return;
    const userMsg = { id: Date.now(), role: 'user', content: text, ts: Date.now() };
    const aiMsgId = userMsg.id + 1;
    setMessages(prev => [...prev, userMsg, { id: aiMsgId, role: 'assistant', content: '', ts: Date.now() }]);
    setSending(true);
    setInput('');

    try {
      abortRef.current = new AbortController();
      const resp = await fetch(`${getApiUrl()}/api/ai-chat/stream`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: abortRef.current.signal
      });
      if (!resp.ok || !resp.body) throw new Error('Stream failed');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false; let acc = '';
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) { done = true; break; }
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: acc } : m));
      }
    } catch (e) {
      // Fallback to /ask
      try {
        const alt = await fetch(`${getApiUrl()}/api/ai-chat/ask`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text })
        });
        const data = await alt.json().catch(() => ({}));
        const out = alt.ok ? (data.response || 'Okay.') : (data.message || 'Sorry, I could not respond.');
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: out } : m));
      } catch (_) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Sorry, I could not connect to the AI.' } : m));
      }
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    await sendMessage(text);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (text) sendMessage(text);
    }
  };

  const copyText = async (id, text) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 1200); } catch (_) {}
  };

  return (
    <div className="min-h-screen pt-16 bg-[radial-gradient(800px_circle_at_10%_10%,rgba(59,130,246,.08),transparent_40%),radial-gradient(700px_circle_at_90%_30%,rgba(16,185,129,.08),transparent_40%)]">
      {/* Header */}
      <div className="sticky top-16 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/40 bg-white/80 border-b border-white/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500" />
            <div className="text-slate-700 font-semibold">{aiName}</div>
            <span className="ml-1 inline-block w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <a href="/ai-voice" className="text-xs px-3 py-1 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1"><MicrophoneIcon className="w-4 h-4"/>Voice</a>
        </div>
      </div>

      {/* Chat */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="mt-14 mb-24 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <div className="text-lg font-medium mb-2">Start a conversation</div>
              <div className="text-sm">Ask for plans, steps, summaries, or help with your schedule.</div>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${m.role==='user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-800'}`}>
                <div className="whitespace-pre-wrap text-sm leading-6">{m.content}</div>
                <div className="mt-2 text-[10px] opacity-60">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                {m.role==='assistant' && m.content && (
                  <button onClick={()=>copyText(m.id, m.content)} className="absolute -right-2 -top-2 bg-white border border-slate-200 rounded-full p-1 shadow hover:shadow-md">
                    {copiedId===m.id ? <CheckIcon className="w-4 h-4 text-emerald-600"/> : <ClipboardDocumentIcon className="w-4 h-4 text-slate-600"/>}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/80 to-white/30 backdrop-blur border-t border-white/50">
        <form onSubmit={onSubmit} className="max-w-4xl mx-auto px-4 py-3 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={`Message ${aiName}`}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={!input.trim() || sending} className="rounded-xl px-4 py-3 bg-blue-600 text-white shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
            <PaperAirplaneIcon className="w-4 h-4"/>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
