import { cookies } from "next/headers";
import { clientService } from "@/app/services/clientService";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, Edit, Phone, Mail, MapPin, 
  TrendingUp, Wallet, FileText, Activity, User,
  Building2, Calendar, Hash, Tag
} from "lucide-react";
import InvoicesTable from "@/app/components/invoices/InvoicesTable";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  const data = await clientService.getFullDetails(id, token);
  const invoicesData = await clientService.getClientInvoices(id, token);

  if (!data || !data.profile) redirect("/dashboard/clients");

  const { profile, stats } = data;
  const invoices = invoicesData?.data || [];

  // Formatage de la date de création
  const createdDate = profile.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Date inconnue';

  // Helper function to format address
  const formatAddress = (address: any): string => {
    if (!address) return "Non spécifié";
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.postalCode) parts.push(address.postalCode);
      if (address.country) parts.push(address.country);
      return parts.length > 0 ? parts.join(', ') : "Non spécifié";
    }
    return "Non spécifié";
  };

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Barre supérieure - Navigation et actions */}
      <div className="relative flex justify-between items-center px-2">
        <nav className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
          <Link href="/dashboard/clients" className="hover:text-[var(--accent)] transition-colors font-medium">Clients</Link>
          <ChevronLeft size={14} className="rotate-180 text-[var(--foreground-muted)]/40" />
          <span className="font-bold text-[var(--foreground)]">{profile.name}</span>
        </nav>
        <Link 
          href={`/dashboard/clients/edit/${id}`} 
          className="bg-gradient-to-r from-[var(--accent)] to-blue-600 hover:from-[var(--accent-dark)] hover:to-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-xl shadow-[var(--accent)]/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Edit size={14} /> Modifier
        </Link>
      </div>

      {/* Carte d'identité principale */}
      <div className="relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md rounded-[3rem] border border-[var(--border)] p-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full -translate-x-16 -translate-y-16" />
        
        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
          {/* Avatar avec initiales */}
          <div className="w-28 h-28 bg-gradient-to-br from-[var(--accent)] to-blue-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shrink-0 shadow-xl shadow-[var(--accent)]/20">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 space-y-6 w-full">
            {/* En-tête avec nom et badges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight uppercase">{profile.name}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="bg-[var(--card-bg)] text-[var(--foreground-muted)] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-[var(--border)] flex items-center gap-1">
                    <Hash size={10} className="text-[var(--accent)]" />
                    {profile.code}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border flex items-center gap-1 ${
                    profile.type === 'company' 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  }`}>
                    {profile.type === 'company' ? <Building2 size={10} /> : <User size={10} />}
                    {profile.type === 'company' ? 'ENTREPRISE' : 'PARTICULIER'}
                  </span>
                  {profile.category && (
                    <span className="bg-[var(--card-bg)] text-[var(--foreground-muted)] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-[var(--border)] flex items-center gap-1">
                      <Tag size={10} className="text-[var(--accent)]" />
                      {profile.category}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Date de création */}
              <div className="flex items-center gap-2 text-[var(--foreground-muted)] text-[10px] font-black uppercase tracking-wider">
                <Calendar size={12} className="text-[var(--accent)]" />
                Client depuis le {createdDate}
              </div>
            </div>

            {/* Coordonnées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center gap-3 text-[var(--foreground-muted)]">
                <div className="p-2 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]">
                  <Phone size={16} className="text-[var(--accent)]"/>
                </div>
                <span className="font-bold text-sm text-[var(--foreground)]">{profile.phone || profile.mobile || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--foreground-muted)]">
                <div className="p-2 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]">
                  <Mail size={16} className="text-[var(--accent)]"/>
                </div>
                <span className="font-bold text-sm underline decoration-white/10 underline-offset-4 text-[var(--foreground)]">
                  {profile.email || "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[var(--foreground-muted)]">
                <div className="p-2 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]">
                  <MapPin size={16} className="text-[var(--accent)]"/>
                </div>
                <span className="font-bold text-sm text-[var(--foreground)]">{formatAddress(profile.address)}</span>
              </div>
            </div>

            {/* Informations fiscales si disponibles */}
            {(profile.taxNumber || profile.commercialRegistration) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                {profile.taxNumber && (
                  <div className="flex items-center gap-3 text-[var(--foreground-muted)]">
                    <span className="text-[10px] font-black uppercase tracking-wider">NIF:</span>
                    <span className="text-sm font-bold text-[var(--foreground)]">{profile.taxNumber}</span>
                  </div>
                )}
                {profile.commercialRegistration && (
                  <div className="flex items-center gap-3 text-[var(--foreground-muted)]">
                    <span className="text-[10px] font-black uppercase tracking-wider">RC:</span>
                    <span className="text-sm font-bold text-[var(--foreground)]">{profile.commercialRegistration}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tableau de bord des indicateurs financiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-6 rounded-[2rem] border border-[var(--border)]">
          <p className="text-[var(--foreground-muted)] text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <Wallet size={14} className="text-[var(--accent)]"/> Solde
          </p>
          <h3 className={`text-2xl font-black ${
            (profile.balance || 0) > 0 
              ? 'text-rose-400' 
              : (profile.balance || 0) < 0 
                ? 'text-emerald-400' 
                : 'text-[var(--foreground)]'
          }`}>
            {Math.abs(profile.balance || 0).toLocaleString()} 
            <span className="text-xs ml-1 text-[var(--foreground-muted)]">DA</span>
          </h3>
        </div>

        {/* Total Achats */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-6 rounded-[2rem] border border-[var(--border)]">
          <p className="text-[var(--foreground-muted)] text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400"/> Total Achats
          </p>
          <h3 className="text-2xl font-black text-[var(--foreground)]">
            {(stats?.totalSpent || 0).toLocaleString()} 
            <span className="text-xs ml-1 text-[var(--foreground-muted)]">DA</span>
          </h3>
        </div>

        {/* Nombre de factures */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-6 rounded-[2rem] border border-[var(--border)]">
          <p className="text-[var(--foreground-muted)] text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <FileText size={14} className="text-[var(--accent)]"/> Factures
          </p>
          <h3 className="text-2xl font-black text-[var(--foreground)]">
            {invoices.length} <span className="text-xs ml-1 text-[var(--foreground-muted)]">documents</span>
          </h3>
        </div>

        {/* Statut */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-6 rounded-[2rem] border border-[var(--border)]">
          <p className="text-[var(--foreground-muted)] text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity size={14} className="text-purple-400"/> Statut
          </p>
          <span className={`px-3 py-1 rounded-lg text-xs font-black inline-block ${
            profile.isActive === false 
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          }`}>
            {profile.isActive === false ? 'Inactif' : 'Actif'}
          </span>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight">Historique des transactions</h2>
          <button className="text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors border border-[var(--accent)]/30 px-4 py-2 rounded-xl hover:bg-[var(--accent)]/10">
            Télécharger PDF
          </button>
        </div>
        
        {invoices.length > 0 ? (
          <InvoicesTable 
            invoices={invoices} 
            showClient={false}
            showStatus={true}
            showDate={true}
            showActions={true}
          />
        ) : (
          <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[2rem] p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-[var(--card-bg)] rounded-full border border-[var(--border)]">
                <FileText size={48} className="text-[var(--foreground-muted)]" strokeWidth={1} />
              </div>
              <p className="text-[var(--foreground-muted)] font-black uppercase tracking-widest text-sm">
                Aucune transaction
              </p>
              <p className="text-[10px] text-[var(--foreground-muted)]/60 max-w-md">
                Ce client n'a pas encore de factures. Créez une nouvelle facture pour commencer.
              </p>
              <Link
                href={`/dashboard/invoices/new?clientId=${id}`}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-95 transition-all"
              >
                Créer une facture
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}