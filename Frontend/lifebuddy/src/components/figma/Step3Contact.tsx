import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FormData } from './TaskSchedulerForm';
import { ChevronLeft, Calendar, Phone, Shield, Sparkles, Zap, Check, MessageCircle, Mail, Smartphone } from 'lucide-react';

interface Step3Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onSubmit: () => void;
  onPrev: () => void;
}

export function Step3Contact({ formData, updateFormData, onSubmit, onPrev }: Step3Props) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('email');
  const canSubmit = formData.contactInfo?.trim() && formData.agreeToTerms;

  const countryCodes = [
    { code: '+1', country: 'US/CA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+49', country: 'DE', flag: '🇩🇪' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+39', country: 'IT', flag: '🇮🇹' },
    { code: '+34', country: 'ES', flag: '🇪🇸' },
    { code: '+81', country: 'JP', flag: '🇯🇵' },
    { code: '+86', country: 'CN', flag: '🇨🇳' },
    { code: '+91', country: 'IN', flag: '🇮🇳' },
    { code: '+61', country: 'AU', flag: '🇦🇺' }
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    onSubmit();
    setIsSubmitting(false);
  };

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
          className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <motion.div
            className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Phone className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Contact Details
            </h2>
            <p className="text-slate-600 mt-1">Final step to unlock your AI-powered schedule</p>
          </div>
        </motion.div>
      </motion.div>

      <div className="space-y-8">
        {/* Messaging Platform Selection */}
        <motion.div 
          className="space-y-4"
          variants={itemVariants}
        >
          <Label className="text-slate-700 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-indigo-500" />
            Choose Notification Platform
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                id: 'email', 
                icon: Mail, 
                title: 'Email', 
                description: 'Receive daily tasks via email',
                color: 'from-blue-500 to-cyan-500'
              },
              { 
                id: 'whatsapp', 
                icon: Smartphone, 
                title: 'WhatsApp', 
                description: 'Get notifications on WhatsApp (India-focused)',
                color: 'from-green-500 to-emerald-500'
              },
              { 
                id: 'telegram', 
                icon: MessageCircle, 
                title: 'Telegram', 
                description: 'Receive messages on Telegram (Global)',
                color: 'from-indigo-500 to-purple-500'
              }
            ].map((platform) => (
              <motion.div
                key={platform.id}
                className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedPlatform === platform.id 
                    ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg' 
                    : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedPlatform(platform.id);
                  updateFormData({ notificationPlatform: platform.id });
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${platform.color}`}>
                    <platform.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{platform.title}</h3>
                    <p className="text-xs text-slate-600">{platform.description}</p>
                  </div>
                </div>
                {selectedPlatform === platform.id && (
                  <motion.div
                    className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div 
          className="space-y-4"
          variants={itemVariants}
        >
          <Label className="text-slate-700 flex items-center gap-2">
            {selectedPlatform === 'whatsapp' ? (
              <Smartphone className="w-4 h-4 text-green-500" />
            ) : selectedPlatform === 'telegram' ? (
              <MessageCircle className="w-4 h-4 text-indigo-500" />
            ) : (
              <Mail className="w-4 h-4 text-blue-500" />
            )}
            {selectedPlatform === 'whatsapp' ? 'WhatsApp Number' : 
             selectedPlatform === 'telegram' ? 'Telegram Chat ID' : 'Email Address'}
          </Label>
          {selectedPlatform === 'telegram' && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="btn-primary w-full py-3 text-lg"
                onClick={async () => {
                  // Fetch link token from backend
                  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/telegram/link-token`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  if (res.ok) {
                    const data = await res.json();
                    const token = data.token;
                    window.open(`https://t.me/lifebuddy_AI_bot?start=${token}`, '_blank');
                  } else {
                    alert('Failed to get Telegram link token.');
                  }
                }}
              >
                Connect Telegram
              </button>
              <div className="text-xs text-indigo-700 mt-2">
                After clicking, send <b>/start</b> to the bot. Your account will be linked automatically.<br/>
                <span className="text-gray-500">Waiting for connection...</span>
              </div>
            </div>
          )}
          <motion.div 
            className="flex gap-4"
            animate={focusedField === 'contactInfo' ? { scale: 1.01 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {selectedPlatform === 'whatsapp' && (
              <Select
                value={formData.countryCode}
                onValueChange={(value) => updateFormData({ countryCode: value })}
              >
                <SelectTrigger className="w-32 h-14 border-2 border-slate-200 focus:border-indigo-400 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      <span className="flex items-center gap-2">
                        <span>{item.flag}</span>
                        <span>{item.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <motion.div className={`relative ${selectedPlatform === 'whatsapp' ? 'flex-1' : 'w-full'}`}>
              <Input
                type={selectedPlatform === 'email' ? 'email' : selectedPlatform === 'telegram' ? 'text' : 'text'}
                placeholder={
                  selectedPlatform === 'whatsapp' ? 'Enter your WhatsApp number' :
                  selectedPlatform === 'telegram' ? 'Enter your Telegram chat ID (numeric, not @username)' :
                  'Enter your email address'
                }
                value={formData.contactInfo || ''}
                onChange={(e) => {
                  let value = e.target.value;
                  if (selectedPlatform === 'telegram') {
                    // Only allow numbers
                    value = value.replace(/[^0-9]/g, '');
                  }
                  updateFormData({ contactInfo: value });
                }}
                onFocus={() => setFocusedField('contactInfo')}
                onBlur={() => setFocusedField(null)}
                className="h-14 text-lg border-2 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              />
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400/5 to-purple-400/5 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: focusedField === 'contactInfo' ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Terms Agreement */}
        <motion.div 
          className="space-y-4"
          variants={itemVariants}
        >
          <motion.div 
            className="flex items-start space-x-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200"
            whileHover={{ scale: 1.01 }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => updateFormData({ agreeToTerms: !!checked })}
                className="w-5 h-5 border-2 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-md"
              />
            </motion.div>
            <div className="flex-1">
              <Label htmlFor="agreeToTerms" className="text-sm text-slate-700 leading-relaxed cursor-pointer">
                <span className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">Privacy & Terms Agreement</span>
                </span>
                I agree to receive AI-generated daily task notifications and productivity support. 
                I understand that LifeBuddy will use my information to provide personalized scheduling services 
                and keep my data secure and private.
              </Label>
            </div>
          </motion.div>
        </motion.div>

        {/* Benefits Preview */}
        <motion.div
          className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
        >
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            What happens next?
          </h4>
          <div className="space-y-2">
            {[
              'AI analyzes your task and creates an optimal schedule',
              'Receive personalized time blocks and productivity tips',
              'Get smart notifications and progress tracking',
              'Access your dashboard with detailed insights'
            ].map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                <span className="text-sm text-slate-600">{item}</span>
              </motion.div>
            ))}
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
            disabled={isSubmitting}
            className="h-14 px-6 text-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={canSubmit && !isSubmitting ? { scale: 1.05 } : {}}
          whileTap={canSubmit && !isSubmitting ? { scale: 0.95 } : {}}
        >
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`
              relative h-16 px-12 text-lg font-bold rounded-2xl transition-all duration-500 shadow-2xl overflow-hidden
              ${canSubmit && !isSubmitting
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white transform hover:shadow-3xl' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {/* Animated Background */}
            {canSubmit && !isSubmitting && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 opacity-0"
                animate={{ 
                  opacity: [0, 0.3, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            <div className="relative flex items-center gap-3">
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-6 h-6" />
                  </motion.div>
                  <span>Creating Your Schedule...</span>
                </>
              ) : canSubmit ? (
                <>
                  <Calendar className="w-6 h-6" />
                  <span>📅 Schedule With AI</span>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                </>
              ) : (
                <>
                  <Calendar className="w-6 h-6" />
                  <span>Complete Form First</span>
                </>
              )}
            </div>
          </Button>
        </motion.div>
      </motion.div>

      {/* Final Encouragement */}
      {canSubmit && !isSubmitting && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎉 Ready to transform your productivity with AI! 
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Click the button above to start your intelligent scheduling journey
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}