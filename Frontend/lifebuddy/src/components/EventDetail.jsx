import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EventDetail = ({ isOpen, onClose, event, onUpdate }) => {
  const { getFirebaseToken } = useAuth();
  const [currentEvent, setCurrentEvent] = useState(event);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newBudgetItem, setNewBudgetItem] = useState({ name: '', amount: '', category: 'other' });
  const [newNote, setNewNote] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    setCurrentEvent(event);
  }, [event]);

  const handleCompleteChecklistItem = async (itemIndex) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events/${event._id}/checklist/${itemIndex}/complete`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await getFirebaseToken()}`
          }
        }
      );

      if (response.ok) {
        const updatedEvent = await response.json();
        setCurrentEvent(updatedEvent);
        onUpdate();
        toast.success('Checklist item completed!');
      }
    } catch (error) {
      console.error('Error completing checklist item:', error);
      toast.error('Failed to complete item');
    }
  };

  const handleAddBudgetItem = async (e) => {
    e.preventDefault();
    if (!newBudgetItem.name || !newBudgetItem.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events/${event._id}/budget`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getFirebaseToken()}`
          },
          body: JSON.stringify(newBudgetItem)
        }
      );

      if (response.ok) {
        const updatedEvent = await response.json();
        setCurrentEvent(updatedEvent);
        setNewBudgetItem({ name: '', amount: '', category: 'other' });
        onUpdate();
        toast.success('Budget item added!');
      }
    } catch (error) {
      console.error('Error adding budget item:', error);
      toast.error('Failed to add budget item');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events/${event._id}/notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getFirebaseToken()}`
          },
          body: JSON.stringify({ content: newNote })
        }
      );

      if (response.ok) {
        const updatedEvent = await response.json();
        setCurrentEvent(updatedEvent);
        setNewNote('');
        onUpdate();
        toast.success('Note added!');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'venue': return 'bg-purple-100 text-purple-800';
      case 'catering': return 'bg-orange-100 text-orange-800';
      case 'entertainment': return 'bg-pink-100 text-pink-800';
      case 'decoration': return 'bg-indigo-100 text-indigo-800';
      case 'transportation': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !currentEvent) return null;

  const budgetRemaining = currentEvent.budget - currentEvent.spentAmount;
  const budgetPercentage = currentEvent.budget > 0 ? (currentEvent.spentAmount / currentEvent.budget) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{currentEvent.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentEvent.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentEvent.eventType} • {currentEvent.status.replace('-', ' ')}
              </p>
            </div>
            {/* Badge for template/custom */}
            {(currentEvent.isTemplateBased || currentEvent.isCustom) && (
              <span className={`ml-4 px-2 py-1 rounded-full text-xs font-bold ${currentEvent.isTemplateBased ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                {currentEvent.isTemplateBased ? 'TEMPLATE-BASED' : 'CUSTOM'}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditForm(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: EyeIcon },
              { id: 'checklist', label: 'Checklist', icon: CheckCircleIcon },
              { id: 'budget', label: 'Budget', icon: CurrencyDollarIcon },
              { id: 'notes', label: 'Notes', icon: DocumentTextIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Event Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Start:</span>
                        <span>{new Date(currentEvent.startDate).toLocaleDateString()}</span>
                      </div>
                      {currentEvent.endDate && (
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">End:</span>
                          <span>{new Date(currentEvent.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {currentEvent.location && (
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span>{currentEvent.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status & Priority</h4>
                    <div className="flex space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(currentEvent.status)}`}>
                        {currentEvent.status.replace('-', ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(currentEvent.priority)}`}>
                        {currentEvent.priority}
                      </span>
                    </div>
                  </div>

                  {currentEvent.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentEvent.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Checklist Completion</span>
                        <span>{currentEvent.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${currentEvent.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Budget Overview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Budget:</span>
                        <span>${currentEvent.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Spent:</span>
                        <span>${currentEvent.spentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className={budgetRemaining < 0 ? 'text-red-600' : ''}>
                          ${budgetRemaining.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            budgetPercentage > 100 ? 'bg-red-500' : 'bg-primary-600'
                          }`}
                          style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Checklist ({currentEvent.checklist.filter(item => item.completed).length}/{currentEvent.checklist.length})
                </h4>
              </div>

              <div className="space-y-2">
                {currentEvent.checklist.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      item.completed
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => handleCompleteChecklistItem(index)}
                      className={`flex-shrink-0 p-1 rounded-full ${
                        item.completed
                          ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                      }`}
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                    <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.item}
                    </span>
                    {item.completed && item.completedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Tab */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                  <div className="card-body text-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Total Budget</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      ${currentEvent.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-warning-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Spent</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      ${currentEvent.spentAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <CurrencyDollarIcon className={`h-8 w-8 mx-auto mb-2 ${
                      budgetRemaining < 0 ? 'text-red-600' : 'text-success-600'
                    }`} />
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className={`text-2xl font-semibold ${
                      budgetRemaining < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      ${budgetRemaining.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Add Budget Item</h4>
                <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newBudgetItem.name}
                    onChange={(e) => setNewBudgetItem(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newBudgetItem.amount}
                    onChange={(e) => setNewBudgetItem(prev => ({ ...prev, amount: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  <select
                    value={newBudgetItem.category}
                    onChange={(e) => setNewBudgetItem(prev => ({ ...prev, category: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="other">Other</option>
                    <option value="venue">Venue</option>
                    <option value="catering">Catering</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="decoration">Decoration</option>
                    <option value="transportation">Transportation</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Add Item
                  </button>
                </form>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Budget Items</h4>
                <div className="space-y-2">
                  {currentEvent.budgetItems?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">${item.amount.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Add Note</h4>
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    placeholder="Add a note about this event..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    rows="3"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Add Note
                  </button>
                </form>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Notes</h4>
                <div className="space-y-3">
                  {currentEvent.notes?.map((note, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-900 dark:text-white mb-2">{note.content}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail; 