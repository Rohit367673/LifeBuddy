import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TaskSchedulerForm } from '../components/figma/TaskSchedulerForm';
import { CalendarIcon, PencilIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/figma/Sidebar';
import { motion } from 'framer-motion';

export default function PremiumCalendar() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('setup');
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    startDate: '',
    endDate: '',
    consentGiven: false,
    phoneNumber: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [todayTask, setTodayTask] = useState(null);
  const [message, setMessage] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { user } = useAuth();
  const isAdmin = user && user.email === 'rohit367673@gmail.com';

  // Helper to reset all state for a new schedule
  const resetSchedule = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/current`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.message || 'Failed to end current schedule.');
        setLoading(false);
        return;
      }
      setStep('setup');
      setForm({
        title: '',
        description: '',
        requirements: '',
        startDate: '',
        endDate: '',
        consentGiven: false,
        phoneNumber: ''
      });
      setPhoneError('');
      setSchedule(null);
      setTodayTask(null);
      setMessage('');
    } catch (err) {
      setMessage('Failed to end current schedule.');
    } finally {
      setLoading(false);
    }
  };

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
    // Validate phone number
    if (!/^\+[1-9]\d{1,14}$/.test(form.phoneNumber.replace(/\s+/g, ''))) {
      setPhoneError('Please enter a valid phone number with country code (e.g., +1 5551234567)');
      setLoading(false);
      return;
    } else {
      setPhoneError('');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Top Bar */}
      <motion.div 
        className="relative w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
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
                Premium AI Task Scheduler
              </h1>
              <p className="text-sm text-slate-600 mt-1">Powered by LifeBuddy Intelligence</p>
            </div>
            <motion.div
              className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <PencilIcon className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Layout */}
      <motion.div 
        className="max-w-7xl mx-auto p-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="grid grid-cols-12 gap-8 min-h-[calc(100vh-140px)]">
          {/* Sidebar - 30% width */}
          <motion.div 
            className="col-span-4"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Sidebar />
          </motion.div>

          {/* Main Form Area - 70% width */}
          <motion.div 
            className="col-span-8"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
                  <h2 className="text-xl font-bold mb-4 text-red-600">End Schedule?</h2>
                  <p className="mb-6 text-gray-700">Are you sure you want to exit? This will end your schedule.</p>
                  <div className="flex justify-center gap-4">
                    <button
                      className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                      onClick={() => setShowExitConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:from-red-600 hover:to-pink-600"
                      onClick={async () => { setShowExitConfirm(false); await resetSchedule(); }}
                    >
                      Yes, Exit
                    </button>
                  </div>
                </div>
              </div>
            )}
            <TaskSchedulerForm />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 