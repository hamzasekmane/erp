// frontend/app/dashboard/services/notifications/page.tsx
"use client";

import { useState } from "react";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Settings,
  AlertCircle,
  CheckCircle,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Users,
  FileText,
  CreditCard,
  Package,
  TrendingUp,
  Zap,
  Calendar,
  Gift,
  Shield,
  Globe
} from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"channels" | "events" | "templates" | "schedule">("channels");
  const [channels, setChannels] = useState({
    email: { enabled: true, priority: 1, dailyLimit: 100 },
    sms: { enabled: false, priority: 2, dailyLimit: 50 },
    push: { enabled: true, priority: 1, dailyLimit: 500 },
    webhook: { enabled: false, priority: 3, dailyLimit: 1000 }
  });

  const [events, setEvents] = useState([
    { id: "invoice_created", name: "Facture créée", enabled: true, channels: ["email", "push"] },
    { id: "invoice_paid", name: "Facture payée", enabled: true, channels: ["email", "sms", "push"] },
    { id: "invoice_overdue", name: "Facture en retard", enabled: true, channels: ["email", "sms", "push"] },
    { id: "client_created", name: "Nouveau client", enabled: false, channels: ["email"] },
    { id: "product_low_stock", name: "Stock critique", enabled: true, channels: ["email", "sms"] },
    { id: "payment_received", name: "Paiement reçu", enabled: true, channels: ["email", "push"] },
    { id: "subscription_expiring", name: "Abonnement expire", enabled: true, channels: ["email", "sms"] },
    { id: "new_comment", name: "Nouveau commentaire", enabled: false, channels: ["push"] }
  ]);

  const [templates, setTemplates] = useState([
    { 
      id: "1", 
      name: "Facture créée", 
      subject: "Facture #{invoice_number} créée",
      content: "Bonjour, votre facture #{invoice_number} d'un montant de #{amount} DA a été créée.",
      channel: "email",
      active: true 
    },
    { 
      id: "2", 
      name: "Rappel de paiement", 
      subject: "Rappel: Facture #{invoice_number} à échéance",
      content: "Rappel: La facture #{invoice_number} arrive à échéance le #{due_date}. Montant: #{amount} DA",
      channel: "email",
      active: true 
    },
    { 
      id: "3", 
      name: "Stock critique", 
      subject: "Alerte stock: #{product_name}",
      content: "Le stock du produit #{product_name} est critique ({stock} unités restantes).",
      channel: "sms",
      active: true 
    }
  ]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configuration des notifications sauvegardée");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  const toggleChannel = (channel: string) => {
    setChannels({ ...channels, [channel]: { ...channels[channel as keyof typeof channels], enabled: !channels[channel as keyof typeof channels].enabled } });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail size={14} className="text-blue-500" />;
      case 'sms': return <MessageSquare size={14} className="text-green-500" />;
      case 'push': return <Smartphone size={14} className="text-purple-500" />;
      case 'webhook': return <Globe size={14} className="text-orange-500" />;
      default: return <Bell size={14} />;
    }
  };

  const getChannelName = (channel: string) => {
    switch (channel) {
      case 'email': return 'Email';
      case 'sms': return 'SMS';
      case 'push': return 'Push';
      case 'webhook': return 'Webhook';
      default: return channel;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Bell className="text-purple-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Notifications
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Gérez les alertes et communications automatiques
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Sauvegarder
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <Bell size={18} className="text-purple-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-purple-500">Système de notifications</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Configurez comment et quand vous souhaitez recevoir des alertes. Les notifications peuvent être envoyées par email, SMS, push ou webhook.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Notifications aujourd'hui</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">24</p>
            </div>
            <Bell size={20} className="text-purple-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Envoyées</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">1,247</p>
            </div>
            <Mail size={20} className="text-emerald-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Taux d'ouverture</p>
              <p className="text-2xl font-black text-amber-500 mt-1">78%</p>
            </div>
            <TrendingUp size={20} className="text-amber-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase">Canaux actifs</p>
              <p className="text-2xl font-black text-indigo-500 mt-1">
                {Object.values(channels).filter(c => c.enabled).length}
              </p>
            </div>
            <Zap size={20} className="text-indigo-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: "channels", label: "Canaux", icon: Globe },
          { id: "events", label: "Événements", icon: Zap },
          { id: "templates", label: "Modèles", icon: FileText },
          { id: "schedule", label: "Planification", icon: Calendar }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? "text-purple-600 dark:text-purple-500"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Canaux Tab */}
        {activeTab === "channels" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(channels).map(([key, config]) => (
              <div key={key} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        key === 'email' ? 'bg-blue-500/10' : 
                        key === 'sms' ? 'bg-green-500/10' : 
                        key === 'push' ? 'bg-purple-500/10' : 'bg-orange-500/10'
                      }`}>
                        {key === 'email' && <Mail className="text-blue-500" size={20} />}
                        {key === 'sms' && <MessageSquare className="text-green-500" size={20} />}
                        {key === 'push' && <Smartphone className="text-purple-500" size={20} />}
                        {key === 'webhook' && <Globe className="text-orange-500" size={20} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white capitalize">{key}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          {key === 'email' && 'Notifications par courrier électronique'}
                          {key === 'sms' && 'Messages SMS'}
                          {key === 'push' && 'Notifications push'}
                          {key === 'webhook' && 'Appels HTTP externes'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleChannel(key)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        config.enabled ? 'bg-purple-600' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        config.enabled ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Priorité</label>
                    <select
                      value={config.priority}
                      onChange={(e) => setChannels({
                        ...channels,
                        [key]: { ...config, priority: parseInt(e.target.value) }
                      })}
                      className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                    >
                      <option value={1}>Haute</option>
                      <option value={2}>Moyenne</option>
                      <option value={3}>Basse</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Limite quotidienne</label>
                    <input
                      type="number"
                      value={config.dailyLimit}
                      onChange={(e) => setChannels({
                        ...channels,
                        [key]: { ...config, dailyLimit: parseInt(e.target.value) }
                      })}
                      className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Événements Tab */}
        {activeTab === "events" && (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        {event.id.includes('invoice') && <FileText size={16} className="text-purple-500" />}
                        {event.id.includes('client') && <Users size={16} className="text-purple-500" />}
                        {event.id.includes('product') && <Package size={16} className="text-purple-500" />}
                        {event.id.includes('payment') && <CreditCard size={16} className="text-purple-500" />}
                        {event.id.includes('subscription') && <RefreshCw size={16} className="text-purple-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white">{event.name}</h4>
                        <div className="flex gap-2 mt-1">
                          {event.channels.map(ch => (
                            <span key={ch} className="flex items-center gap-1 text-[9px] font-black uppercase text-zinc-500">
                              {getChannelIcon(ch)}
                              {getChannelName(ch)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleEvent(event.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        event.enabled ? 'bg-purple-600' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        event.enabled ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modèles Tab */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-zinc-900 dark:text-white">Modèles de notification</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                <Plus size={14} />
                Nouveau modèle
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-zinc-900 dark:text-white">{template.name}</h4>
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                          {getChannelIcon(template.channel)}
                          {getChannelName(template.channel)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{template.subject}</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                        <RefreshCw size={14} className="text-zinc-500" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl">
                    {template.content}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-[9px] text-zinc-500">Variables disponibles:</span>
                    <code className="text-[9px] text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">#invoice_number</code>
                    <code className="text-[9px] text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">#amount</code>
                    <code className="text-[9px] text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">#client_name</code>
                    <code className="text-[9px] text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">#due_date</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planification Tab */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-purple-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Rappels automatiques</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappel avant échéance</p>
                    <p className="text-xs text-zinc-500">Envoyer un rappel avant la date d'échéance</p>
                  </div>
                  <select className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm">
                    <option>3 jours avant</option>
                    <option>7 jours avant</option>
                    <option>14 jours avant</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappel après échéance</p>
                    <p className="text-xs text-zinc-500">Envoyer un rappel après la date d'échéance</p>
                  </div>
                  <select className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm">
                    <option>1 jour après</option>
                    <option>3 jours après</option>
                    <option>7 jours après</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappel de stock critique</p>
                    <p className="text-xs text-zinc-500">Notification quand le stock est bas</p>
                  </div>
                  <select className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm">
                    <option>Seuil: 10%</option>
                    <option>Seuil: 20%</option>
                    <option>Seuil: 5 unités</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={20} className="text-purple-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Rapports périodiques</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rapport hebdomadaire</p>
                    <p className="text-xs text-zinc-500">Récapitulatif des activités de la semaine</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                    Activer
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rapport mensuel</p>
                    <p className="text-xs text-zinc-500">Synthèse financière mensuelle</p>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                    Actif
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Configuration (si actif) */}
      {channels.webhook.enabled && activeTab === "channels" && (
        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-zinc-500" />
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Webhook Endpoint</h4>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-3 rounded-lg">
              https://api.votre-domaine.com/webhooks/notifications
            </code>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Tester
            </button>
          </div>
          <p className="text-[9px] text-zinc-500 mt-2">
            Les webhooks seront appelés pour chaque notification avec un payload JSON contenant les détails de l'événement.
          </p>
        </div>
      )}
    </div>
  );
}