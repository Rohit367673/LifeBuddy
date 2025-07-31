// User Types
export interface User {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  isPremium: boolean;
  premiumExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Event Types
export interface Event {
  _id: string;
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  isCompleted: boolean;
  userId: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

// Task Types
export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completedAt?: Date;
  eventId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mood Types
export interface Mood {
  _id: string;
  userId: string;
  score: number;
  note?: string;
  date: Date;
  createdAt: Date;
}

// Achievement Types
export interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  userId: string;
  createdAt: Date;
}

// Motivational Message Types
export interface MotivationalMessage {
  _id: string;
  message: string;
  author?: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
}

// Premium Task Types
export interface PremiumTask {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isCompleted: boolean;
  completedAt?: Date;
  userId: string;
  createdAt: Date;
}

// Store Item Types
export interface StoreItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  createdAt: Date;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Home: undefined;
  Dashboard: undefined;
  Events: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId?: string };
  DailyTools: undefined;
  Analytics: undefined;
  Profile: undefined;
  Settings: undefined;
  Premium: undefined;
  Store: undefined;
  MySchedule: undefined;
  Productivity: undefined;
  Login: undefined;
  Signup: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Events: undefined;
  DailyTools: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Theme Types
export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  isRead: boolean;
}

// Analytics Types
export interface AnalyticsData {
  totalEvents: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  moodStreak: number;
  totalPoints: number;
  achievements: number;
  productivityScore: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface EventForm {
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}

export interface TaskForm {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  eventId?: string;
} 