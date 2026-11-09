// services/dashboard/dashboard.service.ts

import { dashboardApi } from "./dashboard.api";
import {
  DEFAULT_DASHBOARD_DATA,
  DEFAULT_QUICK_STATS,
  normalizeDashboardData,
  normalizeQuickStats,
  normalizeUserProfile,
  normalizeArrayData,
} from "./dashboard.mapper";
import notificationService from "../notification.service";
import type { DashboardData, QuickStats } from "@/app/types/dashboard";

const dashboardService = {
  // ------------------------------------------
  // 1. Dashboard Statistics
  // ------------------------------------------

  async getDashboardStats(token: string): Promise<DashboardData> {
    try {
      console.log("🚀 Fetching dashboard stats...");
      const result = await dashboardApi.fetchDashboardStats(token);

      if (result.success && result.data) {
        const normalized = normalizeDashboardData(result.data);
        console.log("✅ Dashboard stats loaded successfully");
        return normalized;
      }

      console.warn("⚠️ Unexpected API response structure");
      return DEFAULT_DASHBOARD_DATA;
    } catch (error) {
      console.error("❌ Error in getDashboardStats:", error);
      return DEFAULT_DASHBOARD_DATA;
    }
  },

  async getQuickStats(token: string): Promise<QuickStats> {
    try {
      console.log("🚀 Fetching quick stats...");
      const result = await dashboardApi.fetchQuickStats(token);

      if (result.success && result.data) {
        const normalized = normalizeQuickStats(result.data);
        console.log("✅ Quick stats loaded:", normalized.today);
        return normalized;
      }

      console.warn("⚠️ Unexpected quick stats structure, using defaults");
      return DEFAULT_QUICK_STATS;
    } catch (error) {
      console.error("❌ Error in getQuickStats:", error);
      return DEFAULT_QUICK_STATS;
    }
  },

  // ------------------------------------------
  // 2. User Profile
  // ------------------------------------------

  async getUserProfile(token: string) {
    try {
      const result = await dashboardApi.fetchUserProfile(token);
      return normalizeUserProfile(result);
    } catch (error) {
      console.error("❌ Error in getUserProfile:", error);
      return null;
    }
  },

  // ------------------------------------------
  // 3. Notifications (delegated)
  // ------------------------------------------

  async getNotifications(token: string, params?: any) {
    try {
      const response = await notificationService.getNotifications(token, params);

      if (response.success && response.data) {
        return {
          notifications: normalizeArrayData(response.data.notifications || []),
          unreadCount: response.data.unreadCount || 0,
          pagination: response.pagination,
        };
      }

      return { notifications: [], unreadCount: 0 };
    } catch (error) {
      console.error("❌ Error in getNotifications:", error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  markNotificationAsRead: (token: string, notificationId: string) =>
    notificationService.markAsRead(notificationId, token),

  markAllNotificationsAsRead: (token: string) =>
    notificationService.markAllAsRead(token),

  deleteNotification: (token: string, notificationId: string) =>
    notificationService.deleteNotification(notificationId, token),

  deleteAllNotifications: (token: string) =>
    notificationService.deleteAllNotifications(token),

  async getUnreadCount(token: string): Promise<number> {
    try {
      const result = await notificationService.getUnreadCount(token);
      return result.count || 0;
    } catch (error) {
      console.error("❌ Error in getUnreadCount:", error);
      return 0;
    }
  },
};

export default dashboardService;

// ==========================================
// BACKWARD COMPATIBILITY EXPORTS
// ==========================================

export const getDashboardStats = dashboardService.getDashboardStats.bind(dashboardService);
export const getUserProfile = dashboardService.getUserProfile.bind(dashboardService);
export const getQuickStats = dashboardService.getQuickStats.bind(dashboardService);
export const getNotifications = dashboardService.getNotifications.bind(dashboardService);
export const markNotificationAsRead = dashboardService.markNotificationAsRead.bind(dashboardService);
export const markAllNotificationsAsRead = dashboardService.markAllNotificationsAsRead.bind(dashboardService);
export const deleteNotification = dashboardService.deleteNotification.bind(dashboardService);
export const deleteAllNotifications = dashboardService.deleteAllNotifications.bind(dashboardService);