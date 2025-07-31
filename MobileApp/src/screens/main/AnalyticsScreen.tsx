import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/api';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const { theme } = useTheme();
  
  const [stats, setStats] = useState({
    totalEvents: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    moodStreak: 0,
    totalPoints: 0,
    achievements: 0,
    productivityScore: 0,
  });
  const [moodData, setMoodData] = useState<any[]>([]);
  const [taskData, setTaskData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsResponse, moodResponse, taskResponse] = await Promise.all([
        apiService.getUserStats(),
        apiService.getMoods({ limit: 30 }),
        apiService.getTasks({ limit: 100 }),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (moodResponse.success && moodResponse.data) {
        const moodChartData = moodResponse.data.data.slice(-7).map((mood: any, index: number) => ({
          date: new Date(mood.date).toLocaleDateString('en-US', { weekday: 'short' }),
          score: mood.score,
        }));
        setMoodData(moodChartData);
      }

      if (taskResponse.success && taskResponse.data) {
        const taskChartData = [
          { status: 'Completed', count: taskResponse.data.data.filter((t: any) => t.status === 'completed').length },
          { status: 'Pending', count: taskResponse.data.data.filter((t: any) => t.status === 'pending').length },
          { status: 'Overdue', count: taskResponse.data.data.filter((t: any) => t.status === 'overdue').length },
        ];
        setTaskData(taskChartData);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const moodChartData = {
    labels: moodData.map(d => d.date),
    datasets: [
      {
        data: moodData.map(d => d.score),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const taskChartData = {
    labels: taskData.map(d => d.status),
    data: taskData.map(d => d.count),
  };

  const pieChartData = taskData.map((item, index) => ({
    name: item.status,
    population: item.count,
    color: index === 0 ? theme.colors.success : index === 1 ? theme.colors.warning : theme.colors.error,
    legendFontColor: theme.colors.text,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Track your progress and insights
          </Text>
        </View>

        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon="calendar"
            color={theme.colors.primary}
          />
          <StatCard
            title="Completed Tasks"
            value={stats.completedTasks}
            icon="checkmark-circle"
            color={theme.colors.success}
          />
          <StatCard
            title="Mood Streak"
            value={stats.moodStreak}
            icon="flame"
            color={theme.colors.error}
            subtitle="days"
          />
          <StatCard
            title="Total Points"
            value={stats.totalPoints}
            icon="star"
            color={theme.colors.warning}
          />
        </View>

        {/* Productivity Score */}
        <View style={[styles.productivityCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.productivityHeader}>
            <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
            <Text style={[styles.productivityTitle, { color: theme.colors.text }]}>
              Productivity Score
            </Text>
          </View>
          <View style={styles.productivityContent}>
            <Text style={[styles.productivityScore, { color: theme.colors.primary }]}>
              {stats.productivityScore}%
            </Text>
            <View style={styles.productivityBar}>
              <View
                style={[
                  styles.productivityFill,
                  {
                    width: `${stats.productivityScore}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.productivitySubtitle, { color: theme.colors.textSecondary }]}>
              Based on completed tasks and events
            </Text>
          </View>
        </View>

        {/* Mood Tracking Chart */}
        {moodData.length > 0 && (
          <ChartCard title="Mood Trends (Last 7 Days)">
            <LineChart
              data={moodChartData}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </ChartCard>
        )}

        {/* Task Status Chart */}
        {taskData.length > 0 && (
          <ChartCard title="Task Status Distribution">
            <BarChart
              data={taskChartData}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </ChartCard>
        )}

        {/* Task Breakdown */}
        <View style={[styles.breakdownCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.breakdownTitle, { color: theme.colors.text }]}>
            Task Breakdown
          </Text>
          <View style={styles.breakdownItems}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: theme.colors.success }]} />
              <Text style={[styles.breakdownText, { color: theme.colors.text }]}>
                Completed: {stats.completedTasks}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={[styles.breakdownText, { color: theme.colors.text }]}>
                Pending: {stats.pendingTasks}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: theme.colors.error }]} />
              <Text style={[styles.breakdownText, { color: theme.colors.text }]}>
                Overdue: {stats.overdueTasks}
              </Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={[styles.insightsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.insightsTitle, { color: theme.colors.text }]}>
            Insights
          </Text>
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <Ionicons name="bulb-outline" size={20} color={theme.colors.warning} />
              <Text style={[styles.insightText, { color: theme.colors.text }]}>
                You've completed {stats.completedTasks} tasks this month
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="trending-up-outline" size={20} color={theme.colors.success} />
              <Text style={[styles.insightText, { color: theme.colors.text }]}>
                Your mood streak is {stats.moodStreak} days
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="trophy-outline" size={20} color={theme.colors.warning} />
              <Text style={[styles.insightText, { color: theme.colors.text }]}>
                You've earned {stats.totalPoints} points
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
    fontWeight: '600',
  },
  statSubtitle: {
    fontSize: 12,
  },
  productivityCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  productivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  productivityContent: {
    alignItems: 'center',
  },
  productivityScore: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  productivityBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  productivityFill: {
    height: '100%',
    borderRadius: 4,
  },
  productivitySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  breakdownCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  breakdownItems: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  breakdownText: {
    fontSize: 16,
  },
  insightsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default AnalyticsScreen; 