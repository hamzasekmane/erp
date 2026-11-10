'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Lock,
  Key,
  Smartphone,
  Clock,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
  Fingerprint,
  Globe,
  Monitor,
  ChevronRight,
  Activity,
  Bell,
  Download
} from 'lucide-react';

export default function SecuritySettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Active sessions
  const [sessions] = useState([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'Paris, France',
      ip: '192.168.1.1',
      lastActive: '2024-01-20T15:30:00Z',
      isCurrent: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'Lyon, France',
      ip: '192.168.1.2',
      lastActive: '2024-01-19T10:15:00Z',
      isCurrent: false
    },
    {
      id: '3',
      device: 'Firefox on MacBook',
      location: 'Marseille, France',
      ip: '192.168.1.3',
      lastActive: '2024-01-18T08:45:00Z',
      isCurrent: false
    }
  ]);

  // Security logs
  const [securityLogs] = useState([
    {
      id: '1',
      action: 'Connexion réussie',
      details: 'Connexion depuis Chrome sur Windows',
      ip: '192.168.1.1',
      location: 'Paris, France',
      timestamp: '2024-01-20T15:30:00Z',
      status: 'success'
    },
    {
      id: '2',
      action: 'Mot de passe modifié',
      details: 'Changement de mot de passe',
      ip: '192.168.1.1',
      location: 'Paris, France',
      timestamp: '2024-01-15T09:20:00Z',
      status: 'success'
    },
    {
      id: '3',
      action: 'Tentative de connexion échouée',
      details: 'Mot de passe incorrect',
      ip: '185.45.12.34',
      location: 'Unknown',
      timestamp: '2024-01-14T22:15:00Z',
      status: 'failed'
    },
    {
      id: '4',
      action: '2FA activé',
      details: 'Authentification à deux facteurs activée',
      ip: '192.168.1.1',
      location: 'Paris, France',
      timestamp: '2024-01-10T11:30:00Z',
      status: 'success'
    }
  ]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du changement de mot de passe' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setMessage({ type: 'success', text: 'Authentification à deux facteurs activée' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'activation' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ?')) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTwoFactorEnabled(false);
      setMessage({ type: 'success', text: 'Authentification à deux facteurs désactivée' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la désactivation' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette session ?')) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage({ type: 'success', text: 'Session révoquée avec succès' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la révocation' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer toutes les autres sessions ?')) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Toutes les sessions ont été révoquées' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la révocation' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings"
          className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
        >
          <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
        </Link>
        <div className="p-2 bg-gradient-to-br from-rose-500/20 to-rose-500/5 rounded-xl">
          <Shield size={20} className="text-rose-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
              VELORA • SECURITY
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30">
              ● PROTECTION
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
            Sécurité & <span className="text-rose-500">Protection</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Gérez la sécurité de votre compte et protégez vos données
          </p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
            : 'bg-red-500/10 border border-red-500/30 text-red-500'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Security Score */}
      <div className="bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-rose-500/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Shield size={32} className="text-rose-500" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle size={14} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--foreground-muted)]">Score de sécurité</p>
              <p className="text-3xl font-black text-rose-500">92/100</p>
              <p className="text-[10px] text-[var(--foreground-muted)]">Excellent</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-sm hover:bg-rose-500/20 transition-colors">
              Voir recommandations
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Change Password Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Key size={18} className="text-rose-500" />
              </div>
              <h3 className="text-lg font-black">Changer le mot de passe</h3>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-rose-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-rose-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
                  Minimum 8 caractères, incluant lettres, chiffres et symboles
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-rose-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Changement...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Smartphone size={18} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-black">Authentification à deux facteurs</h3>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                twoFactorEnabled ? 'bg-emerald-500' : 'bg-gray-500'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </div>
            
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              Ajoutez une couche de sécurité supplémentaire à votre compte en exigeant un code de vérification à chaque connexion.
            </p>
            
            {!twoFactorEnabled ? (
              <button
                onClick={() => setShow2FASetup(true)}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-xl hover:border-emerald-500/50 transition-colors"
              >
                Activer la 2FA
              </button>
            ) : (
              <button
                onClick={handleDisable2FA}
                className="w-full px-4 py-2 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                Désactiver la 2FA
              </button>
            )}
          </div>

          {/* Login Alerts Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Bell size={18} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-black">Alertes de connexion</h3>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Nouvelles connexions</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Recevoir une alerte pour chaque nouvelle connexion</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Connexions échouées</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Alerte après plusieurs tentatives échouées</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Nouveaux appareils</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Alerte lors de connexion depuis un nouvel appareil</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Active Sessions Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Monitor size={18} className="text-purple-500" />
                </div>
                <h3 className="text-lg font-black">Sessions actives</h3>
              </div>
              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <button
                  onClick={handleRevokeAllSessions}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Révoquer toutes
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="p-3 rounded-xl border border-[var(--border)]">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <Monitor size={16} className="text-[var(--foreground-muted)] mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          {session.device}
                          {session.isCurrent && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                              En cours
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[var(--foreground-muted)]">
                          {session.location} • IP: {session.ip}
                        </p>
                        <p className="text-[10px] text-[var(--foreground-muted)]">
                          Dernière activité: {new Date(session.lastActive).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Logs Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Activity size={18} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-black">Journal de sécurité</h3>
                </div>
                <button className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors">
                  <Download size={16} />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
                  <tr>
                    <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Action</th>
                    <th className="text-left p-4 text-xs font-black uppercase tracking-wider">IP</th>
                    <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Date</th>
                    <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-[10px] text-[var(--foreground-muted)]">{log.details}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[var(--foreground-muted)]">{log.ip}</td>
                      <td className="p-4 text-sm text-[var(--foreground-muted)]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-500 text-xs">
                            <CheckCircle size={12} /> Succès
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                            <AlertTriangle size={12} /> Échec
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trusted Devices Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Fingerprint size={18} className="text-indigo-500" />
              </div>
              <h3 className="text-lg font-black">Appareils de confiance</h3>
            </div>
            
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              Gérez les appareils auxquels vous faites confiance pour ne pas recevoir de code 2FA.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]/5">
                <div>
                  <p className="text-sm font-medium">MacBook Pro - Chrome</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Approuvé le 15/01/2024</p>
                </div>
                <button className="text-xs text-red-500">Retirer</button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]/5">
                <div>
                  <p className="text-sm font-medium">iPhone 15 - Safari</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Approuvé le 10/01/2024</p>
                </div>
                <button className="text-xs text-red-500">Retirer</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-black mb-2">Configurer la 2FA</h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Scannez le QR code avec Google Authenticator ou une application similaire
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl mb-4 flex justify-center">
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                [QR Code]
              </div>
            </div>
            
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Code de vérification
              </label>
              <input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-2 text-center text-2xl tracking-widest bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-emerald-500/50"
                maxLength={6}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setShow2FASetup(false)}
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)]/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleEnable2FA}
                disabled={verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                Vérifier et activer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] p-6 rounded-2xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent"></div>
            <span className="text-sm">Chargement...</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .toggle {
          appearance: none;
          width: 44px;
          height: 24px;
          background: var(--border);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
        }
        .toggle:checked {
          background: #10b981;
        }
        .toggle::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }
        .toggle:checked::before {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );
}