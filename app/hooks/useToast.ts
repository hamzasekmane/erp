// frontend/app/hooks/useToast.ts
"use client";

import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);

    // For demo purposes, just console.log
    console.log(`🔔 [${type.toUpperCase()}]: ${message}`);
    
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // If you don't want to manage state, just return a simple object
  return {
    toasts, // This will be empty if you don't render ToastContainer
    showToast,
    dismissToast,
    // Simple alert fallback if you don't want to implement the UI
    showToastSimple: (message: string, type: ToastType = "info") => {
      alert(`[${type.toUpperCase()}] ${message}`);
    }
  };
}