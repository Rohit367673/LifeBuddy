import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/config';
import { PaperAirplaneIcon, ClipboardDocumentIcon, CheckIcon, LockClosedIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';
import { usePremium } from '../context/PremiumContext';

export default function AIChat() {
  const { token, user } = useAuth();
  const { hasPremiumAccess } = usePremium();
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('LB_CHAT_HISTORY') || '[]'); } catch (_) { return []; }
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const endRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
 
  const [showNotice, setShowNotice] = useState(() => {
    try { return localStorage.getItem('LB_CHAT_24H_NOTICE') !== 'dismissed'; } catch (_) { return true; }
  });
  const dismissNotice = () => { try { localStorage.setItem('LB_CHAT_24H_NOTICE', 'dismissed'); } catch (_) {} setShowNotice(false); };
 
  const aiName = user?.aiAssistantName || 'LifeBuddy AI';
  const isPremium = hasPremiumAccess();

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
      const apiUrl = await getApiUrl();
      const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      const resp = await fetch(`${apiUrl}/api/ai-chat/ask`, {
        method: 'POST', headers, body: JSON.stringify({ message: text })
      });
      const data = await resp.json().catch(() => ({}));
      const out = resp.ok ? (data.response || 'Okay.') : (data.message || 'Sorry, I could not respond.');
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: out } : m));
    } catch (e) {

      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Sorry, I could not connect to the AI.' } : m));

      // Fallback to /ask
      try {
        const apiUrl = await getApiUrl();
        const alt = await fetch(`${apiUrl}/api/ai-chat/ask`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text })
        });
        const data = await alt.json().catch(() => ({}));
        const out = alt.ok ? (data.response || 'Okay.') : (data.message || 'Sorry, I could not respond.');
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: out } : m));
      } catch (_) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Sorry, I could not connect to LifeBuddy AI.' } : m));
      }

    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // Pretty formatting for AI responses
  // - Handles Topic: ..., numbered/dash bullets, headings ###, and code fences
  // ==========================================
  const extractAiFormatting = (text = '') => {
    const out = { topic: '', bullets: [], paragraphs: [], teaser: '' };
    if (!text || typeof text !== 'string') return out;
    let t = text
      .replace(/\*\*/g, '')
      .replace(/\s+\n/g, '\n')
      // normalize bullet characters to dashes for easier parsing
      .replace(/^\s*[•–—]\s+/gm, '- ')
      .trim();
    const topicMatch = t.match(/(?:Today[’']s\s+topic|Topic)\s*:\s*(.+?)(?:\n|\.|$)/i);
    if (topicMatch) out.topic = topicMatch[1].replace(/\s*🚀$/, '').trim();
    const itemRegex = /(\d{1,2})\.\s+([^]+?)(?=(?:\s+\d{1,2}\.\s+)|$)/g;
    const bullets = [];
    let m;
    while ((m = itemRegex.exec(t)) !== null) bullets.push(m[2].trim());
    if (!bullets.length) {
      // try dash bullets
      const lines = t.split(/\r?\n/).map(s=>s.trim());
      const dashed = lines.filter(l => /^[-*•]\s+/.test(l)).map(l => l.replace(/^[-*•]\s+/, ''));
      if (dashed.length) bullets.push(...dashed);
    }
    out.bullets = bullets;
    const teaserMatch = t.match(/(Mini[- ]?project[^:]*:|Teaser:|By the end[^:]*:?)\s*([^]+?)(?:$|\n)/i);
    if (teaserMatch) out.teaser = teaserMatch[2].trim();
    const stripped = t.replace(itemRegex, '').replace(/(?:Today[’']s\s+topic|Topic)\s*:.+?(?:\n|\.|$)/i, '').trim();
    if (stripped) {
      out.paragraphs = stripped.split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
    }
    return out;
  };

  const renderInlineBlocks = (raw = '') => {
    const lines = String(raw || '').split(/\r?\n/);
    const nodes = [];
    let key = 0, para = [], listType = null, listItems = [];
    const renderInlineCodeSegments = (s = '') => {
      const parts = String(s).split(/`([^`]+)`/g);
      return (
        <>
          {parts.map((part, i) => (
            i % 2 === 1
              ? <code key={i} className="px-1 py-0.5 rounded bg-slate-100 text-slate-800">{part}</code>
              : <span key={i}>{part}</span>
          ))}
        </>
      );
    };
    const flushPara = () => { if (para.length) { nodes.push(<p key={`p-${key++}`} className="mt-1 break-words">{renderInlineCodeSegments(para.join(' '))}</p>); para = []; } };
    const flushList = () => {
      if (!listItems.length) return;
      if (listType === 'ul') nodes.push(<ul key={`ul-${key++}`} className="list-disc pl-5 space-y-1 text-slate-700 break-words">{listItems.map((it,i)=>(<li key={i} className="leading-relaxed">{renderInlineCodeSegments(it)}</li>))}</ul>);
      if (listType === 'ol') nodes.push(<ol key={`ol-${key++}`} className="list-decimal pl-5 space-y-1 text-slate-700 break-words">{listItems.map((it,i)=>(<li key={i} className="leading-relaxed">{renderInlineCodeSegments(it)}</li>))}</ol>);
      listType = null; listItems = [];
    };
    for (const l of lines) {
      const line = l.trim();
      if (!line) { flushPara(); flushList(); continue; }
      const h3 = line.match(/^###\s+(.+)/); const h4 = line.match(/^####\s+(.+)/);
      const ul = line.match(/^[-*•]\s+(.+)/); const ol = line.match(/^(\d{1,2})\.\s+(.+)/);
      const isCodeLike = /<\/?[a-zA-Z][^>]*>/.test(line) || /^(const|let|var|function|class)\b/.test(line);
      if (isCodeLike) { flushPara(); flushList(); nodes.push(<pre key={`code-${key++}`} className="mt-2 rounded-lg bg-slate-900 text-slate-100 p-3 overflow-auto text-xs max-w-full"><code>{line}</code></pre>); continue; }
      if (h3) { flushPara(); flushList(); nodes.push(<div key={`h3-${key++}`} className="font-semibold text-slate-900 mt-2">{h3[1]}</div>); continue; }
      if (h4) { flushPara(); flushList(); nodes.push(<div key={`h4-${key++}`} className="font-semibold text-slate-800 mt-1">{h4[1]}</div>); continue; }
      if (ul) { flushPara(); if (listType && listType !== 'ul') flushList(); listType = 'ul'; listItems.push(ul[1]); continue; }
      if (ol) { flushPara(); if (listType && listType !== 'ol') flushList(); listType = 'ol'; listItems.push(ol[2]); continue; }
      if (listType) flushList();
      para.push(line);
    }
    flushPara(); flushList();
    return nodes;
  };

  const renderTextWithCode = (raw = '') => {
    const text = String(raw || '');
    const parts = [];
    const re = /```(\w+)?\n([\s\S]*?)```/g;
    let last = 0; let m;
    while ((m = re.exec(text)) !== null) {
      const before = text.slice(last, m.index).trim();
      if (before) parts.push(...renderInlineBlocks(before));
      const code = m[2];
      parts.push(<pre key={`c-${m.index}`} className="mt-2 rounded-lg bg-slate-900 text-slate-100 p-3 overflow-auto text-xs max-w-full"><code>{code}</code></pre>);
      last = re.lastIndex;
    }
    const after = text.slice(last).trim();
    if (after) parts.push(...renderInlineBlocks(after));
    return <>{parts}</>;
  };

  const AiFormattedBlock = ({ text }) => {
    const { topic, bullets, teaser, paragraphs } = extractAiFormatting(text);
    return (
      <div className="space-y-3 break-words">
        {topic && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Topic</span>
            <span className="font-semibold text-slate-900">{topic}</span>
          </div>
        )}
        {bullets.length > 0 && (
          <ul className="list-disc pl-5 space-y-2 text-slate-700 break-words">
            {bullets.map((b,i) => {
              const [head, ...rest] = b.split(':');
              const body = rest.join(':').trim();
              return (
                <li key={i} className="leading-relaxed">
                  <div className="font-medium text-slate-900">{head}{body ? ':' : ''}</div>
                  {body && (<div className="text-sm break-words">{renderTextWithCode(body)}</div>)}
                </li>
              );
            })}
          </ul>
        )}
        {teaser && (<div className="text-sm bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3 text-slate-700 break-words">{teaser}</div>)}
        {paragraphs.length > 0 && (
          <div className="space-y-2 text-slate-700 text-sm break-words">{paragraphs.map((p,i)=>(<div key={i}>{renderTextWithCode(p)}</div>))}</div>
        )}
        {!topic && bullets.length === 0 && paragraphs.length === 0 && (
          <div className="text-slate-700 text-sm whitespace-pre-wrap break-words">{renderTextWithCode(text)}</div>
        )}
      </div>
    );
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

  const newChat = async () => {
    // Optimistic UI: clear local state and storage immediately
    setMessages([]);
    try { localStorage.removeItem('LB_CHAT_HISTORY'); } catch (_) {}
    // Try to clear backend chat history as well (best-effort, ignore errors)
    try {
      if (token) {
        const apiUrl = await getApiUrl();
        await fetch(`${apiUrl}/api/ai-chat/history`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (_) {}
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-md w-full text-center bg-white shadow-xl rounded-2xl p-8 border border-slate-100">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-4">
            <LockClosedIcon className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">LifeBuddy AI is a Premium feature</h2>
          <p className="text-slate-600 text-sm mb-6">Upgrade to unlock the full conversational assistant, or start a 7‑day free trial by completing quick tasks.</p>
          <div className="flex gap-3 justify-center">
            <a href="/premium" className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700">Upgrade</a>
            <a href="/premium#trial" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Start Trial</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <style>{`
        @keyframes dotBlink { 0%,100%{opacity:.2} 50%{opacity:1} }
        .typing-dots span { display:inline-block; width:6px; height:6px; margin-left:4px; background:#64748b; border-radius:50%; opacity:.2; animation: dotBlink 1s infinite; }
        .typing-dots span:nth-child(2){ animation-delay:.2s }
        .typing-dots span:nth-child(3){ animation-delay:.4s }
        
        @keyframes messageSlideIn { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
        @keyframes messageGlow { 0%,100% { box-shadow: 0 0 20px rgba(59,130,246,0.1); } 50% { box-shadow: 0 0 30px rgba(59,130,246,0.2); } }
        @keyframes floatingOrbs { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: calc(200px + 100%) 0; } }
        
        .message-enter { animation: messageSlideIn 0.4s ease-out; }
        .ai-message { animation: messageGlow 3s ease-in-out infinite; }
        .floating-orb { animation: floatingOrbs 6s ease-in-out infinite; }
        .shimmer-effect { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); background-size: 200px 100%; animation: shimmer 2s infinite; }
        
        .premium-glass { backdrop-filter: blur(20px); background: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.2); }
        .premium-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .premium-text-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
        <div className="floating-orb absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-xl" style={{animationDelay: '2s'}}></div>
        <div className="floating-orb absolute bottom-40 left-20 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl" style={{animationDelay: '4s'}}></div>
      </div>
      {/* Premium Header */}
      <div className="fixed top-14 left-0 right-0 z-20 premium-glass border-b border-white/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full premium-gradient flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <div className="premium-text-gradient font-bold text-lg">{aiName}</div>
              <div className="text-xs text-slate-500">Premium AI Assistant</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Online
            </div>
            <button onClick={newChat} disabled={sending} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-300 flex items-center gap-2 text-sm font-medium disabled:opacity-60">
              <PlusIcon className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </div>
      </div>
      {/* Spacer for fixed header height */}
      <div className="h-16"></div>

      {showNotice && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="premium-glass rounded-xl px-4 py-3 text-sm flex items-start justify-between gap-3 border border-white/30">
            <div className="flex items-start gap-2">
              <LockClosedIcon className="w-4 h-4 text-slate-600 mt-0.5" />
              <p className="text-slate-700">
                For your privacy, chats are stored temporarily and auto-delete after 24 hours.
              </p>
            </div>
            <button onClick={dismissNotice} className="text-slate-500 hover:text-slate-700 text-xs">Dismiss</button>
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="mt-14 mb-24 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="premium-glass rounded-3xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 premium-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <div className="premium-text-gradient text-xl font-bold mb-3">Welcome to LifeBuddy AI</div>
                <div className="text-slate-600 text-sm leading-relaxed">
                  Your premium AI assistant is ready to help with productivity, learning, fitness, and life management.
                </div>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <button onClick={() => setInput("Help me create a daily routine")} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors">
                    Daily Routine
                  </button>
                  <button onClick={() => setInput("Give me a productivity plan")} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-colors">
                    Productivity
                  </button>
                  <button onClick={() => setInput("Create a learning schedule")} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs hover:bg-emerald-200 transition-colors">
                    Learning
                  </button>
                </div>
              </div>
            </div>
          )}
          {messages.map((m, index) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} message-enter`}>
              <div className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-5 py-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                m.role === 'user' 
                  ? 'premium-gradient text-white' 
                  : 'premium-glass text-slate-800 ai-message'
              }`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/50">
                    <div className="w-6 h-6 rounded-full premium-gradient flex items-center justify-center">
                      <SparklesIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{aiName}</span>
                  </div>
                )}
                <div className="text-[15px] leading-7">
                  {m.role === 'assistant' ? <AiFormattedBlock text={m.content} /> : <div className="whitespace-pre-wrap font-medium">{m.content}</div>}
                </div>
                <div className={`mt-3 text-[11px] ${m.role === 'user' ? 'text-white/70' : 'text-slate-500'}`}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {m.role === 'assistant' && m.content && (
                  <button 
                    onClick={() => copyText(m.id, m.content)} 
                    className="absolute -right-2 -top-2 premium-glass rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    {copiedId === m.id ? (
                      <CheckIcon className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start message-enter">
              <div className="max-w-[78%] premium-glass rounded-2xl px-5 py-4 shadow-lg flex items-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full premium-gradient flex items-center justify-center">
                    <SparklesIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{aiName}</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <span className="shimmer-effect">Generating response</span>
                  <span className="typing-dots ml-2"><span></span><span></span><span></span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        </div>

      {/* Premium Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 premium-glass border-t border-white/30">
        <form onSubmit={onSubmit} className="max-w-4xl mx-auto px-4 py-4 flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={`Message ${aiName}...`}
              className="w-full resize-none rounded-2xl border-2 border-slate-200/50 bg-white/90 px-4 py-3 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur"
            />
            <div className="absolute right-3 bottom-3 text-xs text-slate-400">
              {input.length}/500
            </div>
          </div>
          <button 
            type="submit" 
            disabled={!input.trim() || sending} 
            className="premium-gradient text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <PaperAirplaneIcon className="w-4 h-4"/>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
