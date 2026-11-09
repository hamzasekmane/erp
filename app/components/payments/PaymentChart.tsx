"use client";
// قم بتغيير السطر الأول إلى هذا:
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PaymentChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            {/* لون أزرق متوهج يتناسب مع الهوية البصرية */}
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
          </linearGradient>
        </defs>
        
        {/* تغيير لون الشبكة ليكون خفيفاً جداً ولا يشتت الانتباه */}
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke="currentColor" 
          className="text-zinc-100 dark:text-zinc-800" 
        />
        
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 9, fontWeight: 800, fill: '#a1a1aa' }} 
          dy={15}
          // تحويل التاريخ لشكل مختصر إذا كان طويلاً
          tickFormatter={(str) => {
            const date = new Date(str);
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          }}
        />
        
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 9, fontWeight: 800, fill: '#a1a1aa' }} 
        />

        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(9, 9, 11, 0.8)', // Zinc-950 مع شفافية
            backdropFilter: 'blur(8px)',
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            padding: '12px'
          }}
          itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}
          labelStyle={{ color: '#71717a', marginBottom: '4px', fontSize: '10px' }}
          cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
        />

        <Area 
          type="monotone" 
          dataKey="amount" 
          stroke="#2563eb" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorAmount)" 
          animationDuration={2000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}