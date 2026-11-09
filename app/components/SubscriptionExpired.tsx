import React from 'react';
import { CreditCard, Clock, Calendar, AlertCircle, XCircle, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionError {
  success: false;
  error_code: "SUBSCRIPTION_EXPIRED";
  message: string;
  data: {
    expiredSince: string;
    daysOverdue: number;
  };
}

interface SubscriptionExpiredProps {
  error: SubscriptionError;
}

const SubscriptionExpired: React.FC<SubscriptionExpiredProps> = ({ error }) => {
  const expiredDate = new Date(error.data.expiredSince).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Main Card */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with alert */}
          <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-8 border-b border-red-500/30">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30 animate-pulse">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                  Abonnement expiré
                </h1>
                <p className="text-red-400 text-sm mt-1 flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error.error_code}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Message in Arabic */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10" dir="rtl">
              <p className="text-lg text-zinc-300 font-medium">
                {error.message}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center gap-3 text-zinc-400 mb-3">
                  <Calendar size={18} className="text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Expiré depuis
                  </span>
                </div>
                <p className="text-white font-bold text-lg">
                  {expiredDate}
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center gap-3 text-zinc-400 mb-3">
                  <Clock size={18} className="text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Jours de retard
                  </span>
                </div>
                <p className="text-red-400 font-bold text-3xl">
                  {error.data.daysOverdue} <span className="text-sm text-zinc-500">jours</span>
                </p>
              </div>
            </div>

            {/* Features being blocked */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-4">
                Fonctionnalités temporairement indisponibles
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['Création de factures', 'Export PDF', 'Nouveaux clients', 'Rapports avancés'].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-zinc-500">
                    <XCircle size={12} className="text-red-400/50" />
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/subscription/renew"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-2 group"
              >
                <CreditCard size={18} className="group-hover:scale-110 transition-transform" />
                Renouveler maintenant
              </Link>
              
              <Link
                href="/contact-support"
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-2 group"
              >
                <Mail size={18} className="group-hover:scale-110 transition-transform" />
                Contacter le support
              </Link>
            </div>

            {/* Contact Info */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-zinc-500">
                <Phone size={12} />
                <span className="text-[10px]">+213 XXX XX XX XX</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Mail size={12} />
                <span className="text-[10px]">support@velora.dz</span>
              </div>
            </div>

            {/* Support Note */}
            <p className="text-[10px] text-zinc-500 text-center mt-4">
              Une fois le paiement effectué, vos accès seront restaurés automatiquement dans les minutes qui suivent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;