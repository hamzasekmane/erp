"use client";

import { updateTenantAction } from "@/app/actions/tenantActions";
import { useState } from "react";

export default function CompanyProfileForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await updateTenantAction(formData);
    setLoading(false);
    
    if (result.success) alert(result.message);
    else alert("خطأ: " + result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="tenantId" value={initialData._id} />
      
      <div>
        <label className="block text-sm font-medium">اسم الشركة</label>
        <input 
          name="companyName" 
          defaultValue={initialData.name}
          className="w-full border p-2 rounded mt-1" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium">العنوان</label>
        <input 
          name="address" 
          defaultValue={initialData.address}
          className="w-full border p-2 rounded mt-1" 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
      </button>
    </form>
  );
}