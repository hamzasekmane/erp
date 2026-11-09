"use client";

import { useState, useTransition } from "react";
import { paymentService } from "@/app/services/paymentServices";
import { Loader2, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface ToggleProps {
  id: string;
  initialStatus: boolean;
  token: string;
}

export default function GatewayToggle({ id, initialStatus, token }: ToggleProps) {
  const [isActive, setIsActive] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = async () => {
    // تحديث الحالة بصرياً فوراً (Optimistic UI)
    const newStatus = !isActive;
    setIsActive(newStatus);

    startTransition(async () => {
      try {
        const result = await paymentService.toggleGateway(id, newStatus, token);
        
        if (!result.success) {
          // إذا فشل الطلب، نعود للحالة الأصلية
          setIsActive(isActive);
          alert(result.message || "Erreur lors de la mise à jour");
        } else {
          // تحديث بيانات السيرفر (Server Actions/Server Components)
          router.refresh();
        }
      } catch (error) {
        setIsActive(isActive);
        console.error("Toggle Error:", error);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`
        relative flex items-center gap-3 px-4 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95
        ${isActive 
          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20' 
          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20'}
        ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isActive ? (
        <Power size={14} />
      ) : (
        <PowerOff size={14} />
      )}
      
      <span>{isActive ? "Actif" : "Inactif"}</span>

      {/* مؤشر النقطة المضيئة (LED Effect) */}
      <span className={`
        absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900
        ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}
      `}></span>
    </button>
  );
}