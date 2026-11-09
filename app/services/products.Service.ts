const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const productsService = {
  // --- PRODUCTS ---
  getAllProducts: async (token: string, params: string = "") => {
    const res = await fetch(`${API_URL}/products?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
     next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
  },

  getById: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getStats: async (token: string) => {
    const res = await fetch(`${API_URL}/products/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok)
      return {
        data: {
          summary: { totalProducts: 0, totalStockValue: 0, lowStockCount: 0 },
        },
      };
    return res.json();
  },

  createProduct: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ✅  دالة تحديث المنتج
  updateProduct: async (id: string, data: any, token: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT", // استخدم PATCH أو PUT حسب الباك إيند
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ✅  دالة حذف المنتج
  deleteProduct: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ✅  دالة تغيير الحالة (Active/Inactive)
toggleStatus: async (id: string, nextState: boolean, token: string) => {
  try {
    
    const payload = {
      isActive: Boolean(nextState),
      status: nextState ? "active" : "inactive"
    };

    const response = await fetch(`${API_URL}/products/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // تسجيل تفاصيل الخطأ للمساعدة في التصحيح
      console.error("Toggle Status Error Details:", {
        status: response.status,
        url: `${API_URL}/products/${id}/status`,
        payload,
        response: data
      });
      return { success: false, message: data.message || "Échec du changement d'état" };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Network error in toggleStatus:", error);
    return { success: false, message: "Erreur de connexion" };
  }
},

  // --- CATEGORIES ---
  getCategories: async (token: string) => {
    const res = await fetch(`${API_URL}/categories/type/product`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },

  getCategoryById: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.json();
  },

  createCategory: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateCategory: async (id: string, data: any, token: string) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteCategory: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};
