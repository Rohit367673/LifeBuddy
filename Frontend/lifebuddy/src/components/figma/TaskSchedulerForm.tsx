import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { StepIndicator } from './StepIndicator';
import { Step1TaskSchedule } from './Step1TaskSchedule';
import { Step2DeepDock } from './Step2DeepDock';
import { Step3Contact } from './Step3Contact';

export interface FormData {
  taskTitle: string;
  startDate: string;
  endDate: string;
  taskDescription: string;
  requirements: string;
  contactNumber: string;
  countryCode: string;
  agreeToTerms: boolean;
}

interface TaskSchedulerFormProps {
  onScheduleCreated?: () => void;
}

export function TaskSchedulerForm({ onScheduleCreated }: TaskSchedulerFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    taskTitle: '',
    startDate: '',
    endDate: '',
    taskDescription: '',
    requirements: '',
    contactNumber: '',
    countryCode: '+1',
    agreeToTerms: false
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = async () => {
    if (currentStep < 3) {
      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(currentStep + 1);
      setIsTransitioning(false);
    }
  };

  const prevStep = async () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(currentStep - 1);
      setIsTransitioning(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Here you would send the data to your backend
      console.log('Form submitted:', formData);
      
      // For now, just show success message
      alert('Schedule created successfully! Check your phone for the new plan.');
      
      // Call the callback to refresh the task
      if (onScheduleCreated) {
        onScheduleCreated();
      }
      
      // In a real implementation, you would:
      // 1. Send formData to your backend API
      // 2. Handle the response
      // 3. Redirect or show success message
      // 4. Optionally refresh the page to show the new task
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to create schedule. Please try again.');
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Card className="relative p-4 sm:p-6 bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-400"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              backgroundSize: '400% 400%',
            }}
          />
        </div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StepIndicator currentStep={currentStep} />
        </motion.div>

        {/* Form Content with Page Transitions */}
        <div className="relative mt-6 sm:mt-8 min-h-[400px] sm:min-h-[500px]">
          <AnimatePresence mode="wait" custom={currentStep}>
            <motion.div
              key={currentStep}
              custom={currentStep}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.4 }
              }}
              className="absolute inset-0"
            >
              {currentStep === 1 && (
                <Step1TaskSchedule 
                  formData={formData} 
                  updateFormData={updateFormData}
                  onNext={nextStep}
                />
              )}
              
              {currentStep === 2 && (
                <Step2DeepDock 
                  formData={formData} 
                  updateFormData={updateFormData}
                  onNext={nextStep}
                  onPrev={prevStep}
                />
              )}
              
              {currentStep === 3 && (
                <Step3Contact 
                  formData={formData} 
                  updateFormData={updateFormData}
                  onSubmit={handleSubmit}
                  onPrev={prevStep}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <motion.div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-b-lg"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / 3) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </Card>
    </motion.div>
  );
}