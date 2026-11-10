import { cookies } from "next/headers";
import { paymentService } from "@/app/services/paymentServices";
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  Wallet 
} from "lucide-react";
import PaymentChart from "@/app/components/payments/PaymentChart";

export default async function PaymentStatsPage() {
  const token = (await cookies()).get("token")?.value || "";
  const stats = await paymentService.getStats(token);

  // إحصائيات افتراضية في حال كانت البيانات فارغة
  const summary = [
    { label: "Total Collecté", value: `${stats?.totalAmount || 0} DZD`, icon: Wallet, color: "text-emerald-500" },
    { label: "Transactions", value: stats?.count || 0, icon: CreditCard, color: "text-blue-500" },
    { label: "Clients Unique", value: stats?.uniqueClients || 0, icon: Users, color: "text-purple-500" },
  ];

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl sm:text-5xl font-black italic uppercase tracking-tighter">Analyse <span className="text-blue-600">Financière</span></h1>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] italic">Performance des revenus en temps réel</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summary.map((item, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all">
            <item.icon className={`${item.color} mb-4`} size={24} />
            <p className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest">{item.label}</p>
            <h2 className="text-3xl font-black italic mt-1">{item.value}</h2>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black uppercase italic">Flux de Trésorerie (7j)</h3>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold italic">
            <TrendingUp size={16} /> +12.5% vs semaine dernière
          </div>
        </div>
        <div className="h-[400px] w-full">
          {/* المكون الذي سننشئه في الخطوة التالية */}
          <PaymentChart data={stats?.dailyStats || []} />
        </div>
      </div>
    </div>
  );
}