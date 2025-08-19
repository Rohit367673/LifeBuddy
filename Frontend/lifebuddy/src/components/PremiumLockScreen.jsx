import React from 'react';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function PremiumLockScreen({ featureName }) {
  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full text-center bg-white shadow-xl rounded-2xl p-8 border border-slate-100">
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-4">
          <LockClosedIcon className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{featureName} is a Premium feature</h2>
        <p className="text-slate-600 text-sm mb-6">Upgrade to unlock {featureName} with your AI assistant.</p>
        <div className="flex gap-3 justify-center">
          <a href="/premium" className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700">Upgrade</a>
          <a href="/premium#trial" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Start Trial</a>
        </div>
      </div>
    </div>
  );
}
