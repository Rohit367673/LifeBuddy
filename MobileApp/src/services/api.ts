import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  Event, 
  Task, 
  Mood, 
  Achievement, 
  MotivationalMessage, 
  PremiumTask, 
  StoreItem,
  ApiResponse,
  PaginatedResponse,
  LoginForm,
  SignupForm,
  EventForm,
  TaskForm
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://your-backend-url.com';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Services
  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
        await this.api.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signup(userData: SignupForm): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
        await this.api.post('/api/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/api/auth/logout');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // User Services
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = 
        await this.api.get('/api/users/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = 
        await this.api.put('/api/users/profile', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = 
        await this.api.get('/api/users/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Event Services
  async getEvents(params?: { limit?: number; page?: number; type?: string }): Promise<ApiResponse<PaginatedResponse<Event>>> {
    try {
      const response: AxiosResponse<ApiResponse<PaginatedResponse<Event>>> = 
        await this.api.get('/api/events', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEventById(eventId: string): Promise<ApiResponse<Event>> {
    try {
      const response: AxiosResponse<ApiResponse<Event>> = 
        await this.api.get(`/api/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createEvent(eventData: EventForm): Promise<ApiResponse<Event>> {
    try {
      const response: AxiosResponse<ApiResponse<Event>> = 
        await this.api.post('/api/events', eventData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateEvent(eventId: string, eventData: Partial<EventForm>): Promise<ApiResponse<Event>> {
    try {
      const response: AxiosResponse<ApiResponse<Event>> = 
        await this.api.put(`/api/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = 
        await this.api.delete(`/api/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Task Services
  async getTasks(params?: { limit?: number; page?: number; status?: string; eventId?: string }): Promise<ApiResponse<PaginatedResponse<Task>>> {
    try {
      const response: AxiosResponse<ApiResponse<PaginatedResponse<Task>>> = 
        await this.api.get('/api/tasks', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTaskById(taskId: string): Promise<ApiResponse<Task>> {
    try {
      const response: AxiosResponse<ApiResponse<Task>> = 
        await this.api.get(`/api/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createTask(taskData: TaskForm): Promise<ApiResponse<Task>> {
    try {
      const response: AxiosResponse<ApiResponse<Task>> = 
        await this.api.post('/api/tasks', taskData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTask(taskId: string, taskData: Partial<TaskForm>): Promise<ApiResponse<Task>> {
    try {
      const response: AxiosResponse<ApiResponse<Task>> = 
        await this.api.put(`/api/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = 
        await this.api.delete(`/api/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async completeTask(taskId: string): Promise<ApiResponse<Task>> {
    try {
      const response: AxiosResponse<ApiResponse<Task>> = 
        await this.api.put(`/api/tasks/${taskId}/complete`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mood Services
  async getMoods(params?: { limit?: number; page?: number }): Promise<ApiResponse<PaginatedResponse<Mood>>> {
    try {
      const response: AxiosResponse<ApiResponse<PaginatedResponse<Mood>>> = 
        await this.api.get('/api/mood', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createMood(moodData: { score: number; note?: string }): Promise<ApiResponse<Mood>> {
    try {
      const response: AxiosResponse<ApiResponse<Mood>> = 
        await this.api.post('/api/mood', moodData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Achievement Services
  async getAchievements(): Promise<ApiResponse<Achievement[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Achievement[]>> = 
        await this.api.get('/api/achievements');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Motivational Message Services
  async getMotivationalMessage(): Promise<ApiResponse<MotivationalMessage>> {
    try {
      const response: AxiosResponse<ApiResponse<MotivationalMessage>> = 
        await this.api.get('/api/motivational/random');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Premium Task Services
  async getPremiumTasks(): Promise<ApiResponse<PremiumTask[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PremiumTask[]>> = 
        await this.api.get('/api/premium-tasks');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async completePremiumTask(taskId: string): Promise<ApiResponse<PremiumTask>> {
    try {
      const response: AxiosResponse<ApiResponse<PremiumTask>> = 
        await this.api.put(`/api/premium-tasks/${taskId}/complete`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Store Services
  async getStoreItems(): Promise<ApiResponse<StoreItem[]>> {
    try {
      const response: AxiosResponse<ApiResponse<StoreItem[]>> = 
        await this.api.get('/api/store');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Subscription Services
  async getSubscriptionStatus(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = 
        await this.api.get('/api/subscriptions/status');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async upgradeToPremium(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = 
        await this.api.post('/api/subscriptions/upgrade');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred.');
    }
  }
}

export const apiService = new ApiService();
export default apiService; 