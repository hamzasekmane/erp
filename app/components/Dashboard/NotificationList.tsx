// frontend/components/dashboard/NotificationList.tsx
"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  XCircle,
  Loader2,
  Bell
} from "lucide-react";
import { deleteNotificationAction, markAsReadAction } from "@/app/actions/actionsNotifications";
import { useToast } from "@/app/hooks/useToast";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "error" | "success" | "info" | "warning";
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationListProps {
  initialData: Notification[];
  token: string;
  onUpdate?: (unreadCount: number) => void;
}

export default function NotificationList({ 
  initialData, 
  token, 
  onUpdate 
}: NotificationListProps) {
  const [items, setItems] = useState(initialData);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const unreadCount = items.filter(item => !item.isRead).length;

  // Notify parent of unread count changes
  React.useEffect(() => {
    onUpdate?.(unreadCount);
  }, [unreadCount, onUpdate]);

  const handleDelete = async (id: string) => {
    // Prevent double-click
    if (pendingIds.has(id)) return;
    
    setPendingIds(prev => new Set(prev).add(id));
    
    // Store item for potential rollback
    const deletedItem = items.find(item => item._id === id);
    
    // Optimistic Update
    startTransition(() => {
      setItems((prev) => prev.filter((item) => item._id !== id));
    });

    try {
      const result = await deleteNotificationAction(id, token);
      
      if (!result.success) {
        // Rollback on error
        if (deletedItem) {
          setItems((prev) => [...prev, deletedItem].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        }
        showToast(result.error || "Failed to delete notification", "error");
      } else {
        showToast(result.message || "Notification deleted", "success");
      }
    } catch (error) {
      // Rollback on exception
      if (deletedItem) {
        setItems((prev) => [...prev, deletedItem].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      showToast("Failed to delete notification", "error");
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRead = async (id: string) => {
    // Prevent double-click
    if (pendingIds.has(id)) return;
    
    setPendingIds(prev => new Set(prev).add(id));
    
    // Store previous state for potential rollback
    const previousState = items.find(item => item._id === id)?.isRead;
    
    // Optimistic Update
    startTransition(() => {
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
    });

    try {
      const result = await markAsReadAction(id, token);
      
      if (!result.success) {
        // Rollback on error
        setItems((prev) =>
          prev.map((item) => 
            item._id === id ? { ...item, isRead: previousState || false } : item
          )
        );
        showToast(result.error || "Failed to mark as read", "error");
      } else {
        showToast("Notification marked as read", "success");
      }
    } catch (error) {
      // Rollback on exception
      setItems((prev) =>
        prev.map((item) => 
          item._id === id ? { ...item, isRead: previousState || false } : item
        )
      );
      showToast("Failed to mark as read", "error");
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    // Implementation for bulk action
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "error": 
        return <XCircle size={16} className="text-rose-400" />;
      case "success": 
        return <CheckCircle size={16} className="text-emerald-400" />;
      case "warning": 
        return <AlertTriangle size={16} className="text-amber-400" />;
      case "info": 
        return <Info size={16} className="text-[var(--accent)]" />;
      default: 
        return <Bell size={16} className="text-[var(--foreground-muted)]" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-20 text-center space-y-4"
      >
        <div className="w-16 h-16 bg-[var(--card-bg)] rounded-full flex items-center justify-center mx-auto border border-[var(--border)]">
          <Bell size={32} className="text-[var(--foreground-muted)]" />
        </div>
        <p className="text-sm font-black text-[var(--foreground-muted)] uppercase italic tracking-widest">
          No signals intercepted
        </p>
        <p className="text-xs text-[var(--foreground-muted)]/60">
          Notifications will appear here when triggered
        </p>
      </motion.div>
    );
  }

  return (
    <div className="divide-y divide-[var(--border)] bg-[var(--background)] rounded-[2rem] border border-[var(--border)] overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((notification) => (
          <motion.div
            key={notification._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            layout
            className={`group p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-[var(--card-bg)] ${
              !notification.isRead 
                ? "bg-[var(--accent)]/[0.02] border-l-2 border-l-[var(--accent)]" 
                : "bg-transparent opacity-75 hover:opacity-100"
            }`}
          >
            <div className="flex gap-4 flex-1">
              <div className="mt-1 flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className={`text-sm font-black uppercase tracking-tight ${
                    !notification.isRead 
                      ? "text-[var(--foreground)]" 
                      : "text-[var(--foreground-muted)]"
                  }`}>
                    {notification.title}
                  </h3>
                  {!notification.isRead && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
                  {notification.message}
                </p>
                {notification.metadata && (
                  <div className="pt-2">
                    <pre className="text-[10px] text-[var(--foreground-muted)] bg-[var(--card-bg)] p-2 rounded-lg overflow-x-auto border border-[var(--border)]">
                      {JSON.stringify(notification.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="flex items-center gap-4 pt-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">
                    <Calendar size={10} className="text-[var(--foreground-muted)]" /> 
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 md:translate-x-2 md:group-hover:translate-x-0">
              {!notification.isRead && (
                <button
                  onClick={() => handleRead(notification._id)}
                  disabled={pendingIds.has(notification._id)}
                  className="relative p-2 text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-[var(--accent)]/30"
                  title="Mark as read"
                >
                  {pendingIds.has(notification._id) ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              )}
              <button
                onClick={() => handleDelete(notification._id)}
                disabled={pendingIds.has(notification._id)}
                className="relative p-2 text-[var(--foreground-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-rose-500/30"
                title="Delete log"
              >
                {pendingIds.has(notification._id) ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {items.length > 5 && (
        <div className="p-4 text-center border-t border-[var(--border)] bg-[var(--card-bg)]">
          <button 
            onClick={() => {/* Implement load more */}}
            className="text-xs font-black text-[var(--foreground-muted)] hover:text-[var(--accent)] uppercase tracking-wider transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}