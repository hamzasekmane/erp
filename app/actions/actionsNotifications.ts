"use server";

import { apiBaseUrl } from "@/app/lib/apiBase";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

const API_URL = apiBaseUrl();

export type NotificationActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  unreadCount?: number;
  timestamp?: string;
};

type NotificationIntent = 
  | "read"
  | "readAll"
  | "delete"
  | "deleteAll"
  | "cleanup";

// Define cache profiles
const CACHE_PROFILE = {
  NOTIFICATIONS: "notifications",
  UNREAD_COUNT: "unread-count",
  DEFAULT: "default"
} as const;

/**
 * Get the Auth Token from Cookies with improved error handling
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = 
      cookieStore.get("token")?.value ||
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value ||
      null;
    
    if (!token) {
      console.warn("No authentication token found in cookies");
    }
    
    return token;
  } catch (error) {
    console.error("Auth Token Retrieval Failed:", error);
    return null;
  }
}

/**
 * Validate notification intent
 */
function isValidNotificationIntent(intent: string): intent is NotificationIntent {
  return ["read", "readAll", "delete", "deleteAll", "cleanup"].includes(intent);
}

/**
 * Build request configuration based on intent
 */
function buildRequestConfig(intent: NotificationIntent, id?: string) {
  let url = `${API_URL}/dashboard/notifications`;
  let method = "PUT";
  let successMessage = "";

  switch (intent) {
    case "read":
      if (!id) throw new Error("Notification ID required for read action");
      url += `/${id}/read`;
      method = "PUT";
      successMessage = "Message highlighted as read.";
      break;
    case "readAll":
      url += `/read-all`;
      method = "PUT";
      successMessage = "All signals marked as read.";
      break;
    case "delete":
      if (!id) throw new Error("Notification ID required for delete action");
      url += `/${id}`;
      method = "DELETE";
      successMessage = "Log entry purged.";
      break;
    case "deleteAll":
      method = "DELETE";
      successMessage = "Full notification database purged.";
      break;
    case "cleanup":
      url += `/cleanup`;
      method = "DELETE";
      successMessage = "Legacy logs archived and cleaned.";
      break;
    default:
      throw new Error(`Unsupported Action Intent: ${intent}`);
  }

  return { url, method, successMessage };
}

/**
 * Revalidate all notification-related cache
 */
function revalidateNotificationCache() {
  try {
    revalidatePath("/dashboard/notifications", "page");
    revalidatePath("/dashboard", "layout");
    
    // Second argument is required for revalidateTag in Next.js 15+
    revalidateTag("notifications", CACHE_PROFILE.DEFAULT);
    revalidateTag("unread-count", CACHE_PROFILE.DEFAULT);
  } catch (error) {
    console.error("❌ Cache revalidation failed:", error);
  }
}

/**
 * Main Centralized Notification Action
 * Fixed for Next.js 15+ TypeScript requirements
 */
export async function notificationAction(
  prevState: NotificationActionResult | null,
  formData: FormData
): Promise<NotificationActionResult> {
  const id = formData.get("id") as string | null;
  const token = (formData.get("token") as string) || (await getAuthToken());
  const intent = formData.get("intent") as string;

  // Validate intent
  if (!intent || !isValidNotificationIntent(intent)) {
    return {
      success: false,
      error: `Invalid or missing action intent: ${intent}`,
      timestamp: new Date().toISOString()
    };
  }

  // Validate token
  if (!token) {
    return {
      success: false,
      error: "Authentication failed: Missing or invalid token. Please log in again.",
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Build request configuration
    const { url, method, successMessage } = buildRequestConfig(intent, id || undefined);

    console.log(`Notification Action [${intent}]:`, { url, method });

    // Make API request
    const res = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // Add cache control for Next.js
      cache: "no-store",
    });

    // Handle non-OK responses
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      
      // Handle specific error cases
      if (res.status === 401) {
        return {
          success: false,
          error: "Session expired. Please log in again.",
          timestamp: new Date().toISOString()
        };
      }
      
      if (res.status === 404) {
        return {
          success: false,
          error: "Notification not found. It may have been already deleted.",
          timestamp: new Date().toISOString()
        };
      }

      throw new Error(errorData.message || `Protocol Error: ${res.status}`);
    }

    // Parse response
    const data = await res.json().catch(() => ({}));

    //  FIXED: Proper Next.js 15+ cache revalidation with required arguments
    revalidateNotificationCache();

    return {
      success: true,
      message: successMessage,
      data,
      unreadCount: data.unreadCount ?? data.data?.unreadCount ?? 0,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    console.error(`Action [${intent}] Failed:`, {
      error: error.message,
      stack: error.stack,
      intent,
      id
    });

    return {
      success: false,
      error: error.message || "Unknown system failure during execution.",
      timestamp: new Date().toISOString()
    };
  }
}

