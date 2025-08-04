import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FeatureComparison = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">
              Feature
            </th>
            <th className="text-center py-4 px-6 font-semibold text-gray-900 dark:text-white">
              Free Plan
            </th>
            <th className="text-center py-4 px-6 font-semibold text-blue-600 dark:text-blue-400">
              Premium Plan
            </th>
          </tr>
        </thead>
        <tbody>
          {data.features.map((feature, index) => (
            <tr 
              key={index} 
              className={`border-b border-gray-100 dark:border-gray-800 ${
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''
              }`}
            >
              <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                {feature.name}
              </td>
              <td className="py-4 px-6 text-center">
                {feature.free === '❌' ? (
                  <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                ) : feature.free === '✅' ? (
                  <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                  <span className="text-gray-600 dark:text-gray-300 text-sm">
                    {feature.free}
                  </span>
                )}
              </td>
              <td className="py-4 px-6 text-center">
                {feature.premium === '❌' ? (
                  <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                ) : feature.premium === '✅' ? (
                  <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    {feature.premium}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeatureComparison; 