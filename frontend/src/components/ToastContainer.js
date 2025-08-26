import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

const Toast = ({ id, type, title, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            clearInterval(progressInterval);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(progressInterval);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 200);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <XCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative p-4 rounded-lg border shadow-lg backdrop-blur-sm ${getBackgroundColor()} max-w-md w-full`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <motion.div
            className={`h-full ${getProgressColor()}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const { id, type, title, message, duration } = event.detail;
      
      const newToast = {
        id: id || Date.now(),
        type: type || 'info',
        title,
        message,
        duration: duration || 5000
      };
      
      setToasts(prev => [...prev, newToast]);
    };

    window.addEventListener('show-toast', handleToast);
    
    return () => {
      window.removeEventListener('show-toast', handleToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Utility functions to show toasts
export const showToast = (type, title, message, duration) => {
  const event = new CustomEvent('show-toast', {
    detail: {
      id: Date.now(),
      type,
      title,
      message,
      duration
    }
  });
  window.dispatchEvent(event);
};

export const showSuccessToast = (title, message, duration = 5000) => {
  showToast('success', title, message, duration);
};

export const showErrorToast = (title, message, duration = 5000) => {
  showToast('error', title, message, duration);
};

export const showWarningToast = (title, message, duration = 5000) => {
  showToast('warning', title, message, duration);
};

export const showInfoToast = (title, message, duration = 5000) => {
  showToast('info', title, message, duration);
};

export default ToastContainer;