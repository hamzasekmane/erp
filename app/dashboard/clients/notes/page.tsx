import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Plus, 
  Search,
  Filter,
  Pin,
  AlertCircle,
  RefreshCw,
  XCircle
} from "lucide-react";
import { clientNoteService } from "@/app/services/clientNoteService";
import NoteCard from "@/app/components/Client/NoteCard";
import SubscriptionExpired from "@/app/components/SubscriptionExpired";

interface SubscriptionError {
  success: false;
  error_code: "SUBSCRIPTION_EXPIRED";
  message: string;
  data: {
    expiredSince: string;
    daysOverdue: number;
  };
}

const IS_DEV = process.env.NODE_ENV === "development";

export default async function ClientNotesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) redirect("/login");

  try {
    const response = await clientNoteService.getAllNotes(token);
    const notes = response.data || [];

    return <NotesList notes={notes} />;
  } catch (error: any) {
    // 🔍 DEBUG: Log the full error structure
    if (IS_DEV) {
      console.log("🔍 FULL ERROR OBJECT START ==================");
      console.log("🔍 ERROR TYPE:", typeof error);
      console.log("🔍 ERROR IS NULL?:", error === null);
      console.log("🔍 ERROR IS UNDEFINED?:", error === undefined);
      console.log("🔍 ERROR CONSTRUCTOR:", error?.constructor?.name);
      console.log("🔍 ERROR KEYS:", Object.keys(error || {}));
      console.log("🔍 ERROR STATUS:", error?.status);
      console.log("🔍 ERROR_CODE:", error?.error_code);
      console.log("🔍 ERROR MESSAGE:", error?.message);
      console.log("🔍 ERROR DATA:", error?.data);
      console.log("🔍 ERROR RESPONSE:", error?.response);
      console.log("🔍 FULL ERROR OBJECT:", JSON.stringify(error, null, 2));
      console.log("🔍 FULL ERROR OBJECT END ==================");
    }
    
    // Check for 403 errors (subscription expired)
    if (error?.status === 403) {
      return (
        <SubscriptionExpired
          error={{
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: error.message || "باقة الاشتراك منتهية، يرجى التجديد لاستعادة الصلاحيات",
            data: error.data || {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0,
            },
          }}
        />
      );
    }

    // Check if error has error_code property
    if (error?.error_code === "SUBSCRIPTION_EXPIRED") {
      return (
        <SubscriptionExpired
          error={{
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: error.message || "باقة الاشتراك منتهية، يرجى التجديد لاستعادة الصلاحيات",
            data: error.data || {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0,
            },
          }}
        />
      );
    }

    // Check nested response
    if (error?.response?.error_code === "SUBSCRIPTION_EXPIRED") {
      return (
        <SubscriptionExpired
          error={{
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: error.response.message || "باقة الاشتراك منتهية",
            data: error.response.data || {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0,
            },
          }}
        />
      );
    }

    // If error has data property with error_code
    if (error?.data?.error_code === "SUBSCRIPTION_EXPIRED") {
      return (
        <SubscriptionExpired
          error={{
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: error.data.message || "باقة الاشتراك منتهية",
            data: error.data.data || {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0,
            },
          }}
        />
      );
    }

    // Check for any 403 status anywhere in the error object
    if (error?.status === 403 || error?.response?.status === 403 || error?.data?.status === 403) {
      return (
        <SubscriptionExpired
          error={{
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: "باقة الاشتراك منتهية، يرجى التجديد لاستعادة الصلاحيات",
            data: {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0,
            },
          }}
        />
      );
    }

    // Log only unexpected errors
    if (IS_DEV) console.error("❌ Erreur lors du chargement des notes:", error);

    return <ErrorState />;
  }
}

/* ------------------------------------------------ */
/* Notes List */
/* ------------------------------------------------ */

function NotesList({ notes }: { notes: any[] }) {
  const pinnedNotes = notes.filter((note) => note.isPinned);
  const otherNotes = notes.filter((note) => !note.isPinned);

  return (
    <div className="relative min-h-screen bg-[#020617] text-white p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* ===== EN-TÊTE ===== */}
      <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl border border-white/10 backdrop-blur-sm">
              <FileText size={28} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
                Notes
                <span className="text-amber-400 ml-2">Clients</span>
              </h1>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                Suivi et observations par client • {notes.length} note{notes.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Statistiques rapides */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                {notes.length} note{notes.length > 1 ? 's' : ''}
              </span>
            </div>
            {pinnedNotes.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <Pin size={10} className="text-amber-400" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  {pinnedNotes.length} épinglée{pinnedNotes.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Link
            href="/dashboard/clients/notes/new"
            className="group relative flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-[0.1em] shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 hover:scale-95 active:scale-90 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            <Plus size={16} strokeWidth={3} className="relative z-10" />
            <span className="relative z-10">Nouvelle note</span>
          </Link>
        </div>
      </div>

      {/* ===== BARRE DE RECHERCHE ===== */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-25"></div>
        <div className="relative flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2">
          <div className="flex-1 flex items-center gap-2 px-4">
            <Search size={18} className="text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher dans les notes..."
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-zinc-600 text-sm"
            />
          </div>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <Filter size={18} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* ===== NOTES ÉPINGLÉES ===== */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Pin size={16} className="text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">Épinglées</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note: any) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* ===== TOUTES LES NOTES ===== */}
      {otherNotes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400 px-2">Toutes les notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherNotes.map((note: any) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* ===== ÉTAT VIDE ===== */}
      {notes.length === 0 && <EmptyState />}
    </div>
  );
}

/* ------------------------------------------------ */
/* Empty State */
/* ------------------------------------------------ */

function EmptyState() {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white/5 rounded-full">
          <FileText size={48} className="text-zinc-500" />
        </div>
        <h3 className="text-lg font-black text-white">Aucune note</h3>
        <p className="text-sm text-zinc-400 max-w-md">
          Commencez par créer votre première note client pour suivre vos interactions et observations.
        </p>
        <Link
          href="/dashboard/clients/notes/new"
          className="mt-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:scale-95 transition-all"
        >
          <Plus size={14} className="inline mr-2" />
          Créer une note
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------ */
/* Error State */
/* ------------------------------------------------ */

function ErrorState() {
  return (
    <div className="relative min-h-screen bg-[#020617] text-white p-4 md:p-8 flex items-center justify-center">
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-12 text-center max-w-md">
        <XCircle size={48} className="text-rose-400 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">Erreur de chargement</h1>
        <p className="text-zinc-400 mb-6">
          Impossible de charger les notes. Veuillez réessayer plus tard.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
          >
            Retour aux clients
          </Link>
          <Link
            href="/dashboard/clients/notes"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-white/10"
          >
            <RefreshCw size={14} />
            Réessayer
          </Link>
        </div>
      </div>
    </div>
  );
}