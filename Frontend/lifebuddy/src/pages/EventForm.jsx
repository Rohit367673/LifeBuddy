import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  CalendarIcon, 
  MapPinIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const eventType = searchParams.get('type');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    type: eventType || 'custom',
    priority: 'medium',
    status: 'planning'
  });

  const [isLoading, setIsLoading] = useState(false);

  const eventTypes = [
    { value: 'moving', label: 'Moving', icon: MapPinIcon },
    { value: 'job-change', label: 'Job Change', icon: DocumentTextIcon },
    { value: 'college', label: 'College', icon: CheckCircleIcon },
    { value: 'wedding', label: 'Wedding', icon: CalendarIcon },
    { value: 'trip', label: 'Trip', icon: MapPinIcon },
    { value: 'car-purchase', label: 'Car Purchase', icon: DocumentTextIcon },
    { value: 'custom', label: 'Custom Event', icon: CalendarIcon },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' },
  ];

  const statuses = [
    { value: 'planning', label: 'Planning' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    if (id) {
      // Load existing event data
      // This would typically fetch from your API
      console.log('Loading event with ID:', id);
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // This would typically send data to your API
      console.log('Submitting event data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to events list
      navigate('/events');
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? 'Edit Event' : 'Create New Event'}
              </h1>
              <button
                onClick={handleCancel}
                className="btn-ghost p-2"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="card-body space-y-6">
            {/* Event Type */}
            <div>
              <label className="label">Event Type</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {eventTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`
                      relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none
                      ${formData.type === type.value
                        ? 'border-primary-500 ring-2 ring-primary-500'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <type.icon className="h-5 w-5 text-gray-400" />
                          <p className="font-medium text-gray-900">{type.label}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="label">Event Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="input"
                placeholder="Describe your event..."
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="label">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="label">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter location"
              />
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="priority" className="label">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="input"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status" className="label">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Saving...' : (id ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventForm; 