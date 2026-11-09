"use client";

import Link from "next/link";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: 'blue' | 'emerald' | 'amber';
  onClick?: () => void;
}

export default function QuickActionCard({ 
  title, 
  description, 
  icon, 
  href, 
  color = 'blue', 
  onClick 
}: QuickActionCardProps) {
  
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 hover:bg-amber-600 hover:text-white'
  };

  const CardContent = () => (
    <div className={`p-5 rounded-xl ${colorClasses[color]} transition-all cursor-pointer flex items-center gap-4 group`}>
      <div className="p-2 rounded-lg bg-white/20 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase">{title}</h4>
        <p className="text-[8px] opacity-70 mt-1">{description}</p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <CardContent />
      </div>
    );
  }

  return (
    <Link href={href} className="block">
      <CardContent />
    </Link>
  );
}