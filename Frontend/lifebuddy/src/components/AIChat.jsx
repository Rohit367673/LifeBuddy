import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  CodeBracketIcon, 
  AcademicCapIcon, 
  HeartIcon, 
  ClockIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AIChat = () => {
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userContext, setUserContext] = useState(null);
  const messagesEndRef = useRef(null);

  const topics = [
    { id: 'general', name: 'General', icon: ChatBubbleLeftRightIcon, color: 'bg-blue-500' },
    { id: 'coding', name: 'Coding', icon: CodeBracketIcon, color: 'bg-green-500' },
    { id: 'education', name: 'Education', icon: AcademicCapIcon, color: 'bg-purple-500' },
    { id: 'fitness', name: 'Fitness', icon: HeartIcon, color: 'bg-red-500' },
    { id: 'productivity', name: 'Productivity', icon: ClockIcon, color: 'bg-orange-500' }
  ];

  useEffect(() => {
    fetchUserContext();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserContext = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai-chat/context', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserContext(data);
      }
    } catch (error) {
      console.error('Error fetching user context:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      topic: selectedTopic,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      const token = localStorage.getItem('token');
      const endpoint = selectedTopic === 'general' ? '/general' : `/${selectedTopic}`;
      
      let requestBody = { message: userMessage };
      
      // Add topic-specific fields
      if (selectedTopic === 'coding') {
        requestBody.codeContext = ''; // Could be enhanced with code editor
      } else if (selectedTopic === 'fitness') {
        requestBody.fitnessGoals = userContext?.userProfile?.goals?.join(', ') || '';
      } else if (selectedTopic === 'education') {
        requestBody.topic = userMessage;
        requestBody.difficulty = userContext?.userProfile?.experienceLevel || 'beginner';
      } else if (selectedTopic === 'productivity') {
        requestBody.currentSchedule = ''; // Could be enhanced with current schedule
      }

      const response = await fetch(`/api/ai-chat${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          topic: selectedTopic,
          timestamp: new Date()
        };
        
        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        topic: selectedTopic,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTopicIcon = (topicId) => {
    const topic = topics.find(t => t.id === topicId);
    const IconComponent = topic?.icon || ChatBubbleLeftRightIcon;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SparklesIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">LifeBuddy AI Assistant</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your personalized AI companion for coding, fitness, education, productivity, and more. 
          I learn from your interactions to provide tailored advice and support.
        </p>
      </div>

      {/* Topic Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Choose a Topic</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                selectedTopic === topic.id
                  ? `border-${topic.color.split('-')[1]}-500 bg-${topic.color.split('-')[1]}-50 text-${topic.color.split('-')[1]}-700`
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <topic.icon className="w-5 h-5" />
              {topic.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${topics.find(t => t.id === selectedTopic)?.color} flex items-center justify-center`}>
              {getTopicIcon(selectedTopic)}
            </div>
            <div>
              <h3 className="text-white font-semibold">
                {topics.find(t => t.id === selectedTopic)?.name} Assistant
              </h3>
              <p className="text-purple-100 text-sm">
                {userContext?.userProfile?.name ? `Personalized for ${userContext.userProfile.name}` : 'Ready to help!'}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Start a conversation! Ask me anything about {topics.find(t => t.id === selectedTopic)?.name.toLowerCase()}.</p>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-purple-600" />
                  </div>
                )}
                
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <div className={`text-xs mt-2 ${
                    msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>

                {msg.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCircleIcon className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </motion.div>
            ))
          )}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Ask me about ${topics.find(t => t.id === selectedTopic)?.name.toLowerCase()}...`}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>

      {/* User Context Info */}
      {userContext && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your AI Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Learning Style</h4>
              <p className="text-gray-600 capitalize">{userContext.userProfile?.learningStyle || 'Mixed'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Experience Level</h4>
              <p className="text-gray-600 capitalize">{userContext.userProfile?.experienceLevel || 'Beginner'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Communication</h4>
              <p className="text-gray-600 capitalize">{userContext.userProfile?.communicationStyle || 'Encouraging'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
