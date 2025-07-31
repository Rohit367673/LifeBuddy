import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FormData } from './TaskSchedulerForm';
import { Calendar, Target, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface Step1Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
}

export function Step1TaskSchedule({ formData, updateFormData, onNext }: Step1Props) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const canProceed = formData.taskTitle.trim() && formData.startDate && formData.endDate;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="text-center relative"
        variants={itemVariants}
      >
        <motion.div
          className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <motion.div
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Target className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Set Task Schedule
            </h2>
            <p className="text-slate-600 mt-1 text-sm md:text-base">Define your task details and timeline to get started</p>
          </div>
        </motion.div>
      </motion.div>

      <div className="space-y-8">
        {/* Task Title */}
        <motion.div 
          className="space-y-3"
          variants={itemVariants}
        >
          <Label htmlFor="taskTitle" className="text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Task Title
          </Label>
          <motion.div
            className="relative"
            animate={focusedField === 'taskTitle' ? { scale: 1.02 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Input
              id="taskTitle"
              type="text"
              placeholder="Enter your task title (e.g., Complete Marketing Campaign)"
              value={formData.taskTitle}
              onChange={(e) => updateFormData({ taskTitle: e.target.value })}
              onFocus={() => setFocusedField('taskTitle')}
              onBlur={() => setFocusedField(null)}
              className="h-14 text-lg border-2 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
            />
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/10 to-pink-400/10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: focusedField === 'taskTitle' ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.div>

        {/* Date Fields */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          variants={itemVariants}
        >
          {/* Start Date */}
          <motion.div 
            className="space-y-3"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Label htmlFor="startDate" className="text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Start Date
            </Label>
            <motion.div
              className="relative"
              animate={focusedField === 'startDate' ? { scale: 1.02 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormData({ startDate: e.target.value })}
                onFocus={() => setFocusedField('startDate')}
                onBlur={() => setFocusedField(null)}
                className="h-14 text-lg border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              />
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-cyan-400/10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: focusedField === 'startDate' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>

          {/* End Date */}
          <motion.div 
            className="space-y-3"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Label htmlFor="endDate" className="text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              End Date
            </Label>
            <motion.div
              className="relative"
              animate={focusedField === 'endDate' ? { scale: 1.02 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormData({ endDate: e.target.value })}
                onFocus={() => setFocusedField('endDate')}
                onBlur={() => setFocusedField(null)}
                min={formData.startDate}
                className="h-14 text-lg border-2 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              />
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400/10 to-purple-400/10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: focusedField === 'endDate' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.div 
        className="flex justify-end pt-6"
        variants={itemVariants}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onNext}
            disabled={!canProceed}
            className={`
              h-14 px-8 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
              ${canProceed 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            <span>Continue to Deepdock</span>
            <motion.div
              className="ml-2"
              animate={canProceed ? { x: [0, 5, 0] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>

      {/* Progress Hint */}
      {canProceed && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-slate-500">
            Step 1 of 3 complete! Keep going to unlock AI scheduling magic ✨
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}