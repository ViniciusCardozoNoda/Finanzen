import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 500); // Wait for fade-out animation
  };

  const typeStyles = {
    info: { bg: 'bg-blue-500', icon: 'fa-info-circle' },
    success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
    warning: { bg: 'bg-yellow-500', icon: 'fa-exclamation-triangle' },
    error: { bg: 'bg-red-500', icon: 'fa-times-circle' },
  };

  const { bg, icon } = typeStyles[type];
  const animationClass = isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right';

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${bg} ${animationClass}`}>
      <i className={`fas ${icon} text-xl mr-3`}></i>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={handleClose} className="ml-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full w-6 h-6 flex items-center justify-center transition-colors">
        <i className="fas fa-times text-xs"></i>
      </button>
    </div>
  );
};

export default Toast;
