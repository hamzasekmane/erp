"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info"; // Add variant support
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  isLoading,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger" // Default to danger (red)
}: ConfirmModalProps) {
  // Variant configurations
  const variants = {
    danger: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      button: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
      buttonDisabled: "disabled:bg-rose-800/50",
      icon: AlertTriangle
    },
    warning: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      button: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
      buttonDisabled: "disabled:bg-amber-800/50",
      icon: AlertTriangle
    },
    info: {
      bg: "bg-[var(--accent)]/10",
      text: "text-[var(--accent)]",
      button: "bg-[var(--accent)] hover:bg-[var(--accent-dark)] shadow-[var(--accent)]/20",
      buttonDisabled: "disabled:bg-[var(--accent)]/50",
      icon: AlertTriangle
    }
  };

  const currentVariant = variants[variant];
  const Icon = currentVariant.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[var(--background)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
                {/* Header with alert icon */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 ${currentVariant.bg} rounded-2xl ${currentVariant.text}`}>
                    <Icon size={24} />
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-[var(--card-bg)] rounded-xl transition-colors group"
                  >
                    <X size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors" />
                  </button>
                </div>

                {/* Content */}
                <h3 className="text-xl font-black uppercase tracking-tighter italic text-[var(--foreground)] mb-2">
                  {title} <span className={currentVariant.text}>.</span>
                </h3>
                <p className="text-[var(--foreground-muted)] text-sm font-medium leading-relaxed">
                  {message}
                </p>

                {/* Footer Actions */}
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] transition-all border border-[var(--border)] disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest ${currentVariant.button} text-white shadow-lg transition-all flex items-center justify-center gap-2 ${currentVariant.buttonDisabled} disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Chargement...</span>
                      </>
                    ) : (
                      confirmText
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}