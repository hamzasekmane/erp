"use client";
import { Plus, Receipt, UserPlus, PackagePlus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const actions = [
    { 
      icon: <Receipt size={18} />, 
      label: "Facture", 
      color: "bg-cyan-500",
      href: "/dashboard/invoices/new"
    },
    { 
      icon: <UserPlus size={18} />, 
      label: "Client", 
      color: "bg-indigo-500",
      href: "/dashboard/clients/new" 
    },
    { 
      icon: <PackagePlus size={18} />, 
      label: "Produit", 
      color: "bg-zinc-800",
      href: "/dashboard/products/new" 
    },
  ];

  const handleNavigation = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Backdrop: Closes menu when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] transition-opacity cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-[100]">
        {/* Sub-buttons */}
        {isOpen && (
          <div className="flex flex-col gap-3 mb-2">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleNavigation(action.href)}
                className="flex items-center gap-3 bg-[#020617] border border-white/10 px-4 py-2 rounded-2xl shadow-2xl hover:scale-105 transition-all group animate-in slide-in-from-bottom-2 fade-in duration-200 backdrop-blur-sm"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                  {action.label}
                </span>
                <div className={`p-2 rounded-xl ${action.color} text-white shadow-lg`}>
                  {action.icon}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main Floating Action Button (FAB) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-4 rounded-[1.5rem] text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 
            ${isOpen 
              ? 'bg-zinc-900 rotate-[135deg] shadow-zinc-500/20 border border-white/10' 
              : 'bg-cyan-600 shadow-cyan-500/40 hover:shadow-cyan-500/60'
            }`}
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>
    </>
  );
}