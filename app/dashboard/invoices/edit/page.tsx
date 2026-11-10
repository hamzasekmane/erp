import { invoiceService } from "@/app/services/invoice.service";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft, FileEdit, Sparkles, ShieldCheck, History } from "lucide-react";
import InvoiceForm from "@/app/components/invoices/InvoiceForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  // 1. Initialisation des données de session
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // 2. Récupération parallèle pour injecter dans le formulaire
  const [invoiceRes, clientsRes, productsRes] = await Promise.all([
    invoiceService.getInvoiceById(id, token),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/client`, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.json()).catch(() => ({ data: [] })),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/product`, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.json()).catch(() => ({ data: [] })),
  ]);

  const invoice = invoiceRes.data;

  // 3. Cas d'erreur si le document est introuvable
  if (!invoice) {
    return (
      <div className="p-20 text-center space-y-4">
        <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--foreground-muted)]">404 // Introuvable</h2>
        <Link href="/dashboard/invoices" className="text-emerald-500 font-black uppercase text-xs underline">
          Retour au flux principal
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* BARRE DE NAVIGATION SUPÉRIEURE */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/invoices" 
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all font-black uppercase text-[10px] tracking-[0.2em]"
        >
          <ArrowLeft size={16} /> Annuler la modification
        </Link>
        <div className="hidden md:flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/50">
          <Sparkles size={12} /> Mode Révision de Document
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* COLONNE DE CONTEXTE (GAUCHE) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="w-20 h-20 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-amber-500/20 rotate-3">
            <FileEdit size={32} />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl sm:text-5xl font-black italic uppercase tracking-tighter leading-[0.9] text-[var(--foreground)]">
              Réviser la <br /> <span className="text-amber-500">Facture {invoice.invoiceNumber}</span>
            </h1>
            <p className="text-[var(--foreground-muted)] font-bold text-xs uppercase leading-relaxed tracking-tight">
              Toute modification sur un document existant doit être validée avec soin. Les changements impactent directement votre comptabilité analytique.
            </p>
          </div>

          <div className="p-6 rounded-[2rem] bg-[var(--card-bg)] border border-[var(--border)] space-y-4">
            <div className="flex items-center gap-3 text-[var(--foreground)]">
              <History size={20} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Historique Intègre</span>
            </div>
            <p className="text-[9px] text-[var(--foreground-muted)] font-bold uppercase leading-normal">
              Dernière mise à jour : {new Date(invoice.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[var(--card-bg)] text-[var(--foreground-muted)] italic border border-[var(--border)]">
            <ShieldCheck size={16} className="text-amber-400" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Modification Sécurisée SSL</span>
          </div>
        </div>

        {/* COLONNE DU FORMULAIRE (DROITE) - Injection de initialData */}
        <div className="lg:col-span-8">
          <div className="bg-[var(--card-bg)] rounded-[3rem] p-2 border border-[var(--border)] shadow-sm">
            <InvoiceForm 
                initialData={invoice}
                clients={clientsRes.data || []} 
                products={productsRes.data || []} 
                token={token}
            />
          </div>
          
          <p className="mt-8 text-center text-[9px] font-black uppercase text-[var(--foreground-muted)]/60 tracking-[0.3em]">
            Identifiant Unique : {invoice._id} // Système Gemini v3.0
          </p>
        </div>

      </div>
    </div>
  );
}