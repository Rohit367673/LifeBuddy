import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  PlusIcon, 
  CalendarIcon, 
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  TruckIcon,
  AcademicCapIcon,
  HeartIcon,
  PaperAirplaneIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Events = () => {
  const { user, getFirebaseToken } = useAuth();
  const { isDarkMode } = useTheme();
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'other',
    description: '',
    startDate: '',
    endDate: '',
    budget: {
      planned: 0,
      currency: 'USD'
    },
    priority: 'medium',
    location: {
      address: '',
      city: '',
      state: '',
      country: ''
    }
  });

  // Predefined events with checklists and resources
  const predefinedEvents = [
    {
      type: 'moving',
      title: 'Moving to a New Home',
      icon: TruckIcon,
      description: 'Plan and organize your move to a new location',
      color: 'bg-blue-500',
      checklist: [
        'Research moving companies and get quotes',
        'Declutter and organize belongings',
        'Pack non-essential items first',
        'Update address with important services',
        'Transfer utilities and services',
        'Pack essential items last',
        'Clean old home before leaving',
        'Set up new home essentials'
      ],
      budgetItems: [
        { item: 'Moving company', estimated: 1000, category: 'services' },
        { item: 'Packing supplies', estimated: 200, category: 'supplies' },
        { item: 'Storage unit (if needed)', estimated: 150, category: 'services' },
        { item: 'New furniture/appliances', estimated: 2000, category: 'furniture' },
        { item: 'Utility deposits', estimated: 300, category: 'utilities' }
      ],
      resources: [
        { title: 'Moving Checklist Template', url: '#', type: 'template' },
        { title: 'Moving Cost Calculator', url: '#', type: 'tool' },
        { title: 'Address Change Checklist', url: '#', type: 'checklist' }
      ],
      estimatedBudget: 3650
    },
    {
      type: 'job-change',
      title: 'Job Change & Career Transition',
      icon: CogIcon,
      description: 'Navigate a career change or new job opportunity',
      color: 'bg-green-500',
      checklist: [
        'Update resume and cover letter',
        'Research target companies and roles',
        'Network and attend industry events',
        'Prepare for interviews',
        'Negotiate salary and benefits',
        'Give proper notice to current employer',
        'Transfer benefits and retirement accounts',
        'Plan for potential relocation'
      ],
      budgetItems: [
        { item: 'Professional development courses', estimated: 500, category: 'education' },
        { item: 'Interview travel expenses', estimated: 300, category: 'travel' },
        { item: 'Professional wardrobe updates', estimated: 400, category: 'clothing' },
        { item: 'Relocation costs (if applicable)', estimated: 3000, category: 'relocation' },
        { item: 'Gap period expenses', estimated: 2000, category: 'living' }
      ],
      resources: [
        { title: 'Resume Builder Tool', url: '#', type: 'tool' },
        { title: 'Interview Preparation Guide', url: '#', type: 'guide' },
        { title: 'Salary Negotiation Tips', url: '#', type: 'article' }
      ],
      estimatedBudget: 3200
    },
    {
      type: 'college',
      title: 'College/University Preparation',
      icon: AcademicCapIcon,
      description: 'Prepare for higher education and academic success',
      color: 'bg-purple-500',
      checklist: [
        'Research colleges and programs',
        'Prepare for standardized tests',
        'Write college essays and applications',
        'Apply for financial aid and scholarships',
        'Visit campuses and attend orientations',
        'Register for classes and housing',
        'Purchase textbooks and supplies',
        'Set up student accounts and services'
      ],
      budgetItems: [
        { item: 'Application fees', estimated: 300, category: 'applications' },
        { item: 'Test preparation materials', estimated: 200, category: 'education' },
        { item: 'Campus visits and travel', estimated: 500, category: 'travel' },
        { item: 'Housing deposits', estimated: 1000, category: 'housing' },
        { item: 'Textbooks and supplies', estimated: 800, category: 'supplies' }
      ],
      resources: [
        { title: 'College Application Timeline', url: '#', type: 'timeline' },
        { title: 'Financial Aid Calculator', url: '#', type: 'tool' },
        { title: 'Campus Visit Checklist', url: '#', type: 'checklist' }
      ],
      estimatedBudget: 2800
    },
    {
      type: 'wedding',
      title: 'Wedding Planning',
      icon: HeartIcon,
      description: 'Plan your perfect wedding celebration',
      color: 'bg-pink-500',
      checklist: [
        'Set budget and guest list',
        'Choose wedding date and venue',
        'Book vendors (caterer, photographer, etc.)',
        'Select wedding party and attire',
        'Plan ceremony and reception details',
        'Send invitations and manage RSVPs',
        'Plan honeymoon and travel',
        'Handle legal requirements and paperwork'
      ],
      budgetItems: [
        { item: 'Venue rental', estimated: 5000, category: 'venue' },
        { item: 'Catering and food', estimated: 4000, category: 'food' },
        { item: 'Photography and videography', estimated: 3000, category: 'media' },
        { item: 'Wedding attire', estimated: 2000, category: 'attire' },
        { item: 'Decorations and flowers', estimated: 1500, category: 'decor' }
      ],
      resources: [
        { title: 'Wedding Budget Tracker', url: '#', type: 'tool' },
        { title: 'Vendor Comparison Sheet', url: '#', type: 'template' },
        { title: 'Wedding Timeline Planner', url: '#', type: 'planner' }
      ],
      estimatedBudget: 15500
    },
    {
      type: 'trip',
      title: 'Travel & Vacation Planning',
      icon: PaperAirplaneIcon,
      description: 'Plan an amazing trip or vacation experience',
      color: 'bg-yellow-500',
      checklist: [
        'Choose destination and travel dates',
        'Research flights and accommodation',
        'Book transportation and lodging',
        'Plan activities and attractions',
        'Check travel requirements and documents',
        'Purchase travel insurance',
        'Pack essentials and prepare itinerary',
        'Set up travel notifications and alerts'
      ],
      budgetItems: [
        { item: 'Flights and transportation', estimated: 800, category: 'transport' },
        { item: 'Accommodation', estimated: 1200, category: 'lodging' },
        { item: 'Activities and attractions', estimated: 500, category: 'activities' },
        { item: 'Food and dining', estimated: 400, category: 'food' },
        { item: 'Travel insurance', estimated: 100, category: 'insurance' }
      ],
      resources: [
        { title: 'Travel Budget Calculator', url: '#', type: 'tool' },
        { title: 'Packing List Generator', url: '#', type: 'tool' },
        { title: 'Travel Itinerary Template', url: '#', type: 'template' }
      ],
      estimatedBudget: 3000
    },
    {
      type: 'car-purchase',
      title: 'Car Purchase',
      icon: TruckIcon,
      description: 'Navigate the car buying process',
      color: 'bg-gray-500',
      checklist: [
        'Determine budget and financing options',
        'Research car models and features',
        'Check credit score and get pre-approved',
        'Test drive different vehicles',
        'Compare prices and negotiate',
        'Review and sign purchase agreement',
        'Arrange insurance and registration',
        'Plan for maintenance and ongoing costs'
      ],
      budgetItems: [
        { item: 'Down payment', estimated: 3000, category: 'down-payment' },
        { item: 'Monthly car payment', estimated: 400, category: 'financing' },
        { item: 'Insurance (annual)', estimated: 1200, category: 'insurance' },
        { item: 'Registration and taxes', estimated: 500, category: 'fees' },
        { item: 'Maintenance fund', estimated: 1000, category: 'maintenance' }
      ],
      resources: [
        { title: 'Car Loan Calculator', url: '#', type: 'tool' },
        { title: 'Car Comparison Worksheet', url: '#', type: 'template' },
        { title: 'Negotiation Tips Guide', url: '#', type: 'guide' }
      ],
      estimatedBudget: 7000
    }
  ];

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify(eventForm)
      });

      if (response.ok) {
        setEventForm({
          title: '',
          type: 'other',
          description: '',
          startDate: '',
          endDate: '',
          budget: {
            planned: 0,
            currency: 'USD'
          },
          priority: 'medium',
          location: {
            address: '',
            city: '',
            state: '',
            country: ''
          }
        });
        setShowCreateModal(false);
        setSelectedEvent(null);
        loadEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const startPredefinedEvent = (predefinedEvent) => {
    setEventForm({
      title: predefinedEvent.title,
      type: predefinedEvent.type,
      description: predefinedEvent.description,
      startDate: '',
      endDate: '',
      budget: {
        planned: predefinedEvent.estimatedBudget,
        currency: 'USD'
      },
      priority: 'medium',
      location: {
        address: '',
        city: '',
        state: '',
        country: ''
      }
    });
    setSelectedEvent(predefinedEvent);
    setShowCreateModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Planner</h1>
          <p className="text-gray-600">Plan and manage your life events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Custom Event</span>
        </button>
      </div>

      {/* Predefined Events */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Predefined Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predefinedEvents.map((event) => (
            <div
              key={event.type}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-lg ${event.color} text-white`}>
                  <event.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Checklist Items:</h4>
                  <ul className="space-y-1">
                    {event.checklist.slice(0, 3).map((item, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                    {event.checklist.length > 3 && (
                      <li className="text-sm text-gray-500">
                        +{event.checklist.length - 3} more items
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Estimated Budget:</h4>
                  <p className="text-lg font-semibold text-primary-600">
                    ${event.estimatedBudget.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => startPredefinedEvent(event)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Start Planning
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Events */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Your Events</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600">Create your first event to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                  <span className={`badge ${getStatusColor(event.status)}`}>
                    {event.status.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                    {event.location.city && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{event.location.city}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`badge ${getPriorityColor(event.priority)}`}>
                      {event.priority}
                    </span>
                    {event.budget.planned > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        <span>${event.budget.planned.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {event.progress > 0 && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{event.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${event.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                    View Details
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedEvent ? `Start Planning: ${selectedEvent.title}` : 'Create Custom Event'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedEvent(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {selectedEvent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Predefined Checklist & Budget</h4>
                <p className="text-sm text-blue-700">
                  This event comes with a comprehensive checklist and estimated budget of ${selectedEvent.estimatedBudget.toLocaleString()}.
                </p>
              </div>
            )}
            
            <form onSubmit={createEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="other">Custom Event</option>
                    <option value="moving">Moving</option>
                    <option value="job-change">Job Change</option>
                    <option value="college">College/Education</option>
                    <option value="wedding">Wedding</option>
                    <option value="trip">Travel</option>
                    <option value="car-purchase">Car Purchase</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    type="number"
                    value={eventForm.budget.planned}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      budget: { ...eventForm.budget, planned: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={eventForm.location.city}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      location: { ...eventForm.location, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                  <input
                    type="text"
                    value={eventForm.location.state}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      location: { ...eventForm.location, state: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {selectedEvent ? 'Start Planning' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events; 