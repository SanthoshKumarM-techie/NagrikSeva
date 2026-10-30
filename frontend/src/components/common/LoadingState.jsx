import React from 'react';

export const LoadingState = ({ message = 'Loading details...', rows = 3, className = '' }) => {
  return (
    <div className={`p-6 w-full space-y-3 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{message}</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
};

export default LoadingState;

