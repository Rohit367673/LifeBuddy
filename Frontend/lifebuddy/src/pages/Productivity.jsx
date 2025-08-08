import { CheckCircleIcon, CalendarIcon, SparklesIcon, ClockIcon, LightBulbIcon, DocumentTextIcon, PhoneIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { Link, useNavigate } from 'react-router-dom';
// import PremiumCalendar from './PremiumCalendar';
import React, { useState, useEffect } from 'react';

export default function Productivity() {
  const { user } = useAuth();
  const { subscription, loading: premiumLoading } = usePremium();
  const isAdmin = user && user.email === 'rohit367673@gmail.com';
  const isPremium = subscription && subscription.plan && subscription.plan !== 'free';
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [taskTitle, setTaskTitle] = useState('');
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    taskDescription: '',
    requirements: '',
    contactNumber: '',
    countryCode: '+1',
    emailAddress: '',
    notificationPlatform: 'email',
    telegramChatId: '',
    whatsappNumber: '',
    agreeToTerms: false
  });

  // UI helpers (no functional changes)
  const getDurationDays = () => {
    if (!formData.startDate || !formData.endDate) return null;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : null;
  };

  // Note: Show the redesigned Productivity page for all users (no auto-redirect)
  // If needed later, we can restore a gentle banner that links to My Schedule when a task exists.

  // Always render the redesigned Productivity page regardless of subscription

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log('Submitting form data:', { taskTitle, ...formData });
      alert('Schedule created successfully! Check your phone for the new plan.');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to create schedule. Please try again.');
    }
  };

  // Step indicators
  const steps = [
    { id: 1, title: 'Set Task Schedule', icon: CalendarIcon, description: 'Define your goals' },
    { id: 2, title: 'Deepdock Part', icon: DocumentTextIcon, description: 'Add details' },
    { id: 3, title: 'Contact Details', icon: PhoneIcon, description: 'Final step' }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 min-h-screen pb-24 sm:pb-0">
      {/* Hero Section */}
      <header className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 w-[60vw] h-[60vw] -translate-x-1/2 bg-gradient-to-br from-purple-400 via-pink-300 to-yellow-200 opacity-30 blur-3xl animate-pulse" />
        </div>
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">AI Task Scheduler</h1>
        </div>
        <p className="text-xl sm:text-2xl text-gray-700 max-w-2xl mx-auto mb-8 font-medium">
          Let our AI create a personalized schedule for your tasks. We'll send the plan to your preferred messaging platform.
        </p>
      </header>

      {/* Main Form Section */}
      <section className="w-full py-8 sm:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
              {/* Step Progress (sticky for better UX) */}
              <div className="mb-6 sm:mb-8 sticky top-0 sm:top-4 z-10 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Create Your Schedule</h2>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                    <span>Step {currentStep} of 3</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={(currentStep / 3) * 100}
                    role="progressbar"
                  />
                </div>
                {/* Step Indicators */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {steps.map((step) => {
                    const StepIcon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : isActive
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white shadow-lg'
                                : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircleIcon className="w-5 h-5" />
                          ) : (
                            <StepIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-sm ${isActive || isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>{step.title}</h3>
                          <p className="text-xs text-slate-400">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step Content */}
              {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-purple-500" />
                      Task Title
                    </div>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter your task title (e.g., Complete Marketing Campaign)"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full h-14 text-lg border-2 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md px-6"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Start Date</label>
                    <input 
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => updateFormData({ startDate: e.target.value })}
                      className="w-full h-12 border-2 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md px-4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">End Date</label>
                    <input 
                      type="date" 
                      value={formData.endDate}
                      onChange={(e) => updateFormData({ endDate: e.target.value })}
                      className="w-full h-12 border-2 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md px-4"
                    />
                  </div>
                </div>

                  {/* Sticky action bar for mobile to always show Continue */}
                <div className="hidden sm:block pt-6">
                  <button 
                    onClick={nextStep}
                    disabled={!taskTitle || !formData.startDate || !formData.endDate}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed text-lg"
                  >
                    Continue to Details
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/90 backdrop-blur border-t border-slate-200">
                  <button
                    onClick={nextStep}
                    disabled={!taskTitle || !formData.startDate || !formData.endDate}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:cursor-not-allowed"
                  >
                    Continue to Details
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

              {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                    Task Description
                  </label>
                  <textarea 
                    value={formData.taskDescription}
                    onChange={(e) => updateFormData({ taskDescription: e.target.value })}
                    placeholder="Describe your task in detail..."
                    rows={4}
                    className="w-full border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md px-6 py-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Requirements / Questions
                  </label>
                  <textarea 
                    value={formData.requirements}
                    onChange={(e) => updateFormData({ requirements: e.target.value })}
                    placeholder="List any specific requirements, questions, or constraints..."
                    rows={4}
                    className="w-full border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md px-6 py-4"
                  />
                </div>

                <div className="hidden sm:flex gap-4 pt-6">
                  <button 
                    onClick={prevStep}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Continue to Contact
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/90 backdrop-blur border-top border-slate-200 flex gap-3">
                  <button 
                    onClick={prevStep}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Continue to Contact
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

              {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.emailAddress}
                    onChange={(e) => updateFormData({ emailAddress: e.target.value })}
                    placeholder="Enter your email address"
                    className="w-full h-12 border-2 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md px-6"
                  />
                </div>

                <div className="hidden sm:flex gap-4 pt-6">
                  <button 
                    onClick={prevStep}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Create Schedule
                  </button>
                </div>
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/90 backdrop-blur border-t border-slate-200 flex gap-3">
                  <button 
                    onClick={prevStep}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Create Schedule
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
          {/* Right: Helpful aside (no functional changes) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Plan Summary</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Title</span><span className="font-medium text-slate-800">{taskTitle || '—'}</span></div>
                <div className="flex justify-between"><span>Start</span><span className="font-medium text-slate-800">{formData.startDate || '—'}</span></div>
                <div className="flex justify-between"><span>End</span><span className="font-medium text-slate-800">{formData.endDate || '—'}</span></div>
                <div className="flex justify-between"><span>Duration</span><span className="font-medium text-slate-800">{getDurationDays() ? `${getDurationDays()} day(s)` : '—'}</span></div>
                <div className="flex justify-between"><span>Notify via</span><span className="font-medium capitalize text-slate-800">{formData.notificationPlatform || '—'}</span></div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Tips</h3>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                <li>Choose clear, concise task titles</li>
                <li>Set realistic start and end dates</li>
                <li>Use Requirements to share constraints</li>
              </ul>
            </div>
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">Need Help?</h3>
              <p className="text-sm text-slate-600">We’ll deliver your schedule to your selected platform once you submit.</p>
            </div>
          </aside>
        </div>
      </section>

      {/* Features Section */}
              <section className="w-full py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">AI-Powered Planning</h3>
            <p className="text-slate-600 text-sm">Our AI analyzes your tasks and creates optimal schedules</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Smart Scheduling</h3>
            <p className="text-slate-600 text-sm">Get personalized time blocks for maximum productivity</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <PhoneIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Instant Delivery</h3>
            <p className="text-slate-600 text-sm">Receive your schedule on your preferred platform</p>
          </div>
        </div>
      </section>
    </div>
  );
} 