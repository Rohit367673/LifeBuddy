import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import { Lightbulb, Clock, Target, Zap, TrendingUp, Brain, Star } from 'lucide-react';

export function Sidebar() {
  const tips = [
    {
      icon: <Target className="w-5 h-5" />,
      title: "Set Clear Goals",
      description: "Define specific, measurable objectives for better task completion rates.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Time Blocking",
      description: "Allocate dedicated time slots for focused work on important tasks.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "AI Optimization",
      description: "Let our AI analyze your patterns and suggest optimal scheduling times.",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const stats = [
    { label: "Tasks Completed", value: "2,847", icon: TrendingUp, color: "text-green-600" },
    { label: "Time Saved", value: "156h", icon: Clock, color: "text-blue-600" },
    { label: "AI Accuracy", value: "94%", icon: Brain, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Main Tips Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="p-6 bg-white/70 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <motion.div 
            className="flex items-center gap-3 mb-4"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg"
              whileHover={{ rotate: 10 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Lightbulb className="w-5 h-5 text-white" />
            </motion.div>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              Productivity Tips
            </h2>
          </motion.div>
          
          <motion.p 
            className="text-slate-600 mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Maximize your productivity with AI-powered task scheduling and smart time management strategies.
          </motion.p>
          
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <motion.div 
                key={index} 
                className="flex gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <motion.div 
                  className={`flex-shrink-0 mt-1 p-2 bg-gradient-to-r ${tip.color} rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  <div className="text-white">
                    {tip.icon}
                  </div>
                </motion.div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-slate-900 transition-colors">
                    {tip.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}