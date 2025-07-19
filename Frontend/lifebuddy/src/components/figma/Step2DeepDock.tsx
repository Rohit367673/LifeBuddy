import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { FormData } from './TaskSchedulerForm';
import { ChevronLeft, FileText, MessageSquare, ArrowRight, Brain, Lightbulb } from 'lucide-react';

interface Step2Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step2DeepDock({ formData, updateFormData, onNext, onPrev }: Step2Props) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const canProceed = formData.taskDescription.trim();

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
      className="space-y-8 min-h-[600px] max-h-[80vh] overflow-y-auto pb-8"
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
          className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <motion.div
            className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 0.9, 1] 
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Brain className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Deepdock Part
            </h2>
            <p className="text-slate-600 mt-1">Provide detailed information for better AI scheduling</p>
          </div>
        </motion.div>
      </motion.div>

      <div className="space-y-8">
        {/* Task Description */}
        <motion.div 
          className="space-y-4"
          variants={itemVariants}
        >
          <Label htmlFor="taskDescription" className="text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Task Description
          </Label>
          <motion.div
            className="relative"
            animate={focusedField === 'taskDescription' ? { scale: 1.01 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Textarea
              id="taskDescription"
              placeholder="Describe your task in detail... 

Examples:
• Create a comprehensive marketing strategy for Q2
• Develop a mobile app prototype with user authentication
• Write and edit a 50-page research report on market trends"
              value={formData.taskDescription}
              onChange={(e) => updateFormData({ taskDescription: e.target.value })}
              onFocus={() => setFocusedField('taskDescription')}
              onBlur={() => setFocusedField(null)}
              className="min-h-[180px] text-lg border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md resize-none leading-relaxed"
              rows={7}
            />
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/5 to-cyan-400/5 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: focusedField === 'taskDescription' ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Character Counter */}
            <motion.div
              className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: formData.taskDescription.length > 0 ? 1 : 0 }}
            >
              {formData.taskDescription.length} characters
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Requirements/Questions */}
        <motion.div 
          className="space-y-4"
          variants={itemVariants}
        >
          <Label htmlFor="requirements" className="text-slate-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            Requirements / Questions
          </Label>
          <motion.div
            className="relative"
            animate={focusedField === 'requirements' ? { scale: 1.01 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Textarea
              id="requirements"
              placeholder="Any specific requirements or questions you have...

Examples:
• What tools or resources do I need?
• Are there any dependencies or deadlines to consider?
• Should this task be broken into smaller subtasks?
• Any preferred working hours or time blocks?"
              value={formData.requirements}
              onChange={(e) => updateFormData({ requirements: e.target.value })}
              onFocus={() => setFocusedField('requirements')}
              onBlur={() => setFocusedField(null)}
              className="min-h-[140px] text-lg border-2 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md resize-none leading-relaxed"
              rows={5}
            />
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-400/5 to-purple-400/5 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: focusedField === 'requirements' ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.div>

        {/* AI Tip */}
        <motion.div
          className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start gap-3">
            <motion.div
              className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex-shrink-0"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lightbulb className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">💡 AI Tip</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                The more detailed your description, the better our AI can optimize your schedule. 
                Include specific goals, preferred time blocks, and any constraints to get personalized recommendations.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.div 
        className="flex justify-between pt-6 mb-2 px-4"
        variants={itemVariants}
      >
        <motion.div
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onPrev}
            variant="outline"
            className="h-14 px-6 text-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </motion.div>
        
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
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            <span>Continue to Contact</span>
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
            Step 2 of 3 complete! Almost ready for AI magic 🚀
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}