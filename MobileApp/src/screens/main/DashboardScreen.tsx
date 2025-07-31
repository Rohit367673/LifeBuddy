import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/api';
import { Event, Task, MotivationalMessage, Achievement } from '../../types';
import Button from '../../components/common/Button';

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    moodStreak: 0,
    totalPoints: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState<MotivationalMessage | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadRecentEvents(),
        loadUpcomingTasks(),
        loadMotivationalMessage(),
        loadRecentAchievements(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getUserStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentEvents = async () => {
    try {
      const response = await apiService.getEvents({ limit: 3 });
      if (response.success && response.data) {
        setRecentEvents(response.data.data);
      }
    } catch (error) {
      console.error('Error loading recent events:', error);
    }
  };

  const loadUpcomingTasks = async () => {
    try {
      const response = await apiService.getTasks({ limit: 5, status: 'pending' });
      if (response.success && response.data) {
        setUpcomingTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error loading upcoming tasks:', error);
    }
  };

  const loadMotivationalMessage = async () => {
    try {
      const response = await apiService.getMotivationalMessage();
      if (response.success && response.data) {
        setMotivationalMessage(response.data);
      }
    } catch (error) {
      console.error('Error loading motivational message:', error);
    }
  };

  const loadRecentAchievements = async () => {
    try {
      const response = await apiService.getAchievements();
      if (response.success && response.data) {
        setRecentAchievements(response.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const markTaskComplete = async (taskId: string) => {
    try {
      await apiService.completeTask(taskId);
      // Refresh tasks
      loadUpcomingTasks();
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      </View>
    </View>
  );

  const TaskItem = ({ task }: { task: Task }) => (
    <TouchableOpacity
      style={[styles.taskItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => markTaskComplete(task._id)}
    >
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{task.title}</Text>
        {task.description && (
          <Text style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
            {task.description}
          </Text>
        )}
      </View>
      <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.success} />
    </TouchableOpacity>
  );

  const EventCard = ({ event }: { event: Event }) => (
    <TouchableOpacity style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.eventHeader}>
        <Text style={[styles.eventTitle, { color: theme.colors.text }]}>{event.title}</Text>
        <View style={[styles.eventStatus, { backgroundColor: event.isCompleted ? theme.colors.success : theme.colors.warning }]}>
          <Text style={styles.eventStatusText}>
            {event.isCompleted ? 'Completed' : 'Active'}
          </Text>
        </View>
      </View>
      <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]}>
        {event.description}
      </Text>
      <Text style={[styles.eventDate, { color: theme.colors.textSecondary }]}>
        {new Date(event.startDate).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            {getGreeting()}, {user?.firstName || user?.username || 'User'}!
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Here's what's happening today
          </Text>
        </View>

        {/* Motivational Message */}
        {motivationalMessage && (
          <View style={[styles.motivationalCard, { backgroundColor: theme.colors.primary + '10' }]}>
            <Ionicons name="quote" size={24} color={theme.colors.primary} />
            <Text style={[styles.motivationalText, { color: theme.colors.text }]}>
              {motivationalMessage.message}
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="Events" value={stats.totalEvents} icon="calendar" color={theme.colors.primary} />
          <StatCard title="Tasks" value={stats.completedTasks} icon="checkmark-circle" color={theme.colors.success} />
          <StatCard title="Points" value={stats.totalPoints} icon="star" color={theme.colors.warning} />
          <StatCard title="Streak" value={stats.moodStreak} icon="flame" color={theme.colors.error} />
        </View>

        {/* Upcoming Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Upcoming Tasks</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {upcomingTasks.length > 0 ? (
            upcomingTasks.map((task) => (
              <TaskItem key={task._id} task={task} />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No upcoming tasks
            </Text>
          )}
        </View>

        {/* Recent Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Events</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentEvents.length > 0 ? (
            recentEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No recent events
            </Text>
          )}
        </View>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Achievements</Text>
            {recentAchievements.map((achievement) => (
              <View key={achievement._id} style={[styles.achievementCard, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="trophy" size={24} color={theme.colors.warning} />
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  motivationalCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  motivationalText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  eventStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  achievementContent: {
    flex: 1,
    marginLeft: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default DashboardScreen; 