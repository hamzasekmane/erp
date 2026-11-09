// frontend/app/dashboard/services/sms/page.tsx
"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  Settings, 
  Shield, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  TestTube,
  Loader2,
  Users,
  Clock,
  BarChart3,
  Phone,
  Plus,
  Trash2,
  Copy,
  Download,
  History
} from "lucide-react";
import toast from "react-hot-toast";

export default function SmsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<"configuration" | "templates" | "history">("configuration");
  const [smsConfig, setSmsConfig] = useState({
    provider: "twilio",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    messagingServiceSid: "",
    apiKey: "",
    apiSecret: ""
  });
  
  const [testData, setTestData] = useState({
    phoneNumber: "",
    message: "Test de connexion SMS depuis Velora ERP"
  });
  
  const [templates, setTemplates] = useState([
    { id: "1", name: "Facture envoyée", content: "Votre facture #{invoice_number} a été envoyée. Montant: #{amount} DA", active: true },
    { id: "2", name: "Rappel de paiement", content: "Rappel: Facture #{invoice_number} arrive à échéance le #{due_date}", active: true },
    { id: "3", name: "Confirmation client", content: "Merci pour votre paiement de #{amount} DA. Facture #{invoice_number}", active: false }
  ]);
  
  const [history, setHistory] = useState([
    { id: "1", to: "+213555123456", message: "Votre facture INV-2024-001 a été envoyée", status: "sent", date: "2024-03-28T10:30:00", cost: 0.05 },
    { id: "2", to: "+213555789012", message: "Rappel: Facture INV-2024-002 arrive à échéance", status: "delivered", date: "2024-03-27T15:20:00", cost: 0.05 },
    { id: "3", to: "+213555345678", message: "Merci pour votre paiement", status: "failed", date: "2024-03-26T09:15:00", cost: 0.00 }
  ]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configuration SMS sauvegardée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testData.phoneNumber) {
      toast.error("Veuillez entrer un numéro de téléphone");
      return;
    }
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`SMS de test envoyé à ${testData.phoneNumber}`);
    } catch (error) {
      toast.error("Erreur d'envoi du SMS de test");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">Envoyé</span>;
      case 'delivered':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">Délivré</span>;
      case 'failed':
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full">Échoué</span>;
      default:
        return <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-zinc-500/10 text-zinc-500 rounded-full">Inconnu</span>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <MessageSquare className="text-green-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Configuration SMS
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Gérez l'envoi de SMS pour les notifications et rappels
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <TestTube size={16} />}
            Tester l'envoi
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <MessageSquare size={18} className="text-green-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-green-500">Service SMS disponible</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Configurez votre fournisseur SMS pour envoyer des notifications, rappels de paiement et alertes de stock.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">SMS envoyés</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">1,247</p>
            </div>
            <Send size={20} className="text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Taux de délivrance</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">98.5%</p>
            </div>
            <CheckCircle size={20} className="text-emerald-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Crédit restant</p>
              <p className="text-2xl font-black text-amber-500 mt-1">342</p>
            </div>
            <CreditCard size={20} className="text-amber-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Coût moyen</p>
              <p className="text-2xl font-black text-indigo-500 mt-1">0.05 DA</p>
            </div>
            <BarChart3 size={20} className="text-indigo-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: "configuration", label: "Configuration", icon: Settings },
          { id: "templates", label: "Modèles de SMS", icon: MessageSquare },
          { id: "history", label: "Historique", icon: History }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? "text-green-600 dark:text-green-500"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Configuration Tab */}
        {activeTab === "configuration" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Fournisseur SMS */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Settings size={18} className="text-green-500" />
                    <h3 className="font-bold text-zinc-900 dark:text-white">Fournisseur SMS</h3>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Service</label>
                    <select
                      value={smsConfig.provider}
                      onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                    >
                      <option value="twilio">Twilio</option>
                      <option value="vonage">Vonage (ex-Nexmo)</option>
                      <option value="messagebird">MessageBird</option>
                      <option value="infobip">Infobip</option>
                      <option value="local">Opérateur local (Algérie)</option>
                    </select>
                  </div>

                  {smsConfig.provider === "twilio" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Account SID</label>
                        <input
                          type="text"
                          value={smsConfig.accountSid}
                          onChange={(e) => setSmsConfig({ ...smsConfig, accountSid: e.target.value })}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Auth Token</label>
                        <div className="relative">
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={smsConfig.authToken}
                            onChange={(e) => setSmsConfig({ ...smsConfig, authToken: e.target.value })}
                            placeholder="••••••••••••••••••••••••••••••"
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                          >
                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Numéro d'expéditeur</label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm">+213</span>
                      <input
                        type="tel"
                        value={smsConfig.fromNumber}
                        onChange={(e) => setSmsConfig({ ...smsConfig, fromNumber: e.target.value })}
                        placeholder="5XX XX XX XX"
                        className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">Numéro alphanumérique ou court autorisé</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Test SMS */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <TestTube size={18} className="text-green-500" />
                    <h3 className="font-bold text-zinc-900 dark:text-white">Test d'envoi</h3>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Numéro de test</label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm">+213</span>
                      <input
                        type="tel"
                        value={testData.phoneNumber}
                        onChange={(e) => setTestData({ ...testData, phoneNumber: e.target.value })}
                        placeholder="5XX XX XX XX"
                        className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Message</label>
                    <textarea
                      value={testData.message}
                      onChange={(e) => setTestData({ ...testData, message: e.target.value })}
                      rows={3}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1 text-right">
                      {testData.message.length}/160 caractères
                    </p>
                  </div>
                  <button
                    onClick={handleTest}
                    disabled={loading || !testData.phoneNumber}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Envoyer le SMS de test"}
                  </button>
                </div>
              </div>

              {/* Crédit */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CreditCard size={16} className="text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-green-500">Crédit SMS</h4>
                    <p className="text-2xl font-black text-green-600 mt-1">342 SMS</p>
                    <p className="text-xs text-zinc-500 mt-2">Expire le 31/12/2024</p>
                    <button className="mt-3 text-xs font-bold text-green-600 hover:text-green-700">
                      Recharger →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-zinc-900 dark:text-white">Modèles de SMS</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                <Plus size={14} />
                Nouveau modèle
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">{template.name}</h4>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${template.active ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                        {template.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                        <Copy size={14} className="text-zinc-500" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl font-mono text-xs">
                    {template.content}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-[9px] text-zinc-500">Variables:</span>
                    <code className="text-[9px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">#invoice_number</code>
                    <code className="text-[9px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">#amount</code>
                    <code className="text-[9px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">#due_date</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-zinc-900 dark:text-white">Historique des envois</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-medium">
                <Download size={14} />
                Exporter
              </button>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-5 py-3 text-left text-[10px] font-black text-zinc-500 uppercase">Destinataire</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-zinc-500 uppercase">Message</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-zinc-500 uppercase">Statut</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-zinc-500 uppercase">Date</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-zinc-500 uppercase">Coût</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Phone size={12} className="text-zinc-400" />
                            <span className="text-sm font-mono">{item.to}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-xs">{item.message}</p>
                        </td>
                        <td className="px-5 py-3">{getStatusBadge(item.status)}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-zinc-500">{formatDate(item.date)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-zinc-500">{item.cost.toFixed(2)} DA</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Variables d'environnement */}
      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-zinc-500" />
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Variables d'environnement</h4>
        </div>
        <div className="space-y-2">
          <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2 rounded-lg">
            SMS_PROVIDER={smsConfig.provider || "twilio"}
          </code>
          <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2 rounded-lg">
            SMS_ACCOUNT_SID={smsConfig.accountSid || "VOTRE_ACCOUNT_SID"}
          </code>
          <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2 rounded-lg">
            SMS_AUTH_TOKEN={smsConfig.authToken ? "••••••••••••••••" : "VOTRE_AUTH_TOKEN"}
          </code>
          <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2 rounded-lg">
            SMS_FROM_NUMBER={smsConfig.fromNumber || "+2135XXXXXXXX"}
          </code>
        </div>
      </div>
    </div>
  );
}