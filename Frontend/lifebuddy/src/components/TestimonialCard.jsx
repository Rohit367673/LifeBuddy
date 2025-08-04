import { StarIcon } from '@heroicons/react/24/solid';

const TestimonialCard = ({ quote, author, badge, streak, avatar }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Quote */}
      <div className="mb-6">
        <div className="text-2xl text-gray-300 dark:text-gray-600 mb-2">"</div>
        <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
          {quote}
        </p>
      </div>

      {/* Author Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={avatar}
            alt={author}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {author}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {badge}
              </span>
              <div className="flex items-center text-yellow-500">
                <StarIcon className="h-4 w-4" />
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                  {streak}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard; 