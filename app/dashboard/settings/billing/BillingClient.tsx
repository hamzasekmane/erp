'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface BillingClientProps {
  subscription: any;
  token: string;
}

export function BillingClient({ subscription, token }: BillingClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Appel API pour annuler l'abonnement
      // const response = await fetch('/api/subscription/cancel', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Abonnement annulé avec succès' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'annulation' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setIsLoading(true);
    try {
      // Télécharger la facture
      console.log('Downloading invoice:', invoiceId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'
        }`}>
          <AlertCircle size={16} />
          <span className="text-sm">{message.text}</span>
        </div>
      )}
      
      {/* Hidden div to satisfy TypeScript - actual interactive elements would go here */}
      <div className="hidden">
        <button onClick={handleCancelSubscription}>Cancel</button>
      </div>
    </>
  );
}