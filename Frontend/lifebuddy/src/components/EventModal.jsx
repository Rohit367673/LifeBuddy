import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EventModal = ({ isOpen, onClose, onSuccess, type, template, event }) => {
  const { getFirebaseToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    eventType: 'Custom',
    description: '',
    startDate: '',
    endDate: '',
    budget: 0,
    priority: 'medium',
    location: '',
    checklist: [],
    color: 'blue',
    icon: '📅',
    timeline: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Only allow template-based event creation
      if (type === 'template' && template) {
        setFormData({
          title: template.title || '',
          eventType: template.eventType || 'Custom',
          description: template.description || '',
          startDate: '',
          endDate: '',
          budget: template.budget || 0,
          priority: template.priority || 'medium',
          location: '',
          checklist: template.checklist ? template.checklist.map(item => ({
            item,
            completed: false
          })) : [],
          color: template.color || 'blue',
          icon: template.icon || '📅',
          timeline: template.timeline || ''
        });
      } else {
        // If not a template, do not allow event creation
        setFormData({
          title: '',
          eventType: '',
          description: '',
          startDate: '',
          endDate: '',
          budget: 0,
          priority: 'medium',
          location: '',
          checklist: [],
          color: 'blue',
          icon: '📅',
          timeline: ''
        });
      }
    }
  }, [isOpen, type, template, event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getFirebaseToken();
      const url = type === 'edit' 
        ? `${import.meta.env.VITE_API_URL}/api/events/${event._id}`
        : `${import.meta.env.VITE_API_URL}/api/events`;

      const method = type === 'edit' ? 'PUT' : 'POST';

      const requestData = {
        ...formData,
        templateId: template?.id,
        isTemplateBased: true
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        if (errorData.limitReached) {
          toast.error('Free tier limit reached. Upgrade to create more events.');
        } else {
          toast.error(errorData.message || 'Failed to save event');
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, { item: '', completed: false }]
    }));
  };

  const updateChecklistItem = (index, value) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => 
        i === index ? { ...item, item: value } : item
      )
    }));
  };

  const removeChecklistItem = (index) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const getModalTitle = () => {
    switch (type) {
      case 'edit': return 'Edit Event';
      case 'template': return template ? `Create Event: ${template.title}` : 'Use Template';
      case 'custom': return 'Create Custom Event';
      default: return 'Create Event';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Banner for template only */}
        {type === 'template' && template && (
          <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 px-6 py-3 rounded-t-lg flex items-center space-x-2">
            <span className="text-2xl">{template.icon}</span>
            <span className="font-semibold">Based on Template: {template.title}</span>
            <span className="ml-2 px-2 py-1 rounded-full bg-blue-200 text-xs font-bold">TEMPLATE</span>
          </div>
        )}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getModalTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title with badge for template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white bg-blue-50 dark:bg-blue-900/10`}
                required
                placeholder="Event Title *"
              />
              <span className="px-2 py-1 rounded-full bg-blue-200 text-xs font-bold">TEMPLATE</span>
            </div>
            <div>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Custom">Custom</option>
                <option value="Moving">Moving</option>
                <option value="Wedding">Wedding</option>
                <option value="Career">Career</option>
                <option value="Travel">Travel</option>
                <option value="Home">Home</option>
                <option value="Education">Education</option>
                <option value="Business">Business</option>
                <option value="Health">Health</option>
                <option value="Social">Social</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              rows="3"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Budget and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter location"
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Checklist Items
              </label>
              <button
                type="button"
                onClick={addChecklistItem}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.checklist.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={item.item}
                    onChange={(e) => updateChecklistItem(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter checklist item"
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(index)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (type === 'edit' ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal; 