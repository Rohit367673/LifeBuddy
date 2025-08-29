import React from 'react';

// Full-screen animated loader with rotating logo orb, gradient aurora and shimmer text
const LoadingScreen = ({ text = 'Loading your experience…' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white overflow-hidden">
      {/* Soft aurora blobs */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl animate-[pulse_2.8s_ease-in-out_infinite]" />

      {/* Rotating 3D ring */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-50 blur-md" />
        <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border-4 border-transparent animate-spin-slow"
             style={{
               borderImage: 'conic-gradient(from 0deg, transparent 40%, rgba(167,139,250,0.9), rgba(34,211,238,0.9), rgba(244,114,182,0.9), transparent 80%) 1'
             }}
        />

        {/* Inner orb */}
        <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center shadow-2xl shadow-indigo-900/40">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-cyan-300 animate-float shadow-lg" />
        </div>
      </div>

      {/* Text */}
      <div className="absolute mt-28 md:mt-36 text-center px-6">
        <div className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-fuchsia-200 animate-shimmer bg-[length:200%_100%]">
          {text}
        </div>
        <div className="mt-2 text-xs md:text-sm text-indigo-200/70">Optimizing and getting things ready…</div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .animate-spin-slow { animation: spin-slow 3.4s linear infinite; }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        .animate-float { animation: float 2.8s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .animate-shimmer { animation: shimmer 2.2s linear infinite; }
      `}</style>
    </div>
  );
};

export default LoadingScreen;


