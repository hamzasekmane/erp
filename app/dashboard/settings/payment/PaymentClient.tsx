'use client';

import { useState } from 'react';
import { Shield, AlertCircle, CreditCard } from 'lucide-react';

interface PaymentClientProps {
  gateways: any[];
  stats: any;
  token: string;
}

export function PaymentClient({ gateways, stats, token }: PaymentClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggleGateway = async (gatewayId: string, currentStatus: boolean) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      // This would call your payment service
      // const response = await paymentService.toggleGateway(token, gatewayId, !currentStatus);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage({ 
        type: 'success', 
        text: `Passerelle ${currentStatus ? 'désactivée' : 'activée'} avec succès` 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du changement de statut' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <>
      {message && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl flex items-center gap-2 z-50 ${
          message.type === 'success' 
            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
            : 'bg-red-500/20 text-red-500 border border-red-500/30'
        }`}>
          <AlertCircle size={16} />
          <span className="text-sm">{message.text}</span>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-500">Sécurité des paiements</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Toutes les transactions sont sécurisées par chiffrement SSL. Les données bancaires ne sont jamais stockées sur nos serveurs.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}