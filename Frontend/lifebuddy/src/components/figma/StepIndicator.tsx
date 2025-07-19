import React from 'react';
import { motion } from 'framer-motion';
import { Check, Calendar, FileText, Phone, Sparkles } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, title: 'Set Task Schedule', subtitle: 'Define your goals', icon: Calendar, color: 'from-purple-500 to-pink-500' },
    { number: 2, title: 'Deepdock Part', subtitle: 'Add details', icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { number: 3, title: 'Contact Details', subtitle: 'Final step', icon: Phone, color: 'from-indigo-500 to-purple-500' }
  ];

  return (
    <div className="relative">
      {/* Background Glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-100/50 via-blue-100/50 to-cyan-100/50 rounded-2xl blur-xl"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      <div className="relative flex items-center justify-between p-6 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const IconComponent = step.icon;

          return (
            <React.Fragment key={step.number}>
              {/* Step Container */}
              <motion.div 
                className="flex items-center relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Floating Sparkles for Current Step */}
                {isCurrent && (
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                )}

                {/* Step Circle */}
                <motion.div 
                  className={`
                    relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-500 group cursor-pointer
                    ${isCompleted 
                      ? `bg-gradient-to-br ${step.color} border-transparent text-white shadow-lg` 
                      : isCurrent 
                        ? `bg-gradient-to-br ${step.color} border-transparent text-white shadow-xl shadow-purple-500/25` 
                        : 'bg-white/60 border-slate-300 text-slate-400 hover:border-slate-400'
                    }
                  `}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: isCompleted ? 0 : 5,
                    y: -2 
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={isCurrent ? {
                    boxShadow: [
                      '0 0 0 0 rgba(147, 51, 234, 0.4)',
                      '0 0 0 10px rgba(147, 51, 234, 0)',
                      '0 0 0 0 rgba(147, 51, 234, 0)'
                    ]
                  } : {}}
                  transition={{
                    boxShadow: { duration: 2, repeat: Infinity }
                  }}
                >
                  <motion.div
                    animate={isCompleted ? { rotate: 360 } : {}}
                    transition={{ duration: 0.6, type: "spring" }}
                  >
                    {isCompleted ? (
                      <Check className="w-7 h-7" />
                    ) : (
                      <IconComponent className="w-7 h-7" />
                    )}
                  </motion.div>

                  {/* Glow Effect */}
                  {isCurrent && (
                    <motion.div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-20 blur-md`}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                
                {/* Step Info */}
                <motion.div 
                  className="ml-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <motion.p 
                    className={`font-semibold transition-all duration-300 ${
                      isCurrent ? 'text-purple-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {step.title}
                  </motion.p>
                  <p className={`text-sm transition-all duration-300 ${
                    isCurrent ? 'text-purple-500' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {step.subtitle}
                  </p>
                </motion.div>
              </motion.div>

              {/* Animated Connector Line */}
              {index < steps.length - 1 && (
                <motion.div 
                  className="flex-1 relative mx-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {/* Base Line */}
                  <div className="h-0.5 bg-slate-200 rounded-full" />
                  
                  {/* Progress Line */}
                  <motion.div 
                    className={`absolute top-0 left-0 h-0.5 rounded-full bg-gradient-to-r ${step.color}`}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: isCompleted ? '100%' : isCurrent ? '50%' : '0%'
                    }}
                    transition={{ 
                      duration: 0.8, 
                      ease: "easeInOut",
                      delay: isCompleted ? 0 : 0.5
                    }}
                  />
                  
                  {/* Animated Dots */}
                  {isCompleted && (
                    <motion.div
                      className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm"
                      animate={{ x: ['0%', '100%', '0%'] }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                  )}
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}