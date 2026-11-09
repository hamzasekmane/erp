import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Save,
  Trash2
} from "lucide-react";
import { EditApiKeyForm } from "../../EditApiKeyForm";

export const metadata: Metadata = {
  title: "Velora ERP | Modifier clé API",
  description: "Modifiez votre clé API",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditApiKeyPage({ params }: PageProps) {
  const { id } = params;

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/settings/api/${id}`}
          className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
        >
          <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
        </Link>
        <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 rounded-xl">
          <Key size={20} className="text-indigo-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
              VELORA • API
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
            Modifier la <span className="text-indigo-500">clé API</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Modifiez les paramètres de votre clé API
          </p>
        </div>
      </div>

      {/* Form */}
      <EditApiKeyForm apiKeyId={id} />
    </div>
  );
}