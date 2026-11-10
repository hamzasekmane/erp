import { apiBaseUrl } from "@/app/lib/apiBase";
/**
 * notification.service.ts
 * Service de gestion des notifications pour Velora ERP
 */

const API_URL = apiBaseUrl();

// --- INTERFACES ---

export interface Notification {
  _id: string;
  tenantId: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

// --- SERVICE ---

const notificationService = {
  
  /**
   * Récupère la liste des notifications avec filtrage et pagination
   */
  getNotifications: async (token: string, params?: NotificationQueryParams): Promise<NotificationsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
      if (params?.type) queryParams.append('type', params.type);

      const url = `${API_URL}/dashboard/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        next: { tags: ['notifications'] }
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `Erreur lors de la récupération : ${res.status}`);
      }
      
      const data = await res.json();
      
      // Normalisation des dates pour éviter les erreurs de rendu côté client
      if (data.success && data.data?.notifications) {
        data.data.notifications = data.data.notifications.map((notif: any) => ({
          ...notif,
          createdAt: notif.createdAt ? new Date(notif.createdAt).toISOString() : new Date().toISOString(),
          readAt: notif.readAt ? new Date(notif.readAt).toISOString() : null,
          expiresAt: notif.expiresAt ? new Date(notif.expiresAt).toISOString() : null
        }));
      }
      
      return data;
    } catch (error) {
      console.error("❌ NotificationService [getNotifications]:", error);
      throw error;
    }
  },

  /**
   * Récupère uniquement le compteur de notifications non lues
   */
  getUnreadCount: async (token: string): Promise<{ success: boolean; count: number }> => {
    try {
      const res = await fetch(`${API_URL}/dashboard/notifications/unread/count`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store",
        next: { tags: ['unread-count'] }
      });
      if (!res.ok) throw new Error("Erreur compteur");
      return await res.json();
    } catch (error) {
      console.error("❌ NotificationService [getUnreadCount]:", error);
      return { success: false, count: 0 };
    }
  },

  /**
   * Marque une notification spécifique comme lue
   */
  markAsRead: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/dashboard/notifications/${id}/read`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` },
    });
    return res.json();
  },

  /**
   * Marque toutes les notifications de l'utilisateur comme lues
   */
  markAllAsRead: async (token: string) => {
    const res = await fetch(`${API_URL}/dashboard/notifications/read-all`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` },
    });
    return res.json();
  },

  /**
   * Supprime une notification
   */
  deleteNotification: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/dashboard/notifications/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    return res.json();
  },

  /**
   * Supprime tout l'historique des notifications
   */
  deleteAllNotifications: async (token: string) => {
    const res = await fetch(`${API_URL}/dashboard/notifications`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    return res.json();
  },

  // --- ADMIN ACTIONS ---

  /**
   * Envoie une notification système à tous les utilisateurs (Broadcast)
   */
  sendSystemNotification: async (token: string, data: { title: string; message: string; type: string }) => {
    const res = await fetch(`${API_URL}/dashboard/notifications/system`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  /**
   * Déclenche le nettoyage des notifications expirées
   */
  cleanupNotifications: async (token: string) => {
    const res = await fetch(`${API_URL}/dashboard/notifications/cleanup`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    });
    return res.json();
  }
};

export default notificationService;