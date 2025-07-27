import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  SparklesIcon,
  CogIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import EventModal from '../components/EventModal';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import toast from 'react-hot-toast';

const Events = () => {
  const { user, getFirebaseToken } = useAuth();
  const { isDarkMode } = useTheme();
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalType, setModalType] = useState('template'); // 'template', 'custom', 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [stats, setStats] = useState({
    totalEvents: 0,
    planningEvents: 0,
    inProgressEvents: 0,
    completedEvents: 0,
    upcomingEvents: 0,
    overdueEvents: 0,
    averageProgress: 0,
    totalBudget: 0,
    totalSpent: 0,
    budgetRemaining: 0
  });

  useEffect(() => {
    loadEvents();
    loadTemplates();
    loadStats();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/templates`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateEvent = (type, template = null) => {
    setModalType(type);
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowDetail(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        toast.success('Event deleted');
        loadEvents(); // Reload events after delete
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      toast.error('Error deleting event');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setSelectedTemplate(null);
    setModalType('template');
  };

  const handleModalSuccess = () => {
    // Always reload events after modal actions
    loadEvents();
    setShowModal(false);
    setShowDetail(false);
    setSelectedEvent(null);
    setSelectedTemplate(null);
    setModalType('template');
  };

  const getFilteredEvents = () => {
    let filtered = [...events];

    // Apply status filter robustly
    if (filter !== 'all') {
      filtered = filtered.filter(event => {
        // Fallback: treat missing/unknown status as 'planning'
        const status = event.status || 'planning';
        return status === filter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'startDate':
          return new Date(a.startDate) - new Date(b.startDate);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Planner</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan and organize your life events</p>
        </div>
        <div className="flex space-x-2">
          {/* Remove Custom Event button */}
          {/* <button
            onClick={() => handleCreateEvent('custom')}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Custom Event
          </button> */}
          <button
            onClick={() => handleCreateEvent('template')}
            className="btn btn-primary"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Create Event
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card">
          <div className="card-body p-3 sm:p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Events</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalEvents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-3 sm:p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-success-600" />
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Completed</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.completedEvents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-3 sm:p-6">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-warning-600" />
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.inProgressEvents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-3 sm:p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-danger-600" />
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.overdueEvents}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          >
            <option value="all">All Events</option>
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          >
            <option value="createdAt">Date Created</option>
            <option value="startDate">Start Date</option>
            <option value="priority">Priority</option>
            <option value="progress">Progress</option>
          </select>
        </div>

        <div className="text-xs sm:text-sm text-gray-500">
          {filteredEvents.length} of {events.length} events
        </div>
      </div>

      {/* Event Templates Grid */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Quick Start Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`card cursor-pointer transition-all duration-200 hover:shadow-lg ${
                template.isLocked ? 'opacity-60' : 'hover:scale-105'
              }`}
              onClick={() => !template.isLocked && handleCreateEvent('template', template)}
            >
              <div className="card-body text-center p-3 sm:p-6">
                <div className="text-2xl sm:text-3xl mb-2">{template.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">
                  {template.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                  {template.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>${template.budget.toLocaleString()}</span>
                  <span>{template.timeline}</span>
                </div>
                {template.isLocked && (
                  <div className="absolute top-2 right-2">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Events</h2>
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Get started by creating your first event
            </p>
            <button
              onClick={() => handleCreateEvent('template')}
              className="btn btn-primary"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <div key={event._id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{event.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event.eventType}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewEvent(event)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Progress</span>
                      <span className="text-sm font-medium">{event.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${event.progress}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(event.status)}`}>
                        {event.status.replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(event.priority)}`}>
                        {event.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>${event.budget.toLocaleString()}</span>
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <EventModal
          isOpen={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          type={modalType}
          template={selectedTemplate}
          event={selectedEvent}
        />
      )}

      {showDetail && selectedEvent && (
        <EventDetail
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          event={selectedEvent}
          onUpdate={loadEvents}
        />
      )}
    </div>
  );
};

export default Events; 