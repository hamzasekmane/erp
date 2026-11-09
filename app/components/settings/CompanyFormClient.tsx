"use client";

import { useActionState } from "react";
import { updateCompanyAction } from "@/app/actions/settingsActions";
import { Building2, MapPin, Receipt, Hash, Globe, Save } from "lucide-react";

export default function CompanyFormClient({ initialData }: { initialData: any }) {
  const [state, formAction, isPending] = useActionState(updateCompanyAction, { success: false, message: "" });

  const tenant = initialData || {};
  const address = tenant.address || {};
  const contact = tenant.contact || {};
  const inv = tenant.settings?.invoice || {};
  const tax = tenant.settings?.tax || {};

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
          Organization <span className="text-indigo-600">Hub</span>
        </h1>
      </div>

      <form action={formAction} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Identity & Address */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="text-indigo-600" size={20} />
              <h2 className="font-black uppercase text-xs tracking-widest dark:text-white italic">Identity & Legal</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Company Name" name="name" val={tenant.name} />
              <InputField label="Business Name" name="businessName" val={tenant.businessName} />
              <InputField label="Tax Number" name="taxNumber" val={tenant.taxNumber} />
              <InputField label="TVA Intra" name="tvaIntra" val={tenant.tvaIntra} />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <MapPin className="text-cyan-500" size={20} />
              <h2 className="font-black uppercase text-xs tracking-widest dark:text-white italic">Localization</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <InputField label="Street Address" name="street" val={address.street} />
              </div>
              <InputField label="City" name="city" val={address.city} />
              <InputField label="Country" name="country" val={address.country} />
              <InputField label="Postal Code" name="postalCode" val={address.postalCode} />
              <InputField label="Phone" name="phone" val={contact.phone} />
            </div>
          </div>
        </div>

        {/* Sidebar: Billing & Action */}
        <div className="space-y-8">
          <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Receipt className="text-indigo-500" size={20} />
              <h2 className="font-black uppercase text-xs tracking-widest text-white italic">Invoicing Logic</h2>
            </div>
            <div className="space-y-6">
              <SidebarInput label="Invoice Prefix" name="prefix" val={inv.prefix} />
              <SidebarInput label="Next Number" name="nextNumber" val={inv.nextNumber} type="number" />
              <SidebarInput label="Default VAT (%)" name="defaultVat" val={tax.defaultVat} />
              <SidebarInput label="Currency" name="currency" val={tenant.currency} />
            </div>
          </div>

          <button 
            disabled={isPending}
            className="w-full bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.3em] py-6 rounded-[2rem] hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
          >
            {isPending ? "Syncing..." : "Save Protocol"}
          </button>

          {state.message && (
            <p className={`text-center font-black text-[10px] uppercase tracking-widest ${state.success ? 'text-emerald-500' : 'text-rose-500'}`}>
              {state.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

// مكونات صغيرة لتقليل تكرار الكود
function InputField({ label, name, val }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 italic">{label}</label>
      <input name={name} defaultValue={val} className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl p-4 text-sm font-bold dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all" />
    </div>
  );
}

function SidebarInput({ label, name, val, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">{label}</label>
      <input type={type} name={name} defaultValue={val} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all" />
    </div>
  );
}