/* --- EXPORTED HELPER ACTIONS --- */

/**
 * Mark a single notification as read
 */
export async function markAsReadAction(id: string, token?: string): Promise<NotificationActionResult> {
  const fd = new FormData();
  fd.append("id", id);
  fd.append("intent", "read");
  if (token) fd.append("token", token);
  return notificationAction(null, fd);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsReadAction(token?: string): Promise<NotificationActionResult> {
  const fd = new FormData();
  fd.append("intent", "readAll");
  if (token) fd.append("token", token);
  return notificationAction(null, fd);
}

/**
 * Delete a single notification
 */
export async function deleteNotificationAction(id: string, token?: string): Promise<NotificationActionResult> {
  const fd = new FormData();
  fd.append("id", id);
  fd.append("intent", "delete");
  if (token) fd.append("token", token);
  return notificationAction(null, fd);
}

/**
 * Delete all notifications
 */
export async function deleteAllNotificationsAction(token?: string): Promise<NotificationActionResult> {
  const fd = new FormData();
  fd.append("intent", "deleteAll");
  if (token) fd.append("token", token);
  return notificationAction(null, fd);
}

/**
 * Clean up old notifications
 */
export async function cleanupNotificationsAction(token?: string): Promise<NotificationActionResult> {
  const fd = new FormData();
  fd.append("intent", "cleanup");
  if (token) fd.append("token", token);
  return notificationAction(null, fd);
}

/**
 * Refresh notifications cache
 */
export async function refreshNotificationsAction(): Promise<{ revalidated: boolean; timestamp: string }> {
  try {
    // ✅ FIXED: Proper Next.js 15+ cache revalidation with required arguments
    revalidatePath("/dashboard/notifications", "page");
    revalidatePath("/dashboard", "layout");
    revalidateTag("notifications", "default");
    revalidateTag("unread-count", "default");
    
    return {
      revalidated: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to refresh notifications:", error);
    return {
      revalidated: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Batch delete notifications (for multiple IDs)
 */
export async function batchDeleteNotificationsAction(ids: string[], token?: string): Promise<NotificationActionResult> {
  try {
    const authToken = token || await getAuthToken();
    
    if (!authToken) {
      return {
        success: false,
        error: "Authentication failed: Missing token.",
        timestamp: new Date().toISOString()
      };
    }

    const res = await fetch(`${API_URL}/dashboard/notifications/batch-delete`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to batch delete: ${res.status}`);
    }

    const data = await res.json();

    //  FIXED: Proper Next.js 15+ cache revalidation with required arguments
    revalidateNotificationCache();

    return {
      success: true,
      message: `Successfully deleted ${ids.length} notifications`,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Batch delete failed:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStatsAction(token?: string): Promise<NotificationActionResult> {
  try {
    const authToken = token || await getAuthToken();
    
    if (!authToken) {
      return {
        success: false,
        error: "Authentication failed: Missing token.",
        timestamp: new Date().toISOString()
      };
    }

    const res = await fetch(`${API_URL}/dashboard/notifications/stats`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stats: ${res.status}`);
    }

    const data = await res.json();

    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Failed to fetch notification stats:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}