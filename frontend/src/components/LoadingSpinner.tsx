import React from 'react'

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, fullPage = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
        <div className="absolute h-12 w-12 rounded-full border border-primary/20 animate-ping"></div>
      </div>
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
