
import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="relative mb-4">
        {/* Pulsing Background Circle */}
        <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-75"></div>
        {/* Logo Container */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-full shadow-lg">
          <i className="fas fa-chart-line text-3xl text-white"></i>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-slate-800 mb-2">FinanZen</h2>
      
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
      </div>
      
      {message && (
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default LoadingScreen;
