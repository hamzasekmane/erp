import { apiBaseUrl } from "@/app/lib/apiBase";
// services/dashboard/dashboard.api.ts

const API_URL = apiBaseUrl();

export const dashboardApi = {
  /**
   * Fetch raw dashboard stats from API
   */
  async fetchDashboardStats(token: string) {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
      next: { tags: ["dashboard-stats"] },
    });

    if (!response.ok) {
      throw new Error(`Dashboard stats fetch failed with status ${response.status}`);
    }

    return response.json();
  },

  /**
   * Fetch raw quick stats from API
   */
  async fetchQuickStats(token: string) {
    const response = await fetch(`${API_URL}/dashboard/quick-stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
      next: { tags: ["quick-stats"] },
    });

    if (!response.ok) {
      throw new Error(`Quick stats fetch failed with status ${response.status}`);
    }

    return response.json();
  },

  /**
   * Fetch raw user profile from API
   */
  async fetchUserProfile(token: string) {
    const response = await fetch(`${API_URL}/users/profile/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`User profile fetch failed with status ${response.status}`);
    }

    return response.json();
  },
};