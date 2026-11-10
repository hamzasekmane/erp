// app/dashboard/services/email/page.tsx
"use client";

import { useState } from "react";
import { 
  Mail, 
  Send, 
  Settings, 
  Shield, 
  Server, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Save,
  TestTube,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: 587,
    user: "",
    password: "",
    from: "",
    encryption: "tls"
  });
  const [testEmail, setTestEmail] = useState("");

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Appel API pour sauvegarder la configuration SMTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configuration SMTP sauvegardée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast.error("Veuillez entrer une adresse email de test");
      return;
    }
    
    setLoading(true);
    try {
      // TODO: Appel API pour tester la configuration
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Email de test envoyé à ${testEmail}`);
    } catch (error) {
      toast.error("Erreur d'envoi du test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <Mail className="text-cyan-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Configuration Email
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Gérez les paramètres d'envoi d'emails
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3">
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
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-500">Configuration SMTP requise</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Actuellement en mode démo. Aucun email réel ne sera envoyé tant que vous n'avez pas configuré vos paramètres SMTP.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SMTP Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Serveur SMTP</h3>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Hôte SMTP</label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Port</label>
                  <select
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={465}>465 (SSL)</option>
                    <option value={587}>587 (TLS)</option>
                    <option value={2525}>2525</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Chiffrement</label>
                  <select
                    value={smtpConfig.encryption}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, encryption: e.target.value })}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  >
                    <option value="none">Aucun</option>
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Authentification</h3>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nom d'utilisateur / Email</label>
                <input
                  type="email"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email expéditeur</label>
                <input
                  type="email"
                  value={smtpConfig.from}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                  placeholder="noreply@votreentreprise.com"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
                <p className="text-[10px] text-zinc-500 mt-1">L'adresse qui apparaîtra comme expéditeur des emails</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Test & Info */}
        <div className="space-y-6">
          {/* Test Email */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Email de test</h3>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Adresse de test</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              <button
                onClick={handleTest}
                disabled={loading || !testEmail}
                className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
              >
                Envoyer un email de test
              </button>
              <p className="text-[10px] text-zinc-500 text-center">
                Un email de test sera envoyé pour vérifier la configuration
              </p>
            </div>
          </div>

          {/* SMTP Info */}
          <div className="bg-cyan-500/5 rounded-2xl border border-cyan-500/20 p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Settings size={16} className="text-cyan-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-cyan-500">Configuration recommandée</h4>
                <div className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <p className="font-mono text-[10px]">Gmail: smtp.gmail.com:587 (TLS)</p>
                  <p className="font-mono text-[10px]">Outlook: smtp.office365.com:587</p>
                  <p className="font-mono text-[10px]">SendGrid: smtp.sendgrid.net:587</p>
                  <p className="font-mono text-[10px]">Mailgun: smtp.mailgun.org:587</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variables d'environnement */}
      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Copy size={14} className="text-zinc-500" />
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Variables d'environnement</h4>
        </div>
        <div className="space-y-2">
          <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2 rounded-lg">
            SMTP_HOST={smtpConfig.host || "votre-smtp.com"}
          </code>
          <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2 rounded-lg">
            SMTP_PORT={smtpConfig.port}
          </code>
          <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2 rounded-lg">
            SMTP_USER={smtpConfig.user || "votre-email@example.com"}
          </code>
          <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2 rounded-lg">
            SMTP_FROM={smtpConfig.from || "noreply@votreentreprise.com"}
          </code>
        </div>
      </div>
    </div>
  );
}