import { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { 
  Bell, 
  Trash2, 
  CheckCircle2, 
  Filter, 
  Calendar,
  AlertCircle,
  Clock,
  Zap,
  Database,
  Users,
  Server,
  Activity,
  Shield,
  Wifi,
  ArrowLeft,
  RefreshCw,
  FileText,
  CreditCard
} from "lucide-react";
import notificationService from "@/app/services/notification.service";
import { 
  markAllAsReadAction, 
  deleteAllNotificationsAction,
  cleanupNotificationsAction 
} from "@/app/actions/actionsNotifications";
import NotificationList from "@/app/components/Dashboard/NotificationList";

export const metadata: Metadata = {
  title: "Velora ERP | Centre de notifications",
  description: "Gestion centralisée des notifications et alertes système",
  keywords: "notifications, alerts, ERP, Velora",
};

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Wrapper functions that match the FormData signature
async function handleMarkAllAsRead(formData: FormData) {
  "use server";
  const token = formData.get("token") as string;
  await markAllAsReadAction(token);
}

async function handleCleanup(formData: FormData) {
  "use server";
  const token = formData.get("token") as string;
  await cleanupNotificationsAction(token);
}

async function handleDeleteAll(formData: FormData) {
  "use server";
  const token = formData.get("token") as string;
  await deleteAllNotificationsAction(token);
}

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // Fetch initial data on the server
  const response = await notificationService.getNotifications(token);
  const notifications = response.success ? response.data.notifications : [];
  const unreadCount = response.success ? response.data.unreadCount : 0;

  // Système metrics
  const systemMetrics = {
    dbSize: '2.4 GB',
    activeUsers: 36,
    modulesLoaded: 24,
    serverLoad: '25%',
    uptime: '99.99%',
    wsStatus: 'CONNECTÉ'
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* Header with Back Button - Same style as Security page */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings"
          className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
        >
          <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
        </Link>
        <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
          <Bell size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              VELORA • NOTIFICATIONS
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              ● LIVE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
            Centre de <span className="text-[var(--accent)]">Notifications</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Gérez toutes vos alertes et notifications système
          </p>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:scale-110 transition-transform">
              <Database size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_01</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Taille BD</p>
          <p className="text-2xl font-black text-[var(--foreground)]">{systemMetrics.dbSize}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-[85%] h-full bg-[var(--accent)] rounded-full" />
          </div>
        </div>

        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:scale-110 transition-transform">
              <Users size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_02</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Utilisateurs actifs</p>
          <p className="text-2xl font-black text-[var(--foreground)]">{systemMetrics.activeUsers}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-[72%] h-full bg-[var(--accent)] rounded-full" />
          </div>
        </div>

        <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg group-hover:scale-110 transition-transform">
              <Activity size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC_03</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Modules chargés</p>
          <p className="text-2xl font-black text-[var(--foreground)]">{systemMetrics.modulesLoaded}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-[100%] h-full bg-emerald-500 rounded-full" />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl space-y-2 group">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-[var(--accent)]/20 rounded-lg group-hover:scale-110 transition-transform">
              <Server size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[8px] font-mono text-[var(--accent)]">LIVE</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Charge serveur</p>
          <p className="text-2xl font-black text-[var(--accent)]">{systemMetrics.serverLoad}</p>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="w-[25%] h-full bg-[var(--accent)] rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Wifi size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[8px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">WebSocket</p>
            <p className="text-sm font-bold text-emerald-500">{systemMetrics.wsStatus}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
            <Shield size={16} className="text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-[8px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Sécurité</p>
            <p className="text-sm font-bold text-[var(--accent)]">TLS 1.3 • Chiffré</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Clock size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[8px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Dernière synchro</p>
            <p className="text-sm font-bold text-[var(--foreground)]">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <form action={handleMarkAllAsRead}>
          <input type="hidden" name="token" value={token} />
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:bg-[var(--accent)]/10 transition-colors">
            <CheckCircle2 size={16} />
            Tout marquer comme lu
          </button>
        </form>

        <form action={handleCleanup}>
          <input type="hidden" name="token" value={token} />
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors">
            <RefreshCw size={16} />
            Nettoyer
          </button>
        </form>

        <form action={handleDeleteAll}>
          <input type="hidden" name="token" value={token} />
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors">
            <Trash2 size={16} />
            Tout supprimer
          </button>
        </form>
      </div>

      {/* Notifications List */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-[var(--background)]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                <Bell size={14} className="text-[var(--accent)]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-tight">
                  Flux d'événements
                </span>
                <p className="text-[9px] text-[var(--foreground-muted)] font-mono">
                  {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
                <span className="text-[9px] font-mono text-[var(--accent)]">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {notifications.length > 0 ? (
          <NotificationList initialData={notifications} token={token} />
        ) : (
          <div className="p-16 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-transparent rounded-2xl animate-pulse" />
              <div className="relative w-20 h-20 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center border-2 border-[var(--border)]">
                <Bell size={32} className="text-[var(--foreground-muted)]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-[var(--foreground-muted)] uppercase tracking-wider">
                Aucune notification
              </p>
              <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-2 font-mono">
                Système Velora • Tous les modules sont opérationnels
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
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
        <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
          Velora ERP • Gestion d'entreprise intelligente • v2.0.0
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
            WebSocket: CONNECTÉ
          </span>
        </div>
      </div>
    </div>
  );
}