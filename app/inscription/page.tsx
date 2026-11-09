import RegisterForm from "@/app/components/auth/RegisterForm";
import Link from "next/link";
import { Suspense } from "react"; 
import { 
  ShieldCheck, Globe, Lock, CheckCircle2, Star 
} from "lucide-react";

export default function RegisterPage() {
  return (
    // تم تغيير bg-[#fafafa] إلى bg-[#020617] ليتناسب مع globals.css
    <div className="min-h-screen bg-[#020617] flex flex-col lg:flex-row font-sans selection:bg-cyan-500/30" dir="ltr">
      
      {/* القسم الأيسر: عرض المميزات (مخفي على الموبايل) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#020617] p-16 flex-col justify-between text-white relative overflow-hidden border-r border-zinc-900/50">
        {/* إضاءة الخلفية */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center font-black text-2xl tracking-tighter mb-16">
            <span className="text-cyan-400">V</span><span className="text-white">elora</span>
          </Link>

          <h2 className="text-6xl font-black leading-[1.1] mb-8 tracking-tight">
            Propulsez votre <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">business au sommet.</span>
          </h2>

          <div className="space-y-8 mt-16">
            {[
              { title: "Facturation Illimitée", desc: "Émettez autant de factures que nécessaire." },
              { title: "Intelligence Fiscale", desc: "Rapports automatisés conformes." },
              { title: "Gestion 360°", desc: "Clients, stocks et paiements au même endroit." }
            ].map((feature, i) => (
              <div key={i} className="flex gap-5 items-start group">
                <div className="mt-1 bg-zinc-900 border border-zinc-800 p-2 rounded-xl group-hover:border-cyan-500/50 transition-colors">
                  <CheckCircle2 size={22} className="text-cyan-500" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-zinc-100">{feature.title}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* شهادة عميل */}
        <div className="relative z-10 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] backdrop-blur-md">
          <div className="flex gap-1 mb-4 text-cyan-400">
             {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
          </div>
          <p className="text-zinc-300 text-lg italic leading-relaxed">
            "L'interface est d'une clarté incroyable. Nous avons réduit notre temps de gestion de 40%."
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center font-black text-black">HS</div>
            <div>
              <p className="font-bold text-white">Hamza Sekmane</p>
              <p className="text-[10px] text-cyan-400 tracking-widest uppercase font-black">CEO @ Sekmane Solutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* القسم الأيمن: النموذج - تم تغيير bg-white إلى bg-[#020617] */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-[#020617]">
        <div className="max-w-[480px] w-full">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Prêt à démarrer ?</h1>
            <p className="text-zinc-500 text-lg">Inscrivez votre entreprise en moins de 2 minutes.</p>
          </div>

          <Suspense fallback={<div className="animate-pulse h-96 bg-zinc-900/50 rounded-2xl" />}>
            <RegisterForm />
          </Suspense>

          <div className="mt-10 pt-8 border-t border-zinc-900/50 text-center">
             <p className="text-zinc-500 text-sm">
                Déjà un compte ? <Link href="/login" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">Se connecter</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}