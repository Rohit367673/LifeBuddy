import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { StepIndicator } from './StepIndicator';
import { Step1TaskSchedule } from './Step1TaskSchedule';
import { Step2DeepDock } from './Step2DeepDock';
import { Step3Contact } from './Step3Contact';
import { useNavigate } from 'react-router-dom';

export interface FormData {
  taskTitle: string;
  startDate: string;
  endDate: string;
  taskDescription: string;
  requirements: string;
  contactInfo: string;
  countryCode: string;
  notificationPlatform: string;
  agreeToTerms: boolean;
}

export function TaskSchedulerForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    taskTitle: '',
    startDate: '',
    endDate: '',
    taskDescription: '',
    requirements: '',
    contactInfo: '',
    countryCode: '+1',
    notificationPlatform: 'email',
    agreeToTerms: false
  });
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
    console.log('Form submitted:', formData);
    
    try {
      // Here you would typically send the data to your backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth method
        },
        body: JSON.stringify({
          title: formData.taskTitle,
          description: formData.taskDescription,
          requirements: formData.requirements,
          startDate: formData.startDate,
          endDate: formData.endDate,
          notificationPlatform: formData.notificationPlatform,
          contactInfo: formData.contactInfo,
          consentGiven: formData.agreeToTerms
        })
      });

      if (response.ok) {
        // Redirect to the schedule page after successful submission
        navigate('/my-schedule');
      } else {
        const errorData = await response.json();
        setFormError(errorData.message || 'Failed to create schedule');
        // Handle error (show toast, etc.)
      }
    } catch (error) {
      setFormError('Error creating schedule');
      // Handle error (show toast, etc.)
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
      <Card className="relative p-8 bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
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
        <div className="relative mt-8 min-h-[500px]">
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
        {formError && <div className="text-red-600 text-sm mb-2">{formError}</div>}
      </Card>
    </motion.div>
  );
}