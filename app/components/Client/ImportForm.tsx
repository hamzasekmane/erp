"use client";

import { apiBaseUrl } from "@/app/lib/apiBase";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Upload, 
  Download, 
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { clientImportService } from "@/app/services/clientImportService";
import { importClientsAction } from "@/app/actions/clientImportActions";

interface ImportFormProps {
  token: string;
}

export default function ImportForm({ token }: ImportFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [options, setOptions] = useState({
    updateExisting: true,
    skipDuplicates: false,
    sendNotifications: false,
  });

  /**
   * Gère la sélection d'un fichier et sa validation
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const result = await clientImportService.validateFile(selectedFile, token);
      setValidationResult(result);
      
      if (result.valid) {
        toast.success("Fichier valide ! Prêt pour l'import.");
      } else {
        toast.error(`${result.errors.length} erreur(s) détectée(s)`);
      }
    } catch (error) {
      console.error("❌ Erreur validation:", error);
      toast.error("Erreur lors de la validation du fichier");
      setValidationResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Télécharge le modèle Excel - Version avec secours
   */
  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    
    // ✅ Solution 1: Utiliser le service (si disponible)
    try {
      if (clientImportService.downloadTemplate) {
        console.log("📦 Utilisation de downloadTemplate");
        const result = await clientImportService.downloadTemplate(token);
        
        if (result.success) {
          toast.success("Téléchargement du modèle démarré");
          setIsDownloading(false);
          return;
        } else {
          console.warn("⚠️ downloadTemplate a échoué, utilisation de la solution de secours");
        }
      } else {
        console.warn("⚠️ downloadTemplate non disponible, utilisation de la solution de secours");
      }
    } catch (serviceError) {
      console.warn("⚠️ Erreur avec downloadTemplate:", serviceError);
    }

    // ✅ Solution 2: Solution de secours avec fetch direct
    try {
      console.log("📡 Utilisation de la solution de secours");
      const API_URL = apiBaseUrl();
      const url = `${API_URL}/clients/import/template`;
      
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Erreur lors du téléchargement" }));
        throw new Error(error.message || "Erreur lors du téléchargement");
      }

      // Récupérer le nom du fichier
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "modele_clients.xlsx";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Téléchargement du modèle démarré");
    } catch (error) {
      console.error("❌ Erreur téléchargement:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Lance l'importation des clients
   */
  const handleImport = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    if (validationResult && !validationResult.valid) {
      toast.error("Le fichier contient des erreurs. Corrigez-les avant d'importer.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("updateExisting", String(options.updateExisting));
      formData.append("skipDuplicates", String(options.skipDuplicates));
      formData.append("sendNotifications", String(options.sendNotifications));

      const result = await importClientsAction(formData);

      if (result.success) {
        toast.success(
          `Import terminé : ${result.stats?.created || 0} créés, ${result.stats?.updated || 0} mis à jour`
        );
        
        // Réinitialiser le formulaire
        setFile(null);
        setValidationResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'import");
      }
    } catch (error) {
      console.error("❌ Erreur import:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Annule et retourne à la liste des clients
   */
  const handleCancel = () => {
    router.push("/dashboard/clients");
  };

  return (
    <div className="space-y-8">
      
      {/* ===== SECTION TÉLÉCHARGEMENT MODÈLE ===== */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-8">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl">
            <FileSpreadsheet size={32} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white mb-2">Télécharger le modèle</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Utilisez notre fichier modèle pour préparer vos données. Il contient toutes les colonnes nécessaires avec des exemples.
            </p>
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {isDownloading ? "Téléchargement..." : "Télécharger modèle Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* ===== SECTION UPLOAD ===== */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-8">
        <h2 className="text-xl font-black text-white mb-6">1. Sélectionner un fichier</h2>
        
        {/* Zone de dépôt de fichier */}
        <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors group ${
          validationResult?.valid 
            ? 'border-emerald-500/30 bg-emerald-500/5' 
            : validationResult && !validationResult.valid
            ? 'border-rose-500/30 bg-rose-500/5'
            : 'border-white/10 hover:border-emerald-500/30'
        }`}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            id="file-upload"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            {isLoading ? (
              <div className="p-4 bg-white/5 rounded-full">
                <Loader2 size={32} className="text-emerald-400 animate-spin" />
              </div>
            ) : file ? (
              <div className="p-4 bg-emerald-500/10 rounded-full">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                <Upload size={32} className="text-zinc-400 group-hover:text-emerald-400" />
              </div>
            )}
            
            <div>
              {file ? (
                <p className="text-lg font-bold text-emerald-400 mb-1">{file.name}</p>
              ) : (
                <p className="text-lg font-bold text-white mb-1">
                  Cliquez pour sélectionner un fichier
                </p>
              )}
              <p className="text-sm text-zinc-500">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "ou glissez-déposez votre fichier ici"}
              </p>
            </div>
            <p className="text-xs text-zinc-600 mt-4">
              Formats supportés: .xlsx, .xls, .csv (max 10MB)
            </p>
          </label>
        </div>

        {/* Résultat de validation */}
        {validationResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                {validationResult.valid ? (
                  <CheckCircle2 size={20} className="text-emerald-400" />
                ) : (
                  <XCircle size={20} className="text-rose-400" />
                )}
                <div>
                  <p className="text-sm font-bold text-white">
                    {validationResult.valid ? "Fichier valide" : "Erreurs détectées"}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {validationResult.totalRows} ligne(s) • 
                    {validationResult.validRows} valide(s) • 
                    {validationResult.invalidRows} invalide(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Aperçu des erreurs */}
            {validationResult.errors && validationResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                {validationResult.errors.slice(0, 5).map((err: any, idx: number) => (
                  <div key={idx} className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs">
                    <span className="font-bold text-rose-400">Ligne {err.row}:</span>
                    <span className="text-zinc-300 ml-2">{err.message}</span>
                  </div>
                ))}
                {validationResult.errors.length > 5 && (
                  <p className="text-xs text-zinc-500 text-center pt-2">
                    ... et {validationResult.errors.length - 5} autre(s) erreur(s)
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== SECTION CONFIGURATION ===== */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-8">
        <h2 className="text-xl font-black text-white mb-6">2. Options d'importation</h2>
        
        <div className="space-y-4">
          {/* Option: Mise à jour des existants */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="text-sm font-bold text-white">Mettre à jour les clients existants</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Si un client avec le même code existe, ses informations seront mises à jour
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={options.updateExisting}
                onChange={(e) => setOptions({ ...options, updateExisting: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </label>
          </div>

          {/* Option: Ignorer les doublons */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="text-sm font-bold text-white">Ignorer les doublons</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Les clients avec des codes déjà existants seront ignorés
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={options.skipDuplicates}
                onChange={(e) => setOptions({ ...options, skipDuplicates: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </label>
          </div>

          {/* Option: Envoyer des notifications */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="text-sm font-bold text-white">Envoyer des notifications</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Envoyer un email de bienvenue aux nouveaux clients
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={options.sendNotifications}
                onChange={(e) => setOptions({ ...options, sendNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ===== APERÇU DES DONNÉES ===== */}
      {validationResult?.preview && validationResult.preview.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-8">
          <h2 className="text-xl font-black text-white mb-6">3. Aperçu des données</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-zinc-400 border-b border-white/10">
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Nom</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Téléphone</th>
                  <th className="pb-3">Ville</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {validationResult.preview.slice(0, 5).map((row: any, idx: number) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="py-3">{row.code || '-'}</td>
                    <td className="py-3">{row.name || '-'}</td>
                    <td className="py-3">{row.type || '-'}</td>
                    <td className="py-3">{row.email || '-'}</td>
                    <td className="py-3">{row.phone || row.mobile || '-'}</td>
                    <td className="py-3">{row.city || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <Info size={14} className="text-emerald-400" />
            <span>Affichage des 5 premières lignes sur {validationResult.totalRows}</span>
          </div>
        </div>
      )}

      {/* ===== BOUTONS D'ACTION ===== */}
      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleImport}
          disabled={!file || isUploading || (validationResult && !validationResult.valid)}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20"
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Upload size={18} />
          )}
          {isUploading ? "Importation en cours..." : "Importer les clients"}
        </button>
        
        <button
          onClick={handleCancel}
          className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-xs tracking-widest text-zinc-400 hover:text-white transition-all border border-white/10 hover:border-white/20 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Annuler
        </button>
      </div>
    </div>
  );
}