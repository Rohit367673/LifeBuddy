const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  subtask: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
  motivationTip: { type: String },
  // Rich learning fields
  dayTitle: { type: String },
  keyPoints: [{ type: String }],
  example: { type: String },
  tips: { type: String },
  duration: { type: String },
  motivation: { type: String },
  resources: [{ type: String }], // Learning resources and links
  exercises: [{ type: String }], // Practical exercises and tasks
  notes: { type: String }, // Additional learning notes
  day: { type: Number }, // Track day number
  // Advanced course logic fields:
  prerequisiteMet: { type: Boolean, default: true }, // Locked if previous not completed
  quiz: {
    question: { type: String },
    options: [{ type: String }], // For true/false: ["True", "False"]
    correctAnswer: { type: String }, // "True" or "False"
    userAnswer: { type: String },
    isCorrect: { type: Boolean }
  },
  quizAnswered: { type: Boolean, default: false },
  quizCorrect: { type: Boolean, default: false }
});

const premiumTaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  requirements: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  generatedSchedule: [subtaskSchema],
  consentGiven: { type: Boolean, default: false },
  currentDay: { type: Number, default: 1 }, // Track current day in roadmap
  scheduleSource: { type: String, enum: ['OpenRouter'], default: 'OpenRouter' }, // Track which AI service generated the schedule
  streak: { type: Number, default: 0 },
  stats: {
    completed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PremiumTask', premiumTaskSchema); 