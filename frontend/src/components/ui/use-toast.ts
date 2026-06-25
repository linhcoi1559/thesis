import { useState, useEffect } from 'react';

export interface ToastOptions {
  title: string;
  description: string;
  duration?: number;
  variant?: string;
}

// Simple pub/sub toast bus for demo purposes
type Listener = (options: ToastOptions) => void;
const listeners = new Set<Listener>();

export const toast = (options: ToastOptions) => {
  listeners.forEach((listener) => listener(options));
  console.log(`[TOAST] Title: ${options.title} - Description: ${options.description}`);
};

export const useToast = () => {
  const [activeToast, setActiveToast] = useState<ToastOptions | null>(null);

  useEffect(() => {
    const handleToast = (options: ToastOptions) => {
      setActiveToast(options);
      setTimeout(() => {
        setActiveToast(null);
      }, options.duration || 5000);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  return {
    toast,
    activeToast,
  };
};
