import { UserPlus, ArrowLeft, Mail, User, Shield, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// This is the COMPONENT that Next.js is looking for
export default async function NewUserPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/dashboard/settings/users"
          className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 hover:text-indigo-600 transition-colors tracking-widest italic"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Back to Personnel
        </Link>
        <div>
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
            Add <span className="text-indigo-600">Member</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-2 ml-1 italic">
            Deploy new access credentials to the system
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800/50 p-8 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
        <form className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest ml-4">Full Identity</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
                  <User size={18} />
                </div>
                <input type="text" name="name" placeholder="E.G. JOHN DOE" className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-black uppercase italic focus:outline-none focus:border-indigo-500 transition-all dark:text-white" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest ml-4">Comms Link (Email)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input type="email" name="email" placeholder="USER@SECTOR.COM" className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-black uppercase italic focus:outline-none focus:border-indigo-500 transition-all dark:text-white" required />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest ml-4">Access Clearance Level</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RoleOption value="user" title="Staff" desc="Standard access" icon={<User size={20}/>} defaultChecked />
              <RoleOption value="manager" title="Manager" desc="Lead operations" icon={<Shield size={20}/>} />
              <RoleOption value="admin" title="Super Admin" desc="Full clearance" icon={<ShieldCheck size={20}/>} />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] italic flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/20">
              <UserPlus size={18} strokeWidth={3} />
              Initialize Personnel Deployment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleOption({ value, title, desc, icon, defaultChecked }: any) {
  return (
    <label className="relative cursor-pointer group">
      <input type="radio" name="role" value={value} className="peer sr-only" defaultChecked={defaultChecked} />
      <div className="p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50/30 dark:peer-checked:bg-indigo-900/10 transition-all">
        <div className="flex items-center gap-3">
          <div className="text-zinc-400 group-hover:text-indigo-500 peer-checked:text-indigo-600 transition-colors">{icon}</div>
          <div>
            <p className="text-[10px] font-black uppercase italic dark:text-white">{title}</p>
            <p className="text-[8px] font-bold text-zinc-400 uppercase italic tracking-tighter">{desc}</p>
          </div>
        </div>
      </div>
    </label>
  );
}