import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, CalendarIcon, SparklesIcon, XCircleIcon, BellIcon, PlayCircleIcon, LinkIcon, ChatBubbleOvalLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { getApiUrl } from '../utils/config';

export default function MySchedule() {
  const { token, user, loading: authLoading } = useAuth();
  const [todayTask, setTodayTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [notificationPlatform, setNotificationPlatform] = useState('');
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [videoBlacklist, setVideoBlacklist] = useState({});
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizChecked, setQuizChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | concepts | example | videos | sources | practice
  // Lesson AI Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState([]); // {role:'user'|'ai', text}
  const [chatLoading, setChatLoading] = useState(false);
  // Deep dive states
  const [deepDiveText, setDeepDiveText] = useState('');
  const [deepDiveSections, setDeepDiveSections] = useState([]); // {title, content}
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);

  // On mount: try to restore cached schedule immediately for better UX
  useEffect(() => {
    try {
      const cached = localStorage.getItem('LB_TODAY_TASK');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setTodayTask(parsed);
          setNotificationPlatform(parsed.notificationPlatform || '');
          setLoading(false);
        }
      }
    } catch (_) {}
  }, []);

  // Fetch when token is ready or changes
  useEffect(() => {
    if (!authLoading && token) {
      fetchTodayTask();
    }
  }, [authLoading, token]);

  // Force refresh when coming from productivity page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const timestamp = urlParams.get('t');
    if (timestamp) {
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      // Force a fresh fetch
      setTimeout(() => {
        fetchTodayTask();
      }, 500);
    }
  }, []);

  const fetchTodayTask = async () => {
    setLoading(true);
    setMessage('');
    console.log('🔍 Fetching today task...');
    try {
      const apiBase = await getApiUrl();
      const res = await fetch(`${apiBase}/api/premium-tasks/today?t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📡 API Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ API returned data:', data);
        setTodayTask(data);
        setNotificationPlatform(data.notificationPlatform || '');
        try { localStorage.setItem('LB_TODAY_TASK', JSON.stringify(data)); } catch (_) {}
      } else if (res.status === 404) {
        console.log('❌ No active task found (404)');
        // Fallback to cached schedule if present so user still sees their plan
        try {
          const cached = localStorage.getItem('LB_TODAY_TASK');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed) {
              setTodayTask(parsed);
              setNotificationPlatform(parsed.notificationPlatform || '');
              setMessage('Showing your last saved schedule.');
            } else {
              setTodayTask(null);
              setNotificationPlatform('');
              setMessage('');
            }
          } else {
            setTodayTask(null);
            setNotificationPlatform('');
            setMessage('');
          }
        } catch (_) {
          setTodayTask(null);
          setNotificationPlatform('');
          setMessage('');
        }
      } else {
        const data = await res.json();
        console.log('❌ API error:', data);
        throw new Error(data.message || 'Failed to fetch task');
      }
    } catch (err) {
      console.log('💥 Fetch error:', err.message);
      // If we have cached data, keep showing it and inform the user
      try {
        const cached = localStorage.getItem('LB_TODAY_TASK');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            setTodayTask(parsed);
            setNotificationPlatform(parsed.notificationPlatform || '');
            setMessage('Showing your last saved schedule.');
          } else {
            setTodayTask(null);
            setNotificationPlatform('');
            setMessage(err.message);
          }
        } else {
          setTodayTask(null);
          setNotificationPlatform('');
          setMessage(err.message);
        }
      } catch (_) {
        setTodayTask(null);
        setNotificationPlatform('');
        setMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Clean noisy day titles coming from LLM (e.g., "**Day Title**: ...", emojis, extra punctuation)
  const cleanTitle = (s) => {
    if (!s || typeof s !== 'string') return '';
    return s
      .replace(/\*\*?Day Title\*\*?:?/i, '') // **Day Title**:
      .replace(/✨|🔥|💡|🎯|⭐|🌟|💎|🏆|🎉|🚀/g, '') // common emojis
      .replace(/^\s*[:\-–—]\s*/, '')
      .trim();
  };

  const markTaskComplete = async (status) => {
    if (!todayTask) return;
    
    try {
      const apiBase = await getApiUrl();
      const res = await fetch(`${apiBase}/api/premium-tasks/${todayTask.taskId}/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          date: new Date().toISOString(), 
          status: status,
          dayNumber: todayTask.dayNumber
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task');
      
      setShowSuccess(true);
      setMessage(status === 'completed' ? 'Great job! Next day task sent to your phone!' : 'Schedule regenerated! Check your phone for the new plan.');
      
      // Refresh the task after a delay
      setTimeout(() => {
        fetchTodayTask();
        setShowSuccess(false);
      }, 3000);
      
    } catch (err) {
      setMessage(err.message);
    }
  };

  const endSchedule = async () => {
    setLoading(true);
    setMessage('');
    console.log('🗑️ Ending schedule...');
    try {
      const apiBase = await getApiUrl();
      const res = await fetch(`${apiBase}/api/premium-tasks/current?t=${Date.now()}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('🗑️ Delete response status:', res.status);
      
      if (res.ok) {
        console.log('✅ Schedule ended successfully');
        // Immediately clear all state
        setTodayTask(null);
        setNotificationPlatform('');
        setMessage('Schedule ended successfully. You can now create a new schedule.');
        
        // Force multiple refreshes to ensure data is cleared
        setTimeout(() => {
          console.log('🔄 First refresh...');
          fetchTodayTask();
        }, 1000);
        
        setTimeout(() => {
          console.log('🔄 Second refresh...');
          fetchTodayTask();
        }, 3000);
        
        // Final page reload after 5 seconds
        setTimeout(() => {
          console.log('🔄 Final page reload...');
          window.location.reload();
        }, 5000);
      } else {
        const data = await res.json();
        console.log('❌ Delete error:', data);
        throw new Error(data.message || 'Failed to end schedule');
      }
    } catch (err) {
      console.log('💥 End schedule error:', err.message);
      setMessage(err.message);
    } finally {
      setShowEndConfirm(false);
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDayEmoji = (dayNumber) => {
    const emojis = ['🎯', '🚀', '💪', '🔥', '⭐', '🌟', '💎', '🏆', '🎉', '✨'];
    return emojis[(dayNumber - 1) % emojis.length];
  };

  // --- Perplexity-style helpers ---
  const getYouTubeId = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.replace('/', '');
      }
      if (u.hostname.includes('youtube.com')) {
        const id = u.searchParams.get('v');
        if (id) return id;
        // handle shorts or embed
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'shorts' || parts[0] === 'embed') return parts[1];
      }
    } catch (_) {}
    return '';
  };

  const parseResourceItem = (item) => {
    try {
      let title = '';
      let url = '';
      if (!item) return null;
      if (typeof item === 'string') {
        // markdown style [Text](URL)
        const md = item.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
        if (md) {
          title = md[1].trim();
          url = md[2].trim();
        } else if (/^https?:\/\//i.test(item.trim())) {
          url = item.trim();
        } else {
          // Might be plain text; ignore if no URL
          return null;
        }
      } else if (typeof item === 'object') {
        title = item.title || item.name || '';
        url = item.url || item.link || '';
      }
      if (!url) return null;
      const domain = new URL(url).hostname.replace(/^www\./, '');
      const videoId = getYouTubeId(url);
      const isYouTube = !!videoId;
      return { title, url, domain, isYouTube, videoId };
    } catch (_) {
      return null;
    }
  };

  // --- Smart fallback content generation so page never looks empty ---
  const getTopicFromTitle = (t) => {
    if (!t) return '';
    // Try to extract phrase after 'Introduction to'
    const m = t.match(/Introduction to\s+(.+)/i);
    if (m) return m[1].replace(/\*|\*/g, '').trim();
    return t.replace(/\*|\*/g, '').trim();
  };

  const buildFallback = (task) => {
    if (!task) return null;
    const topic = getTopicFromTitle(task.dayTitle || task.subtask || task.title || 'the topic');
    const summary = `In this lesson, you'll get a clear, hands-on introduction to ${topic}. We'll cover what it is, why it matters, and how to start using it today with simple, practical steps.`;
    const keyPoints = [
      `What ${topic} is and when to use it`,
      `Why ${topic} is useful in real projects`,
      `Core concepts you must know to get started`,
      `A simple example of ${topic} in action`,
      `Next steps and practice ideas to build confidence`
    ];
    const example = `Imagine you're working on a small project and want to apply ${topic}. You'll learn the minimal setup and a real-world mini example that you can replicate in under 20 minutes.`;
    const exercises = [
      `Set up a basic environment for ${topic} on your machine (or in a sandbox).`,
      `Recreate the example from the lesson and tweak one parameter to see what changes.`,
      `Write down 3 use-cases where ${topic} can improve your workflow.`
    ];
    const resources = [
      `[Official docs for ${topic}](https://www.google.com/search?q=${encodeURIComponent(topic + ' official docs')})`,
      `[Beginner tutorial on ${topic}](https://www.google.com/search?q=${encodeURIComponent('beginner tutorial ' + topic)})`,
      `[Use-cases of ${topic}](https://www.google.com/search?q=${encodeURIComponent(topic + ' use cases')})`
    ];
    const motivation = task.motivation || `Mastering ${topic} helps you move faster with fewer mistakes, and gives you a clear edge in everyday work.`;
    return { summary, keyPoints, example, exercises, resources, motivation };
  };

  const displayTask = (() => {
    if (!todayTask) return null;
    const fallback = buildFallback(todayTask);
    return {
      ...todayTask,
      keyPoints: Array.isArray(todayTask.keyPoints) && todayTask.keyPoints.length > 0 ? todayTask.keyPoints : fallback.keyPoints,
      example: todayTask.example || fallback.example,
      exercises: Array.isArray(todayTask.exercises) && todayTask.exercises.length > 0 ? todayTask.exercises : fallback.exercises,
      resources: Array.isArray(todayTask.resources) && todayTask.resources.length > 0 ? todayTask.resources : fallback.resources,
      motivation: todayTask.motivation || todayTask.motivationTip || fallback.motivation,
      summary: (todayTask.notes || '') || (todayTask.example || '') || fallback.summary
    };
  })();

  // Parse markdown into sections on headings '### '
  const parseMarkdownSections = (text = '') => {
    try {
      const lines = String(text || '').split(/\r?\n/);
      const sections = [];
      let current = { title: 'Overview', content: [] };
      for (const line of lines) {
        const h3 = line.match(/^###\s+(.+)/);
        if (h3) {
          if (current.content.length) sections.push({ ...current, content: current.content.join('\n') });
          current = { title: h3[1].trim(), content: [] };
        } else {
          current.content.push(line);
        }
      }
      if (current.content.length) sections.push({ ...current, content: current.content.join('\n') });
      return sections.filter(s => s.content.trim().length > 0);
    } catch (_) {
      return [];
    }
  };

  const buildSectionsFromKeyPoints = (topic, points = []) => {
    const items = Array.isArray(points) ? points : [];
    if (items.length === 0) return [];
    return items.slice(0, 6).map((kp, i) => ({
      title: `${i + 1}. ${kp.replace(/[:\-–—].*$/, '').trim()}`,
      content: `What it means: ${kp}\n\nWhy it matters: Understanding "${kp}" builds intuition for ${topic}.\n\nHow to use: Try applying this concept in today's example or practice tasks.\n\nPitfall: Avoid memorizing definitions—build intuition by implementing a tiny demo.`,
    }));
  };

  // Fetch deep dive content via backend AI (with graceful fallback)
  useEffect(() => {
    const run = async () => {
      try {
        if (!displayTask) return;
        const topic = getTopicFromTitle(displayTask?.dayTitle || displayTask?.subtask || displayTask?.title || 'the topic');
        const cacheKey = `LB_DEEPDIVE_${(topic || '').toLowerCase().slice(0,80)}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setDeepDiveText(cached);
          setDeepDiveSections(parseMarkdownSections(cached));
          return;
        }
        setDeepDiveLoading(true);
        let text = '';
        try {
          const apiBase = await getApiUrl();
          const res = await fetch(`${apiBase}/api/ai-chat/education`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              topic: `Explain ${topic} in depth for a beginner. Break into sub-topics with clear headings (### Heading). Include short examples, analogies, and common pitfalls.`,
              difficulty: 'beginner'
            })
          });
          const data = await res.json();
          if (res.ok && data?.response) {
            text = String(data.response);
          }
        } catch (_) {
          // ignore, use fallback below
        }
        if (!text || text.trim().length === 0) {
          const topic = getTopicFromTitle(displayTask?.dayTitle || displayTask?.subtask || displayTask?.title || 'the topic');
          const sections = buildSectionsFromKeyPoints(topic, displayTask?.keyPoints || []);
          const joinText = ['## Deep Dive', ...sections.map(s => `### ${s.title}\n${s.content}`)].join('\n\n');
          setDeepDiveText(joinText);
          setDeepDiveSections(sections);
          return;
        }
        setDeepDiveText(text);
        setDeepDiveSections(parseMarkdownSections(text));
        try { sessionStorage.setItem(cacheKey, text); } catch (_) {}
      } finally {
        setDeepDiveLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayTask?.dayTitle, displayTask?.subtask]);

  // Lesson Chat: ask backend with contextualized question
  const askLessonAI = async (msg) => {
    const query = (msg || chatInput || '').trim();
    if (!query) return;
    setChatInput('');
    setChatMsgs(prev => [...prev, { role: 'user', text: query }]);
    setChatLoading(true);
    try {
      const apiBase = await getApiUrl();
      const context = `Context: Day ${todayTask?.dayNumber} - ${displayTask?.dayTitle || displayTask?.subtask}. Key points: ${(displayTask?.keyPoints || []).join('; ')}. Example: ${displayTask?.example || ''}`;
      const res = await fetch(`${apiBase}/api/ai-chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: `${query}\n\n${context}` })
      });
      const data = await res.json();
      const aiText = data?.response || data?.message || 'Sorry, I could not get an answer right now.';
      setChatMsgs(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (e) {
      setChatMsgs(prev => [...prev, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // =====================
  // AI text formatting helpers
  // =====================
  const extractAiFormatting = (text = '') => {
    const out = { topic: '', bullets: [], teaser: '', paragraphs: [] };
    if (!text || typeof text !== 'string') return out;
    let t = text
      .replace(/\*\*/g, '')
      .replace(/\s+\n/g, '\n')
      // normalize bullet characters to dashes for easier parsing
      .replace(/^\s*[•–—]\s+/gm, '- ')
      .trim();
    const topicMatch = t.match(/(?:Today[’']s\s+topic|Topic)\s*:\s*(.+?)(?:\n|\.|$)/i);
    if (topicMatch) {
      out.topic = topicMatch[1].replace(/\s*🚀$/, '').trim();
    }
    const items = [];
    const itemRegex = /(\d{1,2})\.\s+([^]+?)(?=(?:\s+\d{1,2}\.\s+)|$)/g;
    let m;
    while ((m = itemRegex.exec(t)) !== null) {
      items.push(m[2].trim().replace(/\s+\.$/, ''));
    }
    if (items.length) out.bullets = items;
    // Also support dashed/• bullets
    if (!out.bullets.length) {
      const dashLines = t.split(/\r?\n/).map(s => s.trim()).filter(l => /^[-*•]\s+/.test(l));
      if (dashLines.length) out.bullets = dashLines.map(l => l.replace(/^[-*•]\s+/, ''));
    }
    const teaserMatch = t.match(/(Mini[- ]?project[^:]*:|Teaser:|By the end[^:]*:?)\s*([^]+?)(?:$|\n)/i);
    if (teaserMatch) out.teaser = teaserMatch[2].trim();
    const stripped = t
      .replace(itemRegex, '')
      .replace(/(?:Today[’']s\s+topic|Topic)\s*:.+?(?:\n|\.|$)/i, '')
      .trim();
    if (stripped) {
      out.paragraphs = stripped
        .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
        .map(s => s.trim())
        .filter(Boolean);
    }
    return out;
  };

  // Convert plain text (no code fences) into headings, lists, and paragraphs
  const renderInlineBlocks = (raw = '') => {
    const lines = String(raw || '').split(/\r?\n/);
    const nodes = [];
    let key = 0;
    let para = [];
    let listType = null; // 'ul' | 'ol'
    let listItems = [];

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

    const flushPara = () => {
      if (para.length) {
        nodes.push(<p key={`p-${key++}`} className="mt-1">{renderInlineCodeSegments(para.join(' '))}</p>);
        para = [];
      }
    };
    const flushList = () => {
      if (listItems.length) {
        if (listType === 'ul') {
          nodes.push(
            <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-1 text-slate-700">
              {listItems.map((it, i) => (<li key={i} className="leading-relaxed">{renderInlineCodeSegments(it)}</li>))}
            </ul>
          );
        } else if (listType === 'ol') {
          nodes.push(
            <ol key={`ol-${key++}`} className="list-decimal pl-5 space-y-1 text-slate-700">
              {listItems.map((it, i) => (<li key={i} className="leading-relaxed">{renderInlineCodeSegments(it)}</li>))}
            </ol>
          );
        }
      }
      listType = null;
      listItems = [];
    };

    for (const lineRaw of lines) {
      const line = lineRaw.trim();
      if (!line) { flushPara(); flushList(); continue; }
      const h3 = line.match(/^###\s+(.+)/);
      const h4 = line.match(/^####\s+(.+)/);
      const ul = line.match(/^[-*•]\s+(.+)/);
      const ol = line.match(/^(\d{1,2})\.\s+(.+)/);
      // If code-like HTML/JSX or JS line, render as code block
      const isCodeLike = /<\/?[a-zA-Z][^>]*>/.test(line) || /^(const|let|var|function|class)\b/.test(line);
      if (isCodeLike) { flushPara(); flushList(); nodes.push(
        <pre key={`code-${key++}`} className="mt-2 rounded-lg bg-slate-900 text-slate-100 p-3 overflow-auto overflow-x-auto text-xs w-full max-w-full"><code>{line}</code></pre>
      ); continue; }
      if (h3) { flushPara(); flushList(); nodes.push(<div key={`h3-${key++}`} className="font-semibold text-slate-900 mt-2">{h3[1]}</div>); continue; }
      if (h4) { flushPara(); flushList(); nodes.push(<div key={`h4-${key++}`} className="font-semibold text-slate-800 mt-1">{h4[1]}</div>); continue; }
      if (ul) { flushPara(); if (listType && listType !== 'ul') flushList(); listType = 'ul'; listItems.push(ul[1]); continue; }
      if (ol) { flushPara(); if (listType && listType !== 'ol') flushList(); listType = 'ol'; listItems.push(ol[2]); continue; }
      // normal text
      if (listType) { flushList(); }
      para.push(line);
    }
    flushPara(); flushList();
    return nodes;
  };

  // Render triple backtick code fences and delegate non-code parts to renderInlineBlocks
  const renderTextWithCode = (raw = '') => {
    const text = String(raw || '');
    const parts = [];
    const re = /```(\w+)?\n([\s\S]*?)```/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const before = text.slice(last, m.index).trim();
      if (before) {
        parts.push(...renderInlineBlocks(before));
      }
      const code = m[2];
      parts.push(
        <pre key={`c-${m.index}`} className="mt-2 rounded-lg bg-slate-900 text-slate-100 p-3 overflow-auto overflow-x-auto text-xs w-full max-w-full">
          <code>{code}</code>
        </pre>
      );
      last = re.lastIndex;
    }
    const after = text.slice(last).trim();
    if (after) parts.push(...renderInlineBlocks(after));
    return <>{parts}</>;
  };

  const AiFormattedBlock = ({ text, compact = false }) => {
    const { topic, bullets, teaser, paragraphs } = extractAiFormatting(text);
    const parseHighlights = (bodyText = '') => {
      const out = {};
      const src = String(bodyText || '');
      const pick = (label) => {
        const re = new RegExp(`${label}\\s*:\\s*([^]+?)(?=(?:\\n[A-Z][A-Za-z ]{1,18}\\s*:)|$)`, 'i');
        const m = src.match(re);
        return m ? m[1].trim() : '';
      };
      out.what = pick('What it means');
      out.why = pick('Why it matters');
      out.how = pick('How to use');
      out.pitfall = pick('Pitfall|Common mistake');
      out.example = pick('Example');
      out.analogy = pick('Analogy');
      return out;
    };
    return (
      <div className={compact ? '' : 'space-y-3 break-words'}>
        {topic && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">Topic</span>
            <span className="font-semibold text-slate-900">{topic}</span>
          </div>
        )}
        {bullets.length > 0 && (
          <ul className="list-disc pl-5 space-y-2 text-slate-700 break-words">
            {bullets.map((b,i) => {
              const [head, ...restParts] = b.split(':');
              const body = restParts.join(':').trim();
              const hi = parseHighlights(body);
              return (
                <li key={i} className="leading-relaxed">
                  <div className="font-medium text-slate-900">{head}{body ? ':' : ''}</div>
                  {body && !hi.what && !hi.why && !hi.how && !hi.pitfall && !hi.example && !hi.analogy && (
                    <div className="text-sm break-words">{renderTextWithCode(body)}</div>
                  )}
                  {(hi.what || hi.why || hi.how || hi.pitfall || hi.example || hi.analogy) && (
                    <div className="mt-2 space-y-2 text-sm break-words">
                      {hi.what && (<div className="flex gap-2"><span>🧩</span><div className="flex-1">{renderTextWithCode(hi.what)}</div></div>)}
                      {hi.why && (<div className="flex gap-2"><span>💡</span><div className="flex-1">{renderTextWithCode(hi.why)}</div></div>)}
                      {hi.how && (<div className="flex gap-2"><span>🛠️</span><div className="flex-1">{renderTextWithCode(hi.how)}</div></div>)}
                      {hi.example && (<div className="flex gap-2"><span>🧪</span><div className="flex-1">{renderTextWithCode(hi.example)}</div></div>)}
                      {hi.analogy && (<div className="flex gap-2"><span>🔗</span><div className="flex-1">{renderTextWithCode(hi.analogy)}</div></div>)}
                      {hi.pitfall && (<div className="flex gap-2"><span>⚠️</span><div className="flex-1">{renderTextWithCode(hi.pitfall)}</div></div>)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {teaser && (
          <div className="text-sm bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3 text-slate-700 break-words">{teaser}</div>
        )}
        {paragraphs.length > 0 && (
          <div className="space-y-2 text-slate-700 text-sm break-words">
            {paragraphs.map((p,i)=>(
              <div key={i}>{renderTextWithCode(p)}</div>
            ))}
          </div>
        )}
        {!topic && bullets.length === 0 && paragraphs.length === 0 && (
          <div className="text-slate-700 text-sm whitespace-pre-wrap break-words">{renderTextWithCode(text)}</div>
        )}
      </div>
    );
  };

  const parsedResources = Array.isArray(displayTask?.resources)
    ? displayTask.resources.map(parseResourceItem).filter(Boolean)
    : [];
  const videoResources = parsedResources.filter(r => r.isYouTube);
  const visibleVideoResources = videoResources.filter(v => !videoBlacklist[v.videoId]);
  const overviewParts = [];
  const prettyTitle = cleanTitle(displayTask?.dayTitle || displayTask?.subtask || 'Today\'s Lesson');
  if (prettyTitle) overviewParts.push(`"${prettyTitle}"`);
  if (displayTask?.summary) overviewParts.push(displayTask.summary);
  const overviewTextRaw = overviewParts.join('\n\n').trim();
  const isOverviewLong = overviewTextRaw.length > 700;
  const overviewTextShort = isOverviewLong ? (overviewTextRaw.slice(0, 700) + '…') : overviewTextRaw;

  // Reading time estimate (200 wpm)
  const wordCount = (text) => (text || '').split(/\s+/).filter(Boolean).length;
  const totalWords = wordCount(overviewTextRaw) + wordCount((displayTask?.keyPoints || []).join(' ')) + wordCount(displayTask?.example);
  const readMinutes = Math.max(1, Math.ceil(totalWords / 200));

  // Extract simple definitions from key points like "Term (definition)" or "Term: definition"
  const extractDefinition = (pt) => {
    if (!pt || typeof pt !== 'string') return null;
    // Pattern 1: Term (definition)
    const paren = pt.match(/^\s*([^:()\-–—]+?)\s*\(([^)]+)\)\s*$/);
    if (paren) return { term: paren[1].trim(), def: paren[2].trim() };
    // Pattern 2: Term: definition
    const colon = pt.match(/^\s*([^:]+?):\s*(.+)$/);
    if (colon) return { term: colon[1].trim(), def: colon[2].trim() };
    // Pattern 3: Term - definition
    const dash = pt.match(/^\s*([^\-–—]+?)\s*[\-–—]\s*(.+)$/);
    if (dash) return { term: dash[1].trim(), def: dash[2].trim() };
    return null;
  };
  const definitions = Array.isArray(displayTask?.keyPoints)
    ? displayTask.keyPoints.map(extractDefinition).filter(Boolean).slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Top Bar */}
      <motion.div 
        className="relative w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="w-full px-2 py-6">
          <motion.div 
            className="flex items-center justify-center gap-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <SparklesIcon className="w-6 h-6 text-white" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Your AI Roadmap
              </h1>
              <p className="text-sm text-slate-600 mt-1">Powered by LifeBuddy AI</p>
            </div>
            <motion.div
              className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <CalendarIcon className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>

          {/* Removed misplaced Lesson Outline from top bar */}
        </div>
      </motion.div>

      {/* Main Layout */}
      <motion.div 
        className="w-full p-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="grid grid-cols-12 gap-8 min-h-[calc(100vh-140px)]">
          {/* Main Content Area */
          }
          <motion.div 
            className="col-span-8"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Success Message */}
            {showSuccess && (
              <motion.div 
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <p className="text-green-700 font-medium">{message}</p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {message && !showSuccess && (
              <motion.div 
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{message}</p>
                </div>
              </motion.div>
            )}

            {/* Today's Task */}
            <motion.div 
              className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {getGreeting()}, let's make today productive!
                  </h2>
                  <p className="text-slate-600 mt-1">Your AI-generated task for today</p>
                </div>
                {todayTask && (
                  <div className="text-right">
                    <div className="text-3xl">{getDayEmoji(todayTask.dayNumber)}</div>
                    <div className="text-sm text-slate-500">Day {todayTask.dayNumber}</div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading your roadmap...</p>
                </div>
              ) : !todayTask ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No active roadmap</h3>
                  <p className="text-slate-500">Create a new AI schedule to get started.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button
                      onClick={() => {
                        // Force a fresh navigation to productivity page
                        window.location.href = `/productivity?t=${Date.now()}`;
                      }}
                      className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all text-lg"
                    >
                      + Create New Schedule
                    </button>
                    <button
                      onClick={() => {
                        setLoading(true);
                        fetchTodayTask();
                      }}
                      className="inline-block px-4 py-3 bg-gray-500 text-white font-bold rounded-lg shadow-lg hover:bg-gray-600 transition-all text-sm"
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={() => {
                        console.log('🧹 Clearing all cache...');
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload();
                      }}
                      className="inline-block px-4 py-3 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 transition-all text-sm"
                    >
                      🧹 Clear Cache
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Day Task */}
                  <motion.div
                    className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{todayTask.dayNumber}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">
                          {prettyTitle}
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">Day {todayTask.dayNumber}{todayTask.totalDays ? ` of ${todayTask.totalDays}` : ''} • ~{readMinutes} min read</p>
                        {notificationPlatform === 'telegram' ? (
                          <div className="text-slate-600 mb-4 font-semibold">Full schedule sent to your Telegram!</div>
                        ) : (
                          <>
                            {/* Tab Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                              <div className="flex flex-wrap gap-2">
                              {[
                                { id: 'overview', label: 'Overview' },
                                { id: 'concepts', label: 'Concepts' },
                                ...(definitions.length > 0 ? [{ id: 'concepts', label: 'Concepts' }] : []),
                                ...((deepDiveText || (displayTask?.keyPoints || []).length > 0) ? [{ id: 'deep', label: 'Deep Dive' }] : []),
                                ...(todayTask.example ? [{ id: 'example', label: 'Example' }] : []),
                                ...(visibleVideoResources.length > 0 ? [{ id: 'videos', label: 'Videos' }] : []),
                                ...(parsedResources.length > 0 ? [{ id: 'sources', label: 'Sources' }] : []),
                                ...(Array.isArray(todayTask.exercises) && todayTask.exercises.length > 0 ? [{ id: 'practice', label: 'Practice' }] : []),
                                [{ id: 'chat', label: 'Ask AI' }][0],
                              ].filter((v,i,self)=> i === self.findIndex(s=>s.id===v.id)).map(tab => (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`px-3 py-1 text-sm rounded-full border ${activeTab===tab.id? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent' : 'bg-white/70 text-slate-700 border-slate-200 hover:border-slate-300'}`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                              </div>
                              <button
                                onClick={() => setActiveTab('chat')}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow"
                              >
                                <ChatBubbleOvalLeftIcon className="w-4 h-4" /> Ask AI
                              </button>
                            </div>

                            {/* Research Summary / Motivation */}
                            {activeTab === 'overview' && todayTask.motivationTip && !overviewTextRaw && (
                              <p className="text-slate-600 mb-4">{todayTask.motivationTip}</p>
                            )}

                            {/* Example / Analogy */}
                            {(activeTab === 'overview') && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">💬 AI Lesson Summary</h4>
                                <div className="text-slate-700 bg-white/60 p-4 rounded-xl leading-relaxed">
                                  <AiFormattedBlock text={(overviewTextRaw && overviewTextRaw.length > 0) ? (showFullOverview ? overviewTextRaw : overviewTextShort) : (displayTask?.summary || displayTask?.motivation || '')} compact={true} />
                                  {isOverviewLong && (
                                    <button className="ml-2 text-purple-600 font-semibold hover:underline" onClick={() => setShowFullOverview(v => !v)}>
                                      {showFullOverview ? 'Show less' : 'Read more'}
                                    </button>
                                  )}
                                </div>
                                {/* Quick takeaways chips */}
                                {Array.isArray(displayTask.keyPoints) && displayTask.keyPoints.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {displayTask.keyPoints.slice(0, 4).map((kp, i) => (
                                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-slate-700 border border-purple-200">{kp}</span>
                                    ))}
                                  </div>
                                )}
                                {/* Duration/Motivation chips */}
                                {(todayTask?.duration || todayTask?.motivation || todayTask?.motivationTip) && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {todayTask?.duration && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">🕐 Duration: {todayTask.duration}</span>
                                    )}
                                    {(todayTask?.motivation || todayTask?.motivationTip) && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">🧠 Motivation: {todayTask.motivation || todayTask.motivationTip}</span>
                                    )}
                                  </div>
                                )}
                                {/* Primary resource CTA */}
                                {parsedResources.length > 0 && (
                                  <div className="mt-4">
                                    <a href={parsedResources[0].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm shadow hover:from-blue-700 hover:to-cyan-600">
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 14L21 3M21 3H14M21 3V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      Start here: {parsedResources[0].domain}
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Concepts */}
                            {activeTab === 'concepts' && definitions.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">🔎 Key Concepts & Definitions</h4>
                                <ul className="space-y-2 text-slate-700">
                                  {definitions.map((d, i) => (
                                    <li key={i} className="bg-white/60 p-3 rounded-lg"><span className="font-semibold text-slate-900">{d.term}:</span> {d.def}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Videos Section (hide if broken) */}
                            {activeTab === 'videos' && visibleVideoResources.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">🎥 Videos</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {visibleVideoResources.map((v, i) => (
                                    <a key={i} href={v.url} target="_blank" rel="noreferrer" className="group relative rounded-xl overflow-hidden bg-black">
                                      <img
                                        src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
                                        alt={v.title || 'YouTube Video'}
                                        className="w-full aspect-video object-cover opacity-90 group-hover:opacity-100 transition"
                                        onError={() => setVideoBlacklist(prev => ({ ...prev, [v.videoId]: true }))}
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-white/90 rounded-full p-3 shadow-lg group-hover:scale-110 transition">
                                          <PlayCircleIcon className="w-8 h-8 text-red-600" />
                                        </div>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                        <div className="text-white text-sm font-semibold">{v.title || v.domain}</div>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Sources Section */}
                            {activeTab === 'sources' && parsedResources.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">📚 Sources</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {parsedResources.map((r, index) => (
                                    <a key={index} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition">
                                      <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(r.url)}`} alt="" className="w-5 h-5 rounded-sm" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-800 truncate">{r.title || r.domain}</div>
                                        <div className="text-xs text-slate-500 truncate">{r.domain}</div>
                                      </div>
                                      <LinkIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Ask AI - full width tab */}
                            {activeTab === 'chat' && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">🤖 Ask AI about today</h4>
                                <div className="bg-white/70 rounded-2xl border border-white/20 p-4 overflow-hidden">
                                  <div className="max-h-[520px] min-h-[260px] overflow-auto overflow-x-hidden space-y-3 mb-3 pr-1">
                                    {chatMsgs.length === 0 && (
                                      <div className="text-xs text-slate-500">Try: "What is today’s topic in simple words?"</div>
                                    )}
                                    {chatMsgs.map((m, i) => (
                                      <div key={i} className={`text-sm rounded-lg p-3 break-words min-w-0 ${m.role==='user' ? 'bg-purple-50 text-slate-800 ml-12' : 'bg-slate-50 border border-slate-200 text-slate-800 mr-12'}`}>
                                        {m.role === 'ai' ? (<AiFormattedBlock text={m.text} />) : m.text}
                                      </div>
                                    ))}
                                    {chatLoading && <div className="text-xs text-slate-500">AI is typing…</div>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      value={chatInput}
                                      onChange={(e)=>setChatInput(e.target.value)}
                                      onKeyDown={(e)=>{ if(e.key==='Enter'){ askLessonAI(); } }}
                                      placeholder="Ask about today’s lesson…"
                                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white/80"
                                    />
                                    <button onClick={()=>askLessonAI()} disabled={chatLoading || !chatInput.trim()} className={`px-3 py-2 rounded-lg text-white text-sm flex items-center gap-1 ${chatLoading ? 'bg-slate-400' : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600'}`}>
                                      <PaperAirplaneIcon className="w-4 h-4" />
                                      Send
                                    </button>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {['What is today’s topic?','Explain with a simple analogy','What should I learn next?'].map((p, i)=> (
                                      <button key={i} onClick={()=>askLessonAI(p)} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">{p}</button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Practice Section */}
                            {activeTab === 'practice' && Array.isArray(displayTask.exercises) && displayTask.exercises.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">💪 Practice</h4>
                                <ul className="space-y-2">
                                  {displayTask.exercises.map((ex, i) => (
                                    <li key={i} className="bg-white/60 p-3 rounded-lg text-sm text-slate-700">{ex}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <motion.button
                            onClick={() => markTaskComplete('completed')}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ✅ Mark Complete
                          </motion.button>
                          <motion.button
                            onClick={() => markTaskComplete('skipped')}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ⏭️ Skip & Reschedule
                          </motion.button>
                          <motion.button
                            onClick={() => setShowEndConfirm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            🛑 End Schedule
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {/* Progress Stats & Task Info - Only show if not Telegram */}
                  {notificationPlatform !== 'telegram' && (
                    <>
                      {/* Progress Stats */}
                      <motion.div
                        className="grid grid-cols-3 gap-4 p-6 bg-white/50 rounded-xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{todayTask.streak}</div>
                          <div className="text-sm text-slate-500">Current Streak</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{todayTask.bestStreak}</div>
                          <div className="text-sm text-slate-500">Best Streak</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{todayTask.completed}</div>
                          <div className="text-sm text-slate-500">Completed</div>
                        </div>
                      </motion.div>
                      {/* Task Info */}
                      <motion.div
                        className="p-4 bg-slate-50 rounded-xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                      >
                        <h4 className="font-semibold text-slate-700 mb-2">Roadmap: {todayTask.title}</h4>
                        <p className="text-sm text-slate-600">{todayTask.description}</p>
                      </motion.div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
          {/* Lesson Outline - now properly placed in grid next to main content */}
          <motion.aside 
            className="col-span-4"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="space-y-6 sticky top-28">
              <div className="p-6 bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Lesson Outline</h3>
                <p className="text-xs text-slate-500 mb-4">Day {todayTask?.dayNumber}{todayTask?.totalDays ? ` of ${todayTask.totalDays}` : ''} • ~{readMinutes} min read</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  {overviewTextRaw && (<li className="flex items-start gap-2"><span>🧩</span><span>Overview</span></li>)}
                  {Array.isArray(displayTask?.keyPoints) && displayTask.keyPoints.length > 0 && (
                    <li className="flex items-start gap-2"><span>🔎</span><span>Key Concepts</span></li>
                  )}
                  {(deepDiveText || (displayTask?.keyPoints || []).length > 0) && (<li className="flex items-start gap-2"><span>📘</span><span>Deep Dive</span></li>)}
                  {definitions.length > 0 && (<li className="flex items-start gap-2"><span>📖</span><span>Definitions</span></li>)}
                  {displayTask?.example && (<li className="flex items-start gap-2"><span>📝</span><span>Example</span></li>)}
                  {visibleVideoResources.length > 0 && (<li className="flex items-start gap-2"><span>🎥</span><span>Videos</span></li>)}
                  {parsedResources.length > 0 && (<li className="flex items-start gap-2"><span>📚</span><span>Sources</span></li>)}
                  {Array.isArray(displayTask?.exercises) && displayTask.exercises.length > 0 && (<li className="flex items-start gap-2"><span>💪</span><span>Practice</span></li>)}
                  {todayTask?.quiz && (<li className="flex items-start gap-2"><span>🧩</span><span>Quiz</span></li>)}
                </ul>
                {Array.isArray(displayTask?.keyPoints) && displayTask.keyPoints.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">What you'll learn</h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                      {displayTask.keyPoints.slice(0, 6).map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {definitions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Key Definitions</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {definitions.map((d, i) => (
                        <li key={i}><span className="font-semibold text-slate-800">{d.term}:</span> {d.def}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {displayTask?.motivation && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl shadow">
                  <div className="text-xs uppercase tracking-wide text-purple-600 font-bold mb-1">Motivation</div>
                  <div className="text-sm text-slate-700">{displayTask.motivation}</div>
                </div>
              )}
              {/* Removed small sidebar chat; moved to full-width tab */}
              {/* Quick Quiz */}
              {todayTask?.quiz?.question && Array.isArray(todayTask?.quiz?.options) && todayTask.quiz.options.length > 0 && (
                <div className="p-6 bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Quick Quiz</h3>
                  <p className="text-sm text-slate-700 mb-3">{todayTask.quiz.question}</p>
                  <div className="space-y-2 mb-3">
                    {todayTask.quiz.options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="radio" name="quiz" value={opt} checked={quizAnswer === opt} onChange={(e) => { setQuizAnswer(e.target.value); setQuizChecked(false); }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <button
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold"
                    onClick={() => setQuizChecked(true)}
                  >
                    Check Answer
                  </button>
                  {quizChecked && (
                    <div className={`mt-3 text-sm font-semibold ${quizAnswer === todayTask.quiz.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                      {quizAnswer === todayTask.quiz.correctAnswer ? '✅ Correct!' : `❌ Incorrect. Correct answer: ${todayTask.quiz.correctAnswer}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      </motion.div>
      {/* End Schedule Confirmation Dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">End Schedule?</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to end your current schedule? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:from-red-600 hover:to-pink-600"
                onClick={endSchedule}
              >
                Yes, End Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 