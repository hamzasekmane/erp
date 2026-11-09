import CompanyProfileForm from "@/app/components/settings/CompanyProfileForm";

// دالة افتراضية لجلب البيانات من السيرفر
async function getTenantData() {
  const res = await fetch(`${process.env.API_URL}/tenant/profile`, { 
    cache: 'no-store' 
  });
  return res.json();
}

export default async function TenantSettingsPage() {
  const tenantData = await getTenantData();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">إعدادات الملف الشخصي للشركة</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <CompanyProfileForm initialData={tenantData} />
      </div>
    </div>
  );
}