import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CalendarIcon, PencilIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function PremiumCalendar() {
  const { token } = useAuth();
  const [step, setStep] = useState('setup');
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    startDate: '',
    endDate: '',
    consentGiven: false
  });
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [todayTask, setTodayTask] = useState(null);
  const [message, setMessage] = useState('');

  // Handle form input
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // Submit setup form
  const handleSetup = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate schedule');
      setSchedule(data.task.generatedSchedule);
      setStep('preview');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's task
  const fetchTodayTask = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No task for today');
      setTodayTask(data);
      setStep('today');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark today's task
  const markTodayTask = async status => {
    if (!todayTask) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/${todayTask.taskId}/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: new Date().toISOString(), status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task');
      setMessage('Task updated!');
      fetchTodayTask();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // On mount, try to fetch today's task
  useEffect(() => {
    fetchTodayTask();
    // eslint-disable-next-line
  }, []);

  // Progress bar for streak
  const streakPercent = todayTask && todayTask.bestStreak ? Math.round((todayTask.streak / todayTask.bestStreak) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gradient-to-br from-blue-50/60 to-purple-100/60 min-h-[70vh] rounded-3xl shadow-2xl backdrop-blur-xl border border-blue-100">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight flex items-center justify-center gap-2 animate-fade-in">
        <SparklesIcon className="h-8 w-8 text-purple-400 animate-pulse" />
        Premium AI Task Scheduler
      </h1>
      {message && <div className="mb-4 text-red-600 text-center font-semibold animate-fade-in-fast">{message}</div>}
      {step === 'setup' && (
        <form onSubmit={handleSetup} className="space-y-8 bg-white/60 p-8 rounded-3xl shadow-2xl border border-blue-100 glassmorphism animate-fade-in">
          <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-400" /> Set Up Your Premium Task
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <input name="title" value={form.title} onChange={handleChange} required className="peer w-full border-b-2 border-blue-300 bg-transparent px-2 pt-6 pb-2 text-lg focus:outline-none focus:border-blue-600 transition-all" />
              <label className="absolute left-2 top-2 text-blue-500 text-sm font-semibold pointer-events-none transition-all peer-focus:-translate-y-2 peer-focus:scale-90 peer-focus:text-blue-700 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:scale-100">Task Title</label>
            </div>
            <div className="relative">
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required className="peer w-full border-b-2 border-blue-300 bg-transparent px-2 pt-6 pb-2 text-lg focus:outline-none focus:border-blue-600 transition-all" />
              <label className="absolute left-2 top-2 text-blue-500 text-sm font-semibold pointer-events-none transition-all peer-focus:-translate-y-2 peer-focus:scale-90 peer-focus:text-blue-700 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:scale-100">Start Date</label>
            </div>
            <div className="md:col-span-2 relative">
              <textarea name="description" value={form.description} onChange={handleChange} className="peer w-full border-b-2 border-blue-300 bg-transparent px-2 pt-6 pb-2 text-lg focus:outline-none focus:border-blue-600 transition-all min-h-[60px]" />
              <label className="absolute left-2 top-2 text-blue-500 text-sm font-semibold pointer-events-none transition-all peer-focus:-translate-y-2 peer-focus:scale-90 peer-focus:text-blue-700 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:scale-100">Description</label>
            </div>
            <div className="relative">
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required className="peer w-full border-b-2 border-blue-300 bg-transparent px-2 pt-6 pb-2 text-lg focus:outline-none focus:border-blue-600 transition-all" />
              <label className="absolute left-2 top-2 text-blue-500 text-sm font-semibold pointer-events-none transition-all peer-focus:-translate-y-2 peer-focus:scale-90 peer-focus:text-blue-700 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:scale-100">End Date</label>
            </div>
            <div className="relative">
              <textarea name="requirements" value={form.requirements} onChange={handleChange} className="peer w-full border-b-2 border-blue-300 bg-transparent px-2 pt-6 pb-2 text-lg focus:outline-none focus:border-blue-600 transition-all min-h-[60px]" />
              <label className="absolute left-2 top-2 text-blue-500 text-sm font-semibold pointer-events-none transition-all peer-focus:-translate-y-2 peer-focus:scale-90 peer-focus:text-blue-700 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:scale-100">Requirements/Questions</label>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" name="consentGiven" checked={form.consentGiven} onChange={handleChange} required className="accent-blue-600 h-5 w-5" />
            <span className="text-sm text-blue-700">I agree to receive AI-generated daily task notifications and productivity support.</span>
          </div>
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all text-xl tracking-wide flex items-center justify-center gap-2 animate-bounce-once" disabled={loading}>
            <SparklesIcon className="h-6 w-6 text-white animate-spin-slow" />
            {loading ? 'Generating...' : 'Generate with AI'}
          </button>
        </form>
      )}
      {step === 'preview' && schedule && (
        <div className="bg-white/90 p-6 rounded-2xl shadow-lg border border-purple-100 mt-6">
          <h2 className="text-xl font-bold text-purple-700 mb-4">Your AI-Generated Schedule</h2>
          <ul className="mb-6 divide-y divide-gray-100">
            {schedule.map((s, i) => (
              <li key={i} className="py-3">
                <span className="font-semibold text-blue-700">{new Date(s.date).toLocaleDateString()}:</span> {s.subtask}
                <br /><span className="text-sm text-gray-600">Tip: {s.motivationTip}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-4">
            <button className="flex-1 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow hover:from-green-600 hover:to-blue-600 transition-all" onClick={fetchTodayTask}>Start Daily Flow</button>
            <button className="flex-1 py-3 bg-gray-300 text-gray-700 font-bold rounded-xl shadow hover:bg-gray-400 transition-all" onClick={() => setStep('setup')}>Back</button>
          </div>
        </div>
      )}
      {step === 'today' && todayTask && (
        <div className="bg-white/90 p-6 rounded-2xl shadow-lg border border-blue-100 mt-6">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Today's Focus Task</h2>
          <div className="mb-4">
            <span className="font-semibold text-lg text-purple-700">{todayTask.subtask}</span>
            <br /><span className="text-sm text-gray-600">Tip: {todayTask.motivationTip}</span>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Streak</span>
              <span className="text-sm text-gray-600">Best: <span className="font-bold text-purple-700">{todayTask.bestStreak}</span></span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style={{ width: `${streakPercent}%` }}></div>
            </div>
            <div className="text-xs text-gray-500">Current: <span className="font-bold text-blue-700">{todayTask.streak}</span> days</div>
          </div>
          <div className="mb-4 flex gap-4">
            <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-700">{todayTask.completed}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-700">{todayTask.skipped}</div>
              <div className="text-xs text-gray-600">Skipped</div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold rounded-xl shadow hover:from-blue-700 hover:to-green-600 transition-all" onClick={() => markTodayTask('completed')} disabled={loading}>Mark Complete</button>
            <button className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl shadow hover:from-red-600 hover:to-pink-600 transition-all" onClick={() => markTodayTask('skipped')} disabled={loading}>Skip</button>
          </div>
        </div>
      )}
    </div>
  );
} 