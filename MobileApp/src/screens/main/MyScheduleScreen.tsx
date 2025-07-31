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
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/api';
import { Event, Task } from '../../types';
import Button from '../../components/common/Button';

const MyScheduleScreen: React.FC = () => {
  const { theme } = useTheme();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const [eventsResponse, tasksResponse] = await Promise.all([
        apiService.getEvents(),
        apiService.getTasks(),
      ]);

      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data.data);
      }

      if (tasksResponse.success && tasksResponse.data) {
        setTasks(tasksResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      Alert.alert('Error', 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toDateString();
    return events.filter(event => 
      new Date(event.startDate).toDateString() === dateString
    );
  };

  const getTasksForDate = (date: Date) => {
    const dateString = date.toDateString();
    return tasks.filter(task => 
      task.dueDate && new Date(task.dueDate).toDateString() === dateString
    );
  };

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = () => {
    const days = [];
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Add days from previous month to fill first week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const DayCell = ({ date, isSelected = false, isToday = false }: {
    date: Date;
    isSelected?: boolean;
    isToday?: boolean;
  }) => {
    const dayEvents = getEventsForDate(date);
    const dayTasks = getTasksForDate(date);
    const hasItems = dayEvents.length > 0 || dayTasks.length > 0;

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
            borderColor: isToday ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text
          style={[
            styles.dayNumber,
            {
              color: isSelected ? '#FFFFFF' : isToday ? theme.colors.primary : theme.colors.text,
            },
          ]}
        >
          {date.getDate()}
        </Text>
        {hasItems && (
          <View style={styles.dayIndicators}>
            {dayEvents.length > 0 && (
              <View style={[styles.indicator, { backgroundColor: theme.colors.primary }]} />
            )}
            {dayTasks.length > 0 && (
              <View style={[styles.indicator, { backgroundColor: theme.colors.success }]} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ScheduleItem = ({ item, type }: { item: Event | Task; type: 'event' | 'task' }) => (
    <TouchableOpacity
      style={[styles.scheduleItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => {
        // Navigate to item detail
      }}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemType}>
          <Ionicons
            name={type === 'event' ? 'calendar' : 'checkmark-circle'}
            size={16}
            color={type === 'event' ? theme.colors.primary : theme.colors.success}
          />
          <Text style={[styles.itemTypeText, { color: theme.colors.textSecondary }]}>
            {type === 'event' ? 'Event' : 'Task'}
          </Text>
        </View>
        <Text style={[styles.itemTime, { color: theme.colors.textSecondary }]}>
          {new Date(type === 'event' ? (item as Event).startDate : (item as Task).dueDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      
      <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
        {type === 'event' ? (item as Event).title : (item as Task).title}
      </Text>
      
      {type === 'event' && (item as Event).location && (
        <View style={styles.itemLocation}>
          <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.itemLocationText, { color: theme.colors.textSecondary }]}>
            {(item as Event).location}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading schedule...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedDateEvents = getEventsForDate(selectedDate);
  const selectedDateTasks = getTasksForDate(selectedDate);
  const allSelectedItems = [...selectedDateEvents, ...selectedDateTasks].sort((a, b) => {
    const aDate = new Date('startDate' in a ? a.startDate : a.dueDate!);
    const bDate = new Date('startDate' in b ? b.startDate : b.dueDate!);
    return aDate.getTime() - bDate.getTime();
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>My Schedule</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.viewButtonText, { color: viewMode === 'week' ? theme.colors.primary : theme.colors.text }]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.viewButtonText, { color: viewMode === 'month' ? theme.colors.primary : theme.colors.text }]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar */}
      <View style={[styles.calendarContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={[styles.dayHeader, { color: theme.colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {(viewMode === 'week' ? getWeekDays() : getMonthDays()).map((date, index) => (
            <DayCell
              key={index}
              date={date}
              isSelected={date.toDateString() === selectedDate.toDateString()}
              isToday={date.toDateString() === new Date().toDateString()}
            />
          ))}
        </View>
      </View>

      {/* Selected Date Items */}
      <View style={styles.itemsContainer}>
        <View style={styles.itemsHeader}>
          <Text style={[styles.itemsTitle, { color: theme.colors.text }]}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <Text style={[styles.itemsCount, { color: theme.colors.textSecondary }]}>
            {allSelectedItems.length} items
          </Text>
        </View>

        {allSelectedItems.length > 0 ? (
          <ScrollView style={styles.itemsList}>
            {allSelectedItems.map((item, index) => (
              <ScheduleItem
                key={index}
                item={item}
                type={'startDate' in item ? 'event' : 'task'}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No events or tasks
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Add events or tasks to see them here
            </Text>
            <Button
              title="Add Event"
              onPress={() => {
                // Navigate to create event
              }}
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    margin: 1,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayIndicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
    gap: 2,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemsCount: {
    fontSize: 14,
  },
  itemsList: {
    flex: 1,
  },
  scheduleItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTypeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  itemTime: {
    fontSize: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLocationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
});

export default MyScheduleScreen; 