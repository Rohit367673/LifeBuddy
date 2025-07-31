import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/api';
import { PremiumTask } from '../../types';
import Button from '../../components/common/Button';

const ProductivityScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [premiumTasks, setPremiumTasks] = useState<PremiumTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    loadProductivityData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadProductivityData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPremiumTasks();
      if (response.success && response.data) {
        setPremiumTasks(response.data);
      }
    } catch (error) {
      console.error('Error loading productivity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiService.completePremiumTask(taskId);
      loadProductivityData(); // Refresh tasks
      Alert.alert('Success', 'Task completed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setTimer(0);
    setIsTimerRunning(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const categories = [
    { id: 'all', name: 'All Tasks', icon: 'grid-outline' },
    { id: 'focus', name: 'Focus', icon: 'eye-outline' },
    { id: 'creativity', name: 'Creativity', icon: 'bulb-outline' },
    { id: 'health', name: 'Health', icon: 'fitness-outline' },
    { id: 'learning', name: 'Learning', icon: 'school-outline' },
  ];

  const filteredTasks = selectedCategory === 'all' 
    ? premiumTasks 
    : premiumTasks.filter(task => task.category === selectedCategory);

  const CategoryButton = ({ category }: { category: typeof categories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        {
          backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Ionicons
        name={category.icon as any}
        size={20}
        color={selectedCategory === category.id ? '#FFFFFF' : theme.colors.text}
      />
      <Text
        style={[
          styles.categoryText,
          {
            color: selectedCategory === category.id ? '#FFFFFF' : theme.colors.text,
          },
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const TaskCard = ({ task }: { task: PremiumTask }) => (
    <TouchableOpacity
      style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleCompleteTask(task._id)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(task.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(task.difficulty) }]}>
                {task.difficulty.toUpperCase()}
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={12} color={theme.colors.warning} />
              <Text style={[styles.pointsText, { color: theme.colors.text }]}>
                {task.points}
              </Text>
            </View>
          </View>
        </View>
        {task.isCompleted ? (
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color={theme.colors.textSecondary} />
        )}
      </View>
      
      <Text style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
        {task.description}
      </Text>
      
      {task.isCompleted && (
        <Text style={[styles.completedText, { color: theme.colors.success }]}>
          Completed on {new Date(task.completedAt!).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return theme.colors.success;
      case 'medium':
        return theme.colors.warning;
      case 'hard':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading productivity tools...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Productivity</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Advanced tools to boost your productivity
          </Text>
        </View>

        {/* Focus Timer */}
        <View style={[styles.timerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.timerHeader}>
            <Ionicons name="timer-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.timerTitle, { color: theme.colors.text }]}>
              Focus Timer
            </Text>
          </View>
          
          <View style={styles.timerDisplay}>
            <Text style={[styles.timerText, { color: theme.colors.text }]}>
              {formatTime(timer)}
            </Text>
          </View>
          
          <View style={styles.timerControls}>
            {!isTimerRunning ? (
              <Button
                title="Start Focus Session"
                onPress={startTimer}
                variant="primary"
                size="medium"
              />
            ) : (
              <View style={styles.timerButtons}>
                <Button
                  title="Pause"
                  onPress={pauseTimer}
                  variant="outline"
                  size="small"
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Reset"
                  onPress={resetTimer}
                  variant="danger"
                  size="small"
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.colors.primary + '10' }]}
              onPress={() => {
                // Navigate to focus mode
              }}
            >
              <Ionicons name="eye" size={32} color={theme.colors.primary} />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Focus Mode
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.colors.success + '10' }]}
              onPress={() => {
                // Navigate to goal setting
              }}
            >
              <Ionicons name="flag" size={32} color={theme.colors.success} />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Set Goals
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.colors.warning + '10' }]}
              onPress={() => {
                // Navigate to habit tracker
              }}
            >
              <Ionicons name="repeat" size={32} color={theme.colors.warning} />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Habit Tracker
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.colors.info + '10' }]}
              onPress={() => {
                // Navigate to time tracking
              }}
            >
              <Ionicons name="time" size={32} color={theme.colors.info} />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Time Tracking
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Tasks */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Premium Tasks
            </Text>
            <Text style={[styles.tasksCount, { color: theme.colors.textSecondary }]}>
              {premiumTasks.filter(t => t.isCompleted).length}/{premiumTasks.length} completed
            </Text>
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesList}>
              {categories.map((category) => (
                <CategoryButton key={category.id} category={category} />
              ))}
            </View>
          </ScrollView>

          {/* Tasks List */}
          {filteredTasks.length > 0 ? (
            <View style={styles.tasksList}>
              {filteredTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No tasks found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                {selectedCategory === 'all' 
                  ? 'No premium tasks available' 
                  : `No ${selectedCategory} tasks available`}
              </Text>
            </View>
          )}
        </View>

        {/* Productivity Tips */}
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Productivity Tips
          </Text>
          
          <View style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="bulb-outline" size={24} color={theme.colors.warning} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: theme.colors.text }]}>
                Use the Pomodoro Technique
              </Text>
              <Text style={[styles.tipDescription, { color: theme.colors.textSecondary }]}>
                Work for 25 minutes, then take a 5-minute break. This helps maintain focus and prevent burnout.
              </Text>
            </View>
          </View>
          
          <View style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: theme.colors.text }]}>
                Prioritize Your Tasks
              </Text>
              <Text style={[styles.tipDescription, { color: theme.colors.textSecondary }]}>
                Focus on the most important tasks first. Use the Eisenhower Matrix to categorize your tasks.
              </Text>
            </View>
          </View>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  timerCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerControls: {
    alignItems: 'center',
  },
  timerButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickAction: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  tasksSection: {
    marginBottom: 20,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  tasksCount: {
    fontSize: 14,
  },
  categoriesList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  tasksList: {
    paddingHorizontal: 20,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ProductivityScreen; 