const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const taxService = {
  // 🧾 جلب جميع الضرائب
  getAllTaxes: async (token: string, params: string = "") => {
    const res = await fetch(`${API_URL}/taxes${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch taxes");
    }

    return await res.json();
  },

  // ➕ إنشاء ضريبة جديدة
createTax: async (taxData: any, token: string) => {
    const res = await fetch(`${API_URL}/taxes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taxData),
    });

    if (!res.ok) {
      // Extract the error message from your validation middleware
      const errorResponse = await res.json();
      console.error("Backend Validation Error:", errorResponse);
      throw new Error(errorResponse.message || "Validation Failed");
    }

    return await res.json();
  },
 updateTax: async (id: string, taxData: any, token: string) => {
    const res = await fetch(`${API_URL}/taxes/${id}`, {
      method: "PUT", // Fixed: Changed from PATCH to PUT to match your Express route
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taxData),
    });
    
    if (!res.ok) {
      const errorResponse = await res.json();
      throw new Error(errorResponse.message || "Failed to update tax");
    }
    return await res.json();
  },

  // 🗑️ حذف ضريبة
  deleteTax: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/taxes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete tax");
    return await res.json();
  },
};
