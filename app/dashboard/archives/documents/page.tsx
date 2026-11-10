import { Metadata } from "next";
import { serverApi } from "@/app/lib/serverApi";
import Link from "next/link";
import {
  ArrowLeft,
  FolderArchive,
  Search,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Filter,
  File,
  FileText,
  FileImage,
  FileArchive,
  Calendar
} from "lucide-react";

export const metadata: Metadata = {
  title: "Velora ERP | Documents archivés",
  description: "Consultez et gérez vos documents archivés",
};

interface ArchivedDocument {
  id: string;
  name: string;
  type: "pdf" | "image" | "archive" | "other";
  size: string;
  category: string;
  archivedDate: string;
  expiryDate: string;
  status: "archived" | "pending_deletion";
}

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText size={16} className="text-red-500" />;
    case "image":
      return <FileImage size={16} className="text-blue-500" />;
    case "archive":
      return <FileArchive size={16} className="text-amber-500" />;
    default:
      return <File size={16} className="text-gray-500" />;
  }
};


const CATEGORY_LABELS: Record<string, string> = {
  invoice: "Factures",
  client: "Clients",
  product: "Produits",
  hr: "RH",
  contract: "Contrats",
  other: "Autres",
};

interface ArchivedDocumentRow {
  id: string;
  name: string;
  category: string;
  mime?: string | null;
  size?: number;
  createdAt?: string;
}

function formatSize(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fileType(mime?: string | null): ArchivedDocument["type"] {
  if (!mime) return "other";
  if (mime.includes("pdf")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.includes("zip") || mime.includes("compressed")) return "archive";
  return "other";
}

async function loadDocuments(): Promise<ArchivedDocument[]> {
  const rows = await serverApi<ArchivedDocumentRow[]>("/archives/documents?limit=100");
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: fileType(row.mime),
    size: formatSize(Number(row.size ?? 0)),
    category: CATEGORY_LABELS[row.category] ?? "Autres",
    archivedDate: (row.createdAt ?? "").slice(0, 10),
    expiryDate: "",
    status: "archived" as const,
  }));
}

export default async function ArchivedDocumentsPage() {
  const archivedDocuments = await loadDocuments();

  const totalSize = archivedDocuments.reduce((total, doc) => {
    const sizeInMB = parseFloat(doc.size);
    return total + sizeInMB;
  }, 0);

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/archives"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl">
              <FolderArchive size={20} className="text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                  VELORA • ARCHIVES
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Documents <span className="text-amber-500">archivés</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Gérez vos documents et fichiers historiques
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center gap-2">
            <Download size={14} />
            Exporter tout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Total documents</p>
          <p className="text-2xl font-black text-amber-500">{archivedDocuments.length}</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Espace total</p>
          <p className="text-2xl font-black text-emerald-500">{totalSize.toFixed(1)} MB</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Catégories</p>
          <p className="text-2xl font-black text-blue-500">
            {new Set(archivedDocuments.map(d => d.category)).size}
          </p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">À supprimer</p>
          <p className="text-2xl font-black text-red-500">
            {archivedDocuments.filter(d => d.status === "pending_deletion").length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button className="px-4 py-2 border border-[var(--border)] rounded-xl text-sm flex items-center gap-2 hover:border-amber-500/50 transition-colors">
          <Filter size={14} />
          Filtres
        </button>
        <button className="px-4 py-2 border border-[var(--border)] rounded-xl text-sm flex items-center gap-2 hover:border-amber-500/50 transition-colors">
          <Calendar size={14} />
          Date
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {archivedDocuments.map((doc) => (
          <div key={doc.id} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:border-amber-500/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                {getFileIcon(doc.type)}
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full ${
                doc.status === "archived" 
                  ? "bg-gray-500/20 text-gray-500" 
                  : "bg-red-500/20 text-red-500"
              }`}>
                {doc.status === "archived" ? "Archivé" : "À supprimer"}
              </span>
            </div>
            
            <h3 className="text-sm font-black mb-1 truncate">{doc.name}</h3>
            
            <div className="space-y-1 mt-3">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--foreground-muted)]">Taille:</span>
                <span className="font-medium">{doc.size}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--foreground-muted)]">Catégorie:</span>
                <span className="font-medium">{doc.category}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--foreground-muted)]">Archivé le:</span>
                <span className="font-medium">{doc.archivedDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--foreground-muted)]">Expire le:</span>
                <span className="font-medium text-amber-500">{doc.expiryDate}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border)]">
              <button className="flex-1 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1">
                <Eye size={12} />
                Voir
              </button>
              <button className="flex-1 px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                <Download size={12} />
                Télécharger
              </button>
              <button className="px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}