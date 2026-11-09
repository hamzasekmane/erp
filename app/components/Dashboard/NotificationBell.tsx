"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, Zap, CheckCircle, Cloud, Server, Database, Shield, Activity, Wifi, HardDrive, Cpu, TrendingUp, Users, FileText, Package, CreditCard } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { markAllAsReadAction, markAsReadAction } from '@/app/actions/actionsNotifications';
import notificationService from '@/app/services/notification.service';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
  module?: 'sales' | 'inventory' | 'accounting' | 'hr' | 'crm' | 'manufacturing' | 'purchase' | 'project';
  action?: string;
  user_id?: string;
  company_id?: string;
}

interface NotificationBellProps {
  token: string;
  userId?: string;
  limit?: number;
}

// Odoo Module Icons
const moduleIcons = {
  sales: TrendingUp,
  inventory: Package,
  accounting: CreditCard,
  hr: Users,
  crm: Activity,
  manufacturing: Cpu,
  purchase: ShoppingBag,
  project: FileText,
  default: Bell
};

// Odoo Module Colors
const moduleColors = {
  sales: 'emerald',
  inventory: 'blue',
  accounting: 'purple',
  hr: 'pink',
  crm: 'cyan',
  manufacturing: 'orange',
  purchase: 'indigo',
  project: 'amber',
  default: 'slate'
};

// Import ShoppingBag if needed
import { ShoppingBag } from 'lucide-react';

