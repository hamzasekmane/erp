"use client";

import { useState, useMemo, useActionState, useEffect, startTransition } from "react";
import { 
  Plus, Package, Save, X, Loader2, Info, Percent, 
  Truck, Calendar, Clock, AlertCircle, CheckCircle2, Copy, Trash2
} from "lucide-react";
import { createInvoiceAction } from "@/app/actions/invoiceActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InvoiceFormProps {
  clients: any[];
  products: any[];
  token: string;
  initialData?: any; // ✅ Add optional initialData for edit mode
}

interface InvoiceItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export default function InvoiceForm({ clients, products, token, initialData }: InvoiceFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;

  // Debug: Log products when component mounts
  useEffect(() => {
    console.log("📦 Products received in InvoiceForm:", products);
    console.log("📦 Number of products:", products?.length);
    console.log("📝 Edit mode:", isEditMode);
    if (initialData) {
      console.log("📝 Initial data:", initialData);
    }
  }, [products, initialData, isEditMode]);

  // Helper pour calculer les dates futures
  const getFutureDate = (baseDate: string, daysToAdd: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split("T")[0];
  };

  // Initialize items from initialData if in edit mode
  const getInitialItems = (): InvoiceItem[] => {
    if (initialData?.items && initialData.items.length > 0) {
      return initialData.items.map((item: any) => ({
        id: crypto.randomUUID(),
        productId: item.productId?._id || item.productId || "",
        description: item.description || "",
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
      }));
    }
    return [
      { id: crypto.randomUUID(), productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0 }
    ];
  };

  // --- ÉTAT LOCAL ---
  const [items, setItems] = useState<InvoiceItem[]>(getInitialItems());
  const [clientId, setClientId] = useState(initialData?.clientId?._id || initialData?.clientId || "");
  const [selectedClientData, setSelectedClientData] = useState<any>(initialData?.clientId || null);
  
  const [date, setDate] = useState(
    initialData?.issueDate || initialData?.date 
      ? new Date(initialData.issueDate || initialData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate 
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : getFutureDate(new Date().toISOString().split("T")[0], 7)
  );
  
  const [globalDiscount, setGlobalDiscount] = useState(initialData?.discount || 0);
  const [shipping, setShipping] = useState(initialData?.shipping || 0);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [terms, setTerms] = useState(initialData?.terms || "Paiement à réception");

  const [state, formAction, isPending] = useActionState(
    createInvoiceAction,
    { success: false, message: "" }
  );

  // ✅ Mise à jour auto de la date d'échéance
  const handleEmissionDateChange = (newDate: string) => {
    setDate(newDate);
    const daysDiff = Math.ceil(
      (new Date(dueDate).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    setDueDate(getFutureDate(newDate, Math.max(1, daysDiff || 7)));
  };

  // ✅ Récupération du solde client
  useEffect(() => {
    if (!clientId) {
      setSelectedClientData(null);
      return;
    }
    
    const client = clients.find(c => c._id === clientId);
    
    const fetchBalance = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/balance`;
        console.log("Fetching:", url);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });

        const text = await res.text();

        if (!res.ok) throw new Error(`Erreur réseau: ${res.status}`);

        const data = JSON.parse(text);

        setSelectedClientData({ 
          ...client, 
          currentBalance: data.balance || 0 
        });

      } catch (err) {
        console.error('Erreur chargement solde:', err);
        setSelectedClientData({ 
          ...client, 
          currentBalance: 0 
        });
      }
    };
    
    fetchBalance();
  }, [clientId, clients, token]);

  // ✅ Gestion du retour de l'action
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "Facture générée avec succès !");
      router.push("/dashboard/invoices");
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  // ✅ Calculs
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
      return acc + (itemTotal - itemDiscount);
    }, 0);
    return { 
      subtotal: Number(subtotal.toFixed(2)), 
      final: Number(Math.max(0, subtotal - globalDiscount + shipping).toFixed(2)) 
    };
  }, [items, globalDiscount, shipping]);

  // ✅ Validation
  const validateDates = () => {
    const emissionDate = new Date(date);
    const echeanceDate = new Date(dueDate);
    
    if (echeanceDate < emissionDate) {
      toast.error("La date d'échéance doit être postérieure à la date d'émission");
      return false;
    }
    
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!clientId) return toast.error("Veuillez sélectionner un client.");
    if (!dueDate) return toast.error("La date d'échéance est obligatoire.");
    if (!validateDates()) return;
    
    const validItems = items.filter(item => 
      item.productId !== "" || item.description.trim() !== ""
    );
    
    if (validItems.length === 0) {
      return toast.error("La facture doit contenir au moins un article.");
    }

    const payload = {
      ...(isEditMode && { invoiceId: initialData._id }), // Add invoiceId for updates
      clientId,
      date: new Date(date).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      items: validItems.map(item => ({
        productId: item.productId || null,
        description: item.description.trim() || "Article sans nom",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount) || 0,
        taxRate: 0
      })),
      discount: Number(globalDiscount) || 0,
      shipping: Number(shipping) || 0,
      notes: notes.trim(),
      terms,
      subtotal: Number(totals.subtotal),
      total: Number(totals.final)
    };

    startTransition(() => { 
      formAction(payload); 
    });
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => 
      item.id === id 
        ? field === "productId" 
          ? (() => {
              const selected = products.find((p: any) => p._id === value);
              return selected 
                ? { 
                    ...item, 
                    productId: value, 
                    description: selected.name, 
                    unitPrice: selected.price 
                  }
                : { 
                    ...item, 
                    productId: "", 
                    description: "", 
                    unitPrice: 0 
                  };
            })()
          : { ...item, [field]: value }
        : item
    ));
  };

  const duplicateItem = (id: string) => {
    const itemToDuplicate = items.find(item => item.id === id);
    if (itemToDuplicate) {
      setItems([...items, { ...itemToDuplicate, id: crypto.randomUUID() }]);
    }
  };

  const addItem = () => {
    setItems([...items, { 
      id: crypto.randomUUID(),
      productId: "", 
      description: "", 
      quantity: 1, 
      unitPrice: 0, 
      discount: 0 
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const isDateInvalid = !!(dueDate && new Date(dueDate) < new Date(date));

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      
      {/* ===== SECTION CLIENT ===== */}
      <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[2rem] p-6 space-y-6">
        
        <div className="flex items-center gap-2">
          <Info size={16} className="text-[var(--accent)]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-[var(--foreground)]">
            {isEditMode ? "Modifier le client" : "Client"}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">
              Sélectionner un client <span className="text-rose-400">*</span>
            </label>
            <select 
              required 
              value={clientId} 
              onChange={(e) => setClientId(e.target.value)} 
              className="w-full p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all text-sm"
            >
              <option value="" className="bg-[var(--background)] text-[var(--foreground-muted)]">Choisir un client...</option>
              {clients?.map((c: any) => (
                <option key={c._id} value={c._id} className="bg-[var(--background)] text-[var(--foreground)]">{c.name}</option>
              ))}
            </select>

            {selectedClientData && (
              <div className="p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] animate-in fade-in">
                <p className="font-bold text-[var(--foreground)]">{selectedClientData.name}</p>
                <p className="text-xs text-[var(--foreground-muted)]">{selectedClientData.phone}</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)]">
                  <span className="text-[8px] font-black uppercase text-[var(--foreground-muted)]">Solde:</span>
                  <span className={`text-sm font-bold ${
                    selectedClientData.currentBalance > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}>
                    {(selectedClientData.currentBalance || 0).toLocaleString()} DA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black uppercase text-[var(--foreground-muted)] flex items-center gap-1 mb-1">
                  <Calendar size={10} className="text-[var(--accent)]" /> Émission
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => handleEmissionDateChange(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/50" 
                />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-[var(--foreground-muted)] flex items-center gap-1 mb-1">
                  <Clock size={10} className="text-[var(--accent)]" /> Échéance <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="date" 
                  required 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  className={`w-full p-3 rounded-xl bg-[var(--card-bg)] border outline-none text-sm ${
                    isDateInvalid 
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-400' 
                      : 'border-[var(--border)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]/50'
                  }`} 
                />
              </div>
            </div>

            {/* Shortcuts */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Aujourd'hui", days: 0 },
                { label: "7j", days: 7 },
                { label: "15j", days: 15 },
                { label: "30j", days: 30 },
              ].map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={() => setDueDate(getFutureDate(date, shortcut.days))}
                  className="px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-[var(--border)] text-[8px] font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-all"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION ARTICLES ===== */}
      <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[2rem] p-6 space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--foreground)]">Articles ({items.length})</h3>
          </div>
          <button 
            type="button" 
            onClick={addItem} 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-wider hover:scale-95 transition-all"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all relative group"
            >
              <div className="grid grid-cols-12 gap-2 items-start">
                
                {/* Produit */}
                <div className="col-span-12 md:col-span-4">
                  <select 
                    value={item.productId} 
                    className="w-full bg-transparent font-bold border-b border-[var(--border)] py-1 outline-none focus:border-[var(--accent)] text-[var(--foreground)] text-sm" 
                    onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                  >
                    <option value="" className="bg-[var(--background)] text-[var(--foreground-muted)]">Saisie libre...</option>
                    {products && products.length > 0 ? (
                      products.map((p: any) => (
                        <option key={p._id} value={p._id} className="bg-[var(--background)] text-[var(--foreground)]">
                          {p.name} - {p.price?.toLocaleString()} DA
                        </option>
                      ))
                    ) : (
                      <option disabled className="bg-[var(--background)] text-[var(--foreground-muted)]">Aucun produit disponible</option>
                    )}
                  </select>
                  <input 
                    placeholder="Description..." 
                    value={item.description} 
                    className="w-full mt-1 text-xs bg-transparent text-[var(--foreground-muted)] outline-none placeholder:text-[var(--foreground-muted)]/40" 
                    onChange={(e) => updateItem(item.id, "description", e.target.value)} 
                  />
                </div>

                {/* Prix */}
                <div className="col-span-3 md:col-span-2">
                  <label className="text-[7px] font-black uppercase text-[var(--foreground-muted)]">Prix</label>
                  <input 
                    type="number" 
                    value={item.unitPrice} 
                    className="w-full bg-transparent font-black text-[var(--accent)] text-base outline-none" 
                    onChange={(e) => updateItem(item.id, "unitPrice", +e.target.value)} 
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Quantité */}
                <div className="col-span-3 md:col-span-2">
                  <label className="text-[7px] font-black uppercase text-[var(--foreground-muted)]">Qté</label>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    className="w-full bg-transparent font-black text-[var(--foreground)] text-base outline-none" 
                    onChange={(e) => updateItem(item.id, "quantity", +e.target.value)} 
                    min="1"
                  />
                </div>

                {/* Remise */}
                <div className="col-span-3 md:col-span-2">
                  <label className="text-[7px] font-black uppercase text-[var(--foreground-muted)]">Remise %</label>
                  <input 
                    type="number" 
                    value={item.discount} 
                    className="w-full bg-transparent font-bold text-rose-400 text-base outline-none" 
                    onChange={(e) => updateItem(item.id, "discount", +e.target.value)} 
                    min="0"
                    max="100"
                  />
                </div>

                {/* Total */}
                <div className="col-span-3 md:col-span-2 text-right">
                  <label className="text-[7px] font-black uppercase text-[var(--foreground-muted)]">Total</label>
                  <p className="font-black text-[var(--foreground)] text-base">
                    {(item.quantity * item.unitPrice * (1 - (item.discount || 0)/100)).toLocaleString()} DA
                  </p>
                </div>
              </div>

              {/* Actions */}
              {items.length > 1 && (
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-1">
                  <button 
                    type="button" 
                    onClick={() => duplicateItem(item.id)}
                    className="p-1.5 bg-[var(--card-bg)] hover:bg-[var(--accent)]/20 rounded-lg transition-all border border-[var(--border)]"
                    title="Dupliquer"
                  >
                    <Copy size={12} className="text-[var(--foreground-muted)] hover:text-[var(--accent)]" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id)} 
                    className="p-1.5 bg-[var(--card-bg)] hover:bg-rose-500/20 rounded-lg transition-all border border-[var(--border)]"
                    title="Supprimer"
                  >
                    <Trash2 size={12} className="text-[var(--foreground-muted)] hover:text-rose-400" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== SECTION NOTES & TOTAUX ===== */}
      <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[2rem] p-6 space-y-6">
        
        <div className="flex items-center gap-2">
          <Save size={16} className="text-[var(--accent)]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-[var(--foreground)]">
            {isEditMode ? "Mettre à jour" : "Totaux"}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Notes & Terms */}
          <div className="space-y-4">
            <textarea 
              value={notes} 
              placeholder="Notes sur la facture..." 
              className="w-full p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/40 min-h-[100px] outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-sm" 
              onChange={(e) => setNotes(e.target.value)} 
            />
            
            <select
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-sm"
            >
              <option value="Paiement à réception">Paiement à réception</option>
              <option value="Paiement sous 7 jours">Paiement sous 7 jours</option>
              <option value="Paiement sous 15 jours">Paiement sous 15 jours</option>
              <option value="Paiement sous 30 jours">Paiement sous 30 jours</option>
            </select>
          </div>

          {/* Discount & Shipping */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]">
                <label className="text-[8px] font-black uppercase text-[var(--foreground-muted)] flex items-center gap-1 mb-2">
                  <Percent size={10} className="text-[var(--accent)]" /> Remise globale (DA)
                </label>
                <input 
                  type="number" 
                  value={globalDiscount} 
                  onChange={(e) => setGlobalDiscount(+e.target.value)} 
                  className="w-full bg-transparent font-black text-[var(--foreground)] text-xl outline-none"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]">
                <label className="text-[8px] font-black uppercase text-[var(--foreground-muted)] flex items-center gap-1 mb-2">
                  <Truck size={10} className="text-[var(--accent)]" /> Frais de port (DA)
                </label>
                <input 
                  type="number" 
                  value={shipping} 
                  onChange={(e) => setShipping(+e.target.value)} 
                  className="w-full bg-transparent font-black text-[var(--foreground)] text-xl outline-none"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Totaux */}
            <div className="p-6 bg-gradient-to-br from-[var(--accent)]/10 to-blue-500/10 rounded-xl border border-[var(--accent)]/30">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-[var(--border)]">
                <span className="text-[8px] font-black uppercase text-[var(--foreground-muted)]">Sous-total</span>
                <span className="font-black text-[var(--foreground)]">{totals.subtotal.toLocaleString()} DA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase text-[var(--accent)]">Net à payer</span>
                <div className="text-right">
                  <span className="text-3xl font-black text-[var(--foreground)]">{totals.final.toLocaleString()}</span>
                  <span className="ml-1 text-xs font-bold text-[var(--foreground-muted)]">DA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isPending || isDateInvalid} 
          className="w-full py-4 bg-gradient-to-r from-[var(--accent)] to-blue-600 hover:from-[var(--accent-dark)] hover:to-blue-500 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isPending ? "Génération en cours..." : isEditMode ? "Mettre à jour la Facture" : "Enregistrer la Facture"}
        </button>

        {/* Warning for invalid dates */}
        {isDateInvalid && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[8px] font-bold text-rose-400 uppercase flex items-center gap-2">
            <AlertCircle size={12} />
            La date d'échéance doit être postérieure à la date d'émission
          </div>
        )}
      </div>
    </form>
  );
}