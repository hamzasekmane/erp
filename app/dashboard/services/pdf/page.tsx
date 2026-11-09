// frontend/app/dashboard/services/pdf/page.tsx
"use client";

import { useState } from "react";
import { 
  FileText, 
  Download, 
  Settings, 
  Palette, 
  Type, 
  Layout,
  Eye,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Printer,
  Mail
} from "lucide-react";
import toast from "react-hot-toast";

export default function PdfSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [template, setTemplate] = useState({
    primaryColor: "#4f46e5",
    secondaryColor: "#06b6d4",
    fontFamily: "Inter",
    fontSize: 12,
    logo: null as string | null,
    showLogo: true,
    showTaxInfo: true,
    showBankInfo: true,
    footerText: "Merci de votre confiance",
    headerAlignment: "center" as "left" | "center" | "right",
    showQRCode: true,
    pageSize: "A4" as "A4" | "A5" | "Letter",
    language: "fr" as "fr" | "ar" | "en"
  });

  const [invoiceNumber, setInvoiceNumber] = useState({
    prefix: "INV",
    suffix: "",
    startNumber: 1,
    padding: 4,
    resetMonthly: false
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Appel API pour sauvegarder la configuration PDF
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configuration PDF sauvegardée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
    toast.success("Aperçu généré");
  };

  const handleUploadLogo = () => {
    // TODO: Implémenter l'upload du logo
    toast.success("Logo uploadé (simulation)");
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <FileText className="text-indigo-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Configuration PDF
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Personnalisez l'apparence de vos documents PDF
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Eye size={16} />
            Aperçu
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <FileText size={18} className="text-blue-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-500">Personnalisation avancée</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Configurez l'apparence de vos factures, devis et autres documents PDF.
              Les modifications s'appliquent à tous les documents générés.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Design */}
        <div className="lg:col-span-2 space-y-6">
          {/* Couleurs et Police */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Apparence</h3>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Couleur principale</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={template.primaryColor}
                      onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={template.primaryColor}
                      onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                      className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Couleur secondaire</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={template.secondaryColor}
                      onChange={(e) => setTemplate({ ...template, secondaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={template.secondaryColor}
                      onChange={(e) => setTemplate({ ...template, secondaryColor: e.target.value })}
                      className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Police</label>
                  <select
                    value={template.fontFamily}
                    onChange={(e) => setTemplate({ ...template, fontFamily: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Roboto">Roboto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Taille de police</label>
                  <input
                    type="number"
                    value={template.fontSize}
                    onChange={(e) => setTemplate({ ...template, fontSize: parseInt(e.target.value) })}
                    min={8}
                    max={16}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Alignement du titre</label>
                <div className="flex gap-2">
                  {[
                    { value: "left", icon: AlignLeft, label: "Gauche" },
                    { value: "center", icon: AlignCenter, label: "Centre" },
                    { value: "right", icon: AlignRight, label: "Droite" }
                  ].map((align) => (
                    <button
                      key={align.value}
                      onClick={() => setTemplate({ ...template, headerAlignment: align.value as any })}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                        template.headerAlignment === align.value
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-600"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <align.icon size={16} />
                      <span className="text-xs font-medium">{align.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Logo et Pied de page */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Image size={18} className="text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Logo et En-tête</h3>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Logo de l'entreprise</label>
                  <p className="text-[10px] text-zinc-400">Format recommandé: PNG, SVG, max 2MB</p>
                </div>
                <button
                  onClick={handleUploadLogo}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium"
                >
                  <Upload size={14} />
                  Importer
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.showLogo}
                    onChange={(e) => setTemplate({ ...template, showLogo: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300"
                  />
                  <span className="text-sm">Afficher le logo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.showQRCode}
                    onChange={(e) => setTemplate({ ...template, showQRCode: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300"
                  />
                  <span className="text-sm">Afficher le QR code de paiement</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Texte de pied de page</label>
                <input
                  type="text"
                  value={template.footerText}
                  onChange={(e) => setTemplate({ ...template, footerText: e.target.value })}
                  placeholder="Merci de votre confiance"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Format & Info */}
        <div className="space-y-6">
          {/* Numérotation des factures */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Type size={18} className="text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Numérotation</h3>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Préfixe</label>
                  <input
                    type="text"
                    value={invoiceNumber.prefix}
                    onChange={(e) => setInvoiceNumber({ ...invoiceNumber, prefix: e.target.value })}
                    placeholder="INV"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Suffixe</label>
                  <input
                    type="text"
                    value={invoiceNumber.suffix}
                    onChange={(e) => setInvoiceNumber({ ...invoiceNumber, suffix: e.target.value })}
                    placeholder="-2024"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Départ</label>
                  <input
                    type="number"
                    value={invoiceNumber.startNumber}
                    onChange={(e) => setInvoiceNumber({ ...invoiceNumber, startNumber: parseInt(e.target.value) })}
                    min={1}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Longueur</label>
                  <input
                    type="number"
                    value={invoiceNumber.padding}
                    onChange={(e) => setInvoiceNumber({ ...invoiceNumber, padding: parseInt(e.target.value) })}
                    min={1}
                    max={10}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoiceNumber.resetMonthly}
                  onChange={(e) => setInvoiceNumber({ ...invoiceNumber, resetMonthly: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm">Réinitialiser chaque mois</span>
              </label>

              <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                <p className="text-[10px] text-zinc-500 mb-1">Aperçu:</p>
                <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                  {invoiceNumber.prefix}{String(invoiceNumber.startNumber).padStart(invoiceNumber.padding, '0')}{invoiceNumber.suffix}
                </code>
              </div>
            </div>
          </div>

          {/* Format et Options */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Layout size={18} className="text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Format</h3>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Format papier</label>
                <select
                  value={template.pageSize}
                  onChange={(e) => setTemplate({ ...template, pageSize: e.target.value as any })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="A5">A5 (148 x 210 mm)</option>
                  <option value="Letter">Letter (216 x 279 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Langue du document</label>
                <select
                  value={template.language}
                  onChange={(e) => setTemplate({ ...template, language: e.target.value as any })}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                >
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.showTaxInfo}
                    onChange={(e) => setTemplate({ ...template, showTaxInfo: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300"
                  />
                  <span className="text-sm">Afficher les informations fiscales</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.showBankInfo}
                    onChange={(e) => setTemplate({ ...template, showBankInfo: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300"
                  />
                  <span className="text-sm">Afficher les coordonnées bancaires</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-indigo-500/5 rounded-2xl border border-indigo-500/20 p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Printer size={16} className="text-indigo-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-500">Actions rapides</h4>
                <div className="mt-3 space-y-2">
                  <button className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 rounded-xl text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <span>Télécharger un exemple</span>
                    <Download size={12} />
                  </button>
                  <button className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 rounded-xl text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <span>Réinitialiser la configuration</span>
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-indigo-500" />
                <h2 className="font-bold text-zinc-900 dark:text-white">Aperçu du PDF</h2>
              </div>
              <button
                onClick={() => setPreviewMode(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 bg-white">
                {/* Aperçu du document */}
                <div className="text-center mb-8">
                  {template.showLogo && (
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">LOGO</span>
                    </div>
                  )}
                  <h1 className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                    FACTURE
                  </h1>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <p className="text-xs text-zinc-500">Émetteur</p>
                    <p className="font-bold">Velora ERP</p>
                    <p className="text-sm">15 Rue Didouche Mourad</p>
                    <p className="text-sm">16000 Alger, Algérie</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Client</p>
                    <p className="font-bold">Client Example</p>
                    <p className="text-sm">client@example.com</p>
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-4">
                  <p className="text-center text-xs text-zinc-400" style={{ color: template.secondaryColor }}>
                    {template.footerText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}