export default function NotificationBell({ 
  token, 
  userId, 
  limit = 5 
}: NotificationBellProps) {
  // ============== STATE MANAGEMENT ==============
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Odoo System Metrics
  const [odooMetrics, setOdooMetrics] = useState({
    dbSize: '2.4 GB',
    activeUsers: 0,
    modulesLoaded: 24,
    lastBackup: new Date().toISOString(),
    serverLoad: '23%',
    queueJobs: 0
  });
  
  // ============== REFS ==============
  const socketRef = useRef<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ============== CLICK OUTSIDE HANDLER ==============
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============== SIMULATE ODOO METRICS ==============
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setOdooMetrics({
          dbSize: '2.4 GB',
          activeUsers: Math.floor(Math.random() * 50) + 15,
          modulesLoaded: 24,
          lastBackup: new Date().toISOString(),
          serverLoad: (Math.random() * 30 + 15).toFixed(0) + '%',
          queueJobs: Math.floor(Math.random() * 10)
        });
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // ============== SOCKET.IO CONNECTION ==============
  useEffect(() => {
    if (!token) {
      console.log('❌ No token provided, socket not connected');
      return;
    }

    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));
        effectiveUserId = decoded.id || decoded._id || decoded.userId;
      } catch (e) {
        console.error('Failed to extract userId from token:', e);
      }
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io/";
    
    const socketInstance = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: { token },
      query: { token, userId: effectiveUserId },
      forceNew: true,
      addTrailingSlash: true,
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      const joinData = { token, userId: effectiveUserId };
      socketInstance.emit('join', joinData);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('joined', (data) => {
      console.log('Joined room:', data.room);
    });

    socketInstance.on('new_notification', (notification: Notification) => {
      setCount(prev => prev + 1);
      setNotifications(prev => [notification, ...prev].slice(0, limit));
      
      toast.custom((t) => (
        <div 
          className="bg-[var(--background)]/95 backdrop-blur-md border-l-4 border-[var(--accent)] rounded-2xl p-4 shadow-2xl shadow-[var(--accent)]/10 animate-in slide-in-from-top-5 duration-300 cursor-pointer hover:shadow-[var(--accent)]/20 transition-all"
          onClick={() => {
            toast.dismiss(t);
            router.push('/dashboard/notifications');
          }}
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl flex items-center justify-center">
                {React.createElement(moduleIcons[notification.module || 'default'], {
                  size: 18,
                  className: `text-[var(--accent)]`
                })}
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-wider">
                    {notification.module?.toUpperCase() || 'SYSTEM'}
                  </span>
                  <span className="text-[8px] font-mono text-[var(--foreground-muted)]">
                    Odoo v17
                  </span>
                </div>
                <span className="text-[8px] font-mono text-[var(--foreground-muted)]">
                  {new Date(notification.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-sm font-bold text-[var(--foreground)] mt-1">{notification.title}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-2">{notification.message}</p>
              {notification.action && (
                <div className="mt-2">
                  <span className="text-[8px] font-mono bg-[var(--accent)]/10 px-2 py-0.5 rounded-full text-[var(--accent)]">
                    ACTION: {notification.action}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-right',
      });

      router.refresh();
    });

    socketInstance.on('unread_count', (newCount: number) => {
      setCount(newCount);
    });

    socketRef.current = socketInstance;

    return () => {
      socketInstance.disconnect();
    };
  }, [token, userId, router, limit]);

  // ============== REFRESH NOTIFICATIONS ==============
  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    
    try {
      const [countRes, notifsRes] = await Promise.all([
        notificationService.getUnreadCount(token),
        notificationService.getNotifications(token, { limit })
      ]);
      
      if (countRes.success) setCount(countRes.count || 0);
      if (notifsRes.success) setNotifications(notifsRes.data?.notifications || []);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  }, [token, limit]);

  // ============== TOGGLE DROPDOWN ==============
  const handleToggle = async () => {
    if (!isOpen) {
      await refreshNotifications();
    }
    setIsOpen(!isOpen);
  };

  // ============== MARK ALL AS READ ==============
  const handleMarkAllRead = async () => {
    if (!token || count === 0) return;
    
    setIsPending(true);
    setCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    try {
      const res = await markAllAsReadAction(token);
      if (!res.success) throw new Error(res.error);
      
      toast.success('Toutes les notifications ont été marquées comme lues', {
        style: { 
          background: 'var(--background)', 
          color: 'var(--foreground)', 
          border: '1px solid var(--border)',
          borderRadius: '16px'
        },
        icon: <CheckCircle size={16} className="text-[var(--accent)]" />
      });
      
      router.refresh();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      await refreshNotifications();
      
      toast.error('Erreur lors du marquage des notifications', {
        style: { background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }
      });
    } finally {
      setIsPending(false);
    }
  };

  // ============== MARK SINGLE AS READ ==============
  const handleMarkAsRead = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!token) return;
    
    const previousState = notifications.find(n => n._id === id)?.isRead;
    
    setNotifications(prev => prev.map(n => 
      n._id === id ? { ...n, isRead: true } : n
    ));
    setCount(prev => Math.max(0, prev - 1));
    
    try {
      const res = await markAsReadAction(id, token);
      if (!res.success) throw new Error(res.error);
      router.refresh();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, isRead: previousState || false } : n
      ));
      setCount(prev => prev + 1);
      
      toast.error('Erreur lors du marquage de la notification', {
        style: { background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }
      });
    }
  };

  // ============== FORMAT TIME ==============
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    if (diffMins < 10080) return `Il y a ${Math.floor(diffMins / 1440)} j`;
    return date.toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============== CONNECTION STATUS ==============
  const ConnectionStatus = () => (
    <div className="absolute -bottom-1 -right-1">
      <div className={`w-2.5 h-2.5 rounded-full ${
        isConnected ? 'bg-emerald-500' : 'bg-red-500'
      } ring-2 ring-[var(--background)] ${isConnected ? 'animate-pulse' : ''}`} />
    </div>
  );

  // ============== RENDER ==============
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={handleToggle}
        className={`relative p-2.5 rounded-xl transition-all duration-300 group ${
          isOpen 
            ? 'bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 border-[var(--accent)]/50 shadow-lg shadow-[var(--accent)]/20' 
            : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/10'
        } border backdrop-blur-sm`}
        aria-label="Notifications"
      >
        <div className="relative">
          <Bell size={20} className={`transition-all duration-300 ${
            isOpen ? 'text-[var(--accent)] scale-110' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'
          }`} />
          <ConnectionStatus />
          
          {count > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-[9px] font-black text-white ring-2 ring-[var(--background)] shadow-lg shadow-rose-500/30 animate-in zoom-in duration-300">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown Menu - Style Odoo/Velora */}
      {isOpen && (
<div className="fixed md:absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 mt-4 w-[calc(100vw-2rem)] sm:w-96 z-50 bg-[var(--background)]/95 backdrop-blur-md border border-[var(--border)] rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">         
          {/* Header - Velora Branding */}
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--card-bg)] to-transparent">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
                    <Zap size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.15em] text-[var(--accent)]">
                        VELORA
                      </span>
                      <span className="text-[9px] font-bold bg-[var(--accent)]/10 px-2 py-0.5 rounded-full text-[var(--accent)]">
                        ERP v2.0
                      </span>
                      <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded-full ${
                        isConnected 
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-500 border border-red-500/30'
                      }`}>
                        {isConnected ? '● CONNECTÉ' : '○ DÉCONNECTÉ'}
                      </span>
                    </div>
                    <p className="text-[9px] text-[var(--foreground-muted)] mt-0.5 font-mono">
                      {isConnected ? 'WebSocket: ÉTABLI' : 'WebSocket: FERMÉ'}
                    </p>
                  </div>
                </div>
                
                {/* Odoo System Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[var(--border)]/50">
                  <div className="flex items-center gap-1.5">
                    <Database size={10} className="text-[var(--accent)]" />
                    <span className="text-[8px] font-mono text-[var(--foreground-muted)]">
                      DB: <span className="text-[var(--accent)] font-bold">{odooMetrics.dbSize}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={10} className="text-[var(--accent)]" />
                    <span className="text-[8px] font-mono text-[var(--foreground-muted)]">
                      UTIL: <span className="text-[var(--accent)] font-bold">{odooMetrics.activeUsers}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package size={10} className="text-[var(--accent)]" />
                    <span className="text-[8px] font-mono text-[var(--foreground-muted)]">
                      MOD: <span className="text-[var(--accent)] font-bold">{odooMetrics.modulesLoaded}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Server size={10} className="text-[var(--accent)]" />
                    <span className="text-[8px] font-mono text-[var(--foreground-muted)]">
                      LOAD: <span className="text-[var(--accent)] font-bold">{odooMetrics.serverLoad}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {count > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-[8px] font-black text-[var(--foreground-muted)] hover:text-[var(--accent)] uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isPending ? '⌛' : '✓ TOUT LIRE'}
                </button>
              )}
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="max-h-[60vh] md:max-h-[500px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const ModuleIcon = moduleIcons[notification.module || 'default'];
                return (
                  <div
                    key={notification._id}
                    onClick={(e) => !notification.isRead && handleMarkAsRead(notification._id, e)}
                    className={`p-4 border-b border-[var(--border)]/50 last:border-0 cursor-pointer transition-all hover:bg-[var(--card-bg)]/50 group ${
                      !notification.isRead 
                        ? 'bg-gradient-to-r from-[var(--accent)]/[0.02] to-transparent border-l-2 border-l-[var(--accent)]' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Module Icon */}
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center transition-all group-hover:scale-110 duration-300`}>
                          <ModuleIcon size={16} className="text-[var(--accent)]" />
                        </div>
                        {!notification.isRead && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent)] rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                        )}
                      </div>
                      
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className={`text-[10px] font-black uppercase tracking-tight ${
                              !notification.isRead ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'
                            }`}>
                              {notification.title}
                            </p>
                            {notification.priority === 'high' && (
                              <span className="text-[6px] font-black px-1 py-0.5 rounded-full bg-rose-500/20 text-rose-500 animate-pulse">
                                URGENT
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] font-mono text-[var(--foreground-muted)]">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${
                            notification.type === 'error' ? 'bg-rose-500/20 text-rose-500' :
                            notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                            notification.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-[var(--accent)]/20 text-[var(--accent)]'
                          }`}>
                            {notification.type?.toUpperCase() || 'INFO'}
                          </span>
                          
                          <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
                            MODULE: {notification.module?.toUpperCase() || 'CORE'}
                          </span>
                          
                          {notification.action && (
                            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
                              ACTION: {notification.action}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-transparent rounded-2xl animate-pulse" />
                  <div className="relative w-20 h-20 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center border-2 border-[var(--border)]">
                    <Bell size={32} className="text-[var(--foreground-muted)]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--foreground-muted)] uppercase tracking-wider">
                    AUCUNE NOTIFICATION
                  </p>
                  <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-2">
                    Système Odoo • Tous les modules sont opérationnels
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1 h-1 bg-[var(--accent)] rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-[var(--accent)] rounded-full animate-pulse delay-150" />
                  <div className="w-1 h-1 bg-[var(--accent)] rounded-full animate-pulse delay-300" />
                  <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
                    VEILLE • EN ATTENTE
                  </span>
                </div>
                <p className="text-[8px] text-[var(--foreground-muted)]/40">
                  Dernière synchronisation: {new Date().toLocaleTimeString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {/* Footer - Full Access */}
          <a 
            href="/dashboard/notifications"
            className="block p-4 text-center border-t border-[var(--border)] bg-gradient-to-r from-transparent via-[var(--card-bg)] to-transparent group"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.15em] group-hover:text-[var(--accent)] transition-all">
                VOIR TOUTES LES NOTIFICATIONS
              </span>
              <span className="text-[var(--accent)] transform group-hover:translate-x-1 transition-transform duration-300">
                →
              </span>
            </div>
            <p className="text-[6px] text-[var(--foreground-muted)]/40 mt-1 font-mono">
              Velora ERP • Gestion d'entreprise intelligente • v2.0.0
            </p>
          </a>
        </div>
      )}
    </div>
  );
}