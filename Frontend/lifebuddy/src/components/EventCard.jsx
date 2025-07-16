import { 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const EventCard = ({ event, onView, onEdit, onDelete }) => {
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

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getChecklistStats = () => {
    const total = event.checklist?.length || 0;
    const completed = event.checklist?.filter(item => item.completed).length || 0;
    return { total, completed };
  };

  const { total, completed } = getChecklistStats();

  return (
    <div className="card hover:shadow-lg transition-all duration-200">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {event.isTemplateBased && (
              <span className="text-2xl">{event.icon}</span>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {event.eventType}
              </p>
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onView(event)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(event)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Edit Event"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(event._id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete Event"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Badge for template/custom */}
        {(event.isTemplateBased || event.isCustom) && (
          <div className="mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${event.isTemplateBased ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
              {event.isTemplateBased ? 'TEMPLATE' : 'CUSTOM'}
            </span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{event.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(event.progress)}`}
              style={{ width: `${event.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {completed}/{total} tasks
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">
              ${event.budget.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(event.status)}`}>
            {event.status.replace('-', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(event.priority)}`}>
            {event.priority}
          </span>
        </div>

        {/* Dates and Location */}
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(event.startDate)}</span>
            {event.endDate && (
              <>
                <span>-</span>
                <span>{formatDate(event.endDate)}</span>
              </>
            )}
          </div>
          {event.location && (
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Template/Custom Badge */}
        {(event.isTemplateBased || event.isCustom) && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              {event.isTemplateBased ? 'Template-based' : 'Custom'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard; 