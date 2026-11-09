import {
  ClientGroup,
  ClientGroupsResponse,
  GroupClientsResponse,
  ClientGroupStats,
  GroupQueryParams
} from "@/app/types/clientGroup.types";

import { apiFetch } from "@/app/lib/apiFetch";

/* ================================================= */
/* HELPER : BUILD QUERY STRING */
/* ================================================= */

const buildQueryString = (params?: GroupQueryParams): string => {

  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.search) searchParams.append("search", params.search);
  if (params.sort) searchParams.append("sort", params.sort);
  if (params.order) searchParams.append("order", params.order);

  const qs = searchParams.toString();

  return qs ? `?${qs}` : "";

};

/* ================================================= */
/* FORMAT GROUP */
/* ================================================= */

function formatGroup(item: any): ClientGroup {

  return {
    _id: item._id || "",
    name: item.name || "",
    description: item.description || null,
    color: item.color || "from-cyan-500 to-blue-600",
    clientCount: item.clients?.length || item.clientCount || 0,
    totalBalance: item.totalBalance || 0,
    discount: item.discount || 0,
    groupedBilling: item.groupedBilling || false,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || null,
    createdBy: item.createdBy || null,
    clients: item.clients || [],
  };

}

/* ================================================= */
/* SERVICE */
/* ================================================= */

export const clientGroupService = {

  /* ======================================== */
  /* GET ALL GROUPS */
  /* ======================================== */

  async getAllGroups(
    token: string,
    params?: GroupQueryParams
  ): Promise<ClientGroupsResponse> {

    const query = buildQueryString(params);

    const result = await apiFetch<any[]>(
      `/client-groups${query}`,
      token
    );

    const formatted = result.map(formatGroup);

    return {
      data: formatted,
      pagination: {
        total: formatted.length,
        page: params?.page || 1,
        limit: params?.limit || formatted.length,
        pages: Math.ceil(formatted.length / (params?.limit || 10)) || 1,
      },
    };

  },

  /* ======================================== */
  /* GET GROUP BY ID */
  /* ======================================== */

  async getGroupById(
    id: string,
    token: string
  ): Promise<ClientGroup | null> {

    const result = await apiFetch<any>(
      `/client-groups/${id}`,
      token
    );

    if (!result) return null;

    return formatGroup(result);

  },

  /* ======================================== */
  /* GET GROUP CLIENTS */
  /* ======================================== */

  async getGroupClients(
    groupId: string,
    token: string
  ): Promise<GroupClientsResponse> {

    const result = await apiFetch<any[]>(
      `/client-groups/${groupId}/clients`,
      token
    );

    const formatted = result.map((client) => ({
      _id: client._id || "",
      name: client.name || "",
      email: client.email,
      phone: client.phone,
      balance: client.balance || 0,
      type: client.type || "individual",
      code: client.code,
    }));

    return { data: formatted };

  },

  /* ======================================== */
  /* GROUP STATS */
  /* ======================================== */

  async getGroupStats(
    token: string
  ): Promise<ClientGroupStats | null> {

    return await apiFetch<ClientGroupStats>(
      "/client-groups/stats",
      token
    );

  },

  /* ======================================== */
  /* CHECK GROUP NAME */
  /* ======================================== */

  async checkGroupName(
    token: string,
    name: string,
    groupId?: string
  ): Promise<{ available: boolean; message?: string }> {

    const endpoint = `/client-groups/check-name?name=${encodeURIComponent(
      name
    )}${groupId ? `&groupId=${groupId}` : ""}`;

    return await apiFetch(endpoint, token);

  },

  /* ======================================== */
  /* EMPTY GROUPS */
  /* ======================================== */

  async getEmptyGroups(token: string): Promise<ClientGroup[]> {

    const response = await this.getAllGroups(token);

    return response.data.filter((g) => g.clientCount === 0);

  },

  /* ======================================== */
  /* TOP GROUPS */
  /* ======================================== */

  async getTopGroups(
    token: string,
    limit: number = 5
  ): Promise<ClientGroup[]> {

    const response = await this.getAllGroups(token, { limit: 100 });

    return response.data
      .sort((a, b) => b.clientCount - a.clientCount)
      .slice(0, limit);

  },
  async deleteGroup(
  id: string,
  token: string
): Promise<{ success: boolean; message?: string }> {

  try {
    const result = await apiFetch<any>(
      `/client-groups/${id}`,
      token,
      {
        method: 'DELETE',
      }
    );

    return { 
      success: true, 
      message: result?.message || 'Group deleted successfully' 
    };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete group' 
    };
  }
}
};

export default clientGroupService;