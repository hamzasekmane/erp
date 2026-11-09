"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction, updateClientAction } from "@/app/actions/clientActions";
import { 
  Loader2, User, Phone, Hash, Tag, MapPin, 
  ChevronDown, CheckCircle2, Mail, 
  FileCheck, ShieldCheck, Landmark, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface ClientFormProps {
  mode?: "create" | "edit";
  id?: string;
  initialData?: any;
  token?: string; 
}

export default function ClientForm({ mode = "create", id, initialData }: ClientFormProps) {
  const router = useRouter();
  const actionFn = mode === "edit" && id ? updateClientAction.bind(null, id) : createClientAction;
  const [state, action, isPending] = useActionState(actionFn, null);
  
  // États locaux
  const [phoneError, setPhoneError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [phoneValue, setPhoneValue] = useState(initialData?.phone || "");
  const [mobileValue, setMobileValue] = useState(initialData?.mobile || "");

  // Validation des numéros de téléphone
  const validatePhoneInput = (value: string, type: 'phone' | 'mobile'): boolean => {
    const cleaned = value.replace(/\D/g, '');
    
    // Accepte 9 ou 10 chiffres (le serveur ajustera automatiquement)
    if (cleaned && cleaned.length < 9) {
      if (type === 'phone') {
        setPhoneError("Le numéro doit contenir au moins 9 chiffres");
      } else {
        setMobileError("Le numéro doit contenir au moins 9 chiffres");
      }
      return false;
    } else if (cleaned && cleaned.length > 10) {
      if (type === 'phone') {
        setPhoneError("Le numéro ne doit pas dépasser 10 chiffres");
      } else {
        setMobileError("Le numéro ne doit pas dépasser 10 chiffres");
      }
      return false;
    } else {
      if (type === 'phone') {
        setPhoneError("");
      } else {
        setMobileError("");
      }
      return true;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneValue(value);
    validatePhoneInput(value, 'phone');
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMobileValue(value);
    validatePhoneInput(value, 'mobile');
  };

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success(mode === "create" ? "Client créé avec succès" : "Client modifié avec succès");
      setTimeout(() => {
        router.push("/dashboard/clients");
        router.refresh();
      }, 1000);
    }
  }, [state, mode, router]);

  // Pré-remplir les champs d'adresse
  const address = initialData?.address || {};

  return (
    <form action={action} className="space-y-6 text-left" dir="ltr">
      
      {/* Message d'erreur */}
      {state?.error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 justify-center">
            <AlertCircle size={16} className="text-rose-400" />
            <p className="text-[10px] font-black text-rose-400 uppercase italic">
              {state.error}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: IDENTIFICATION & TYPE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <Hash size={12} className="text-cyan-400" /> Code Unique *
          </label>
          <input 
            name="code" 
            defaultValue={initialData?.code} 
            required 
            readOnly={mode === "edit"} // Empêcher la modification du code en mode édition
            placeholder="Ex: CL-1001" 
            className={`w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600 ${mode === "edit" ? "opacity-70 cursor-not-allowed" : ""}`} 
          />
          {mode === "edit" && (
            <p className="text-[8px] text-zinc-500 mt-1">Le code ne peut pas être modifié</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            Type de Profil
          </label>
          <div className="relative">
            <select 
              name="type" 
              defaultValue={initialData?.type || "individual"} 
              className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none"
            >
              <option value="individual" className="bg-[#020617] text-white">Particulier</option>
              <option value="company" className="bg-[#020617] text-white">Entreprise / Société</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <User size={12} className="text-cyan-400" /> Nom ou Raison Sociale *
          </label>
          <input 
            name="name" 
            defaultValue={initialData?.name} 
            required 
            placeholder="Nom complet du client" 
            className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600" 
          />
        </div>
      </div>

      {/* SECTION 2: INFOS FISCALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <Landmark size={12} className="text-cyan-400" /> NIF (Matricule Fiscal)
          </label>
          <input 
            name="taxNumber" 
            defaultValue={initialData?.taxNumber} 
            placeholder="000..." 
            className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600" 
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <FileCheck size={12} className="text-cyan-400" /> Registre du Commerce
          </label>
          <input 
            name="commercialRegistration" 
            defaultValue={initialData?.commercialRegistration} 
            placeholder="RC-..." 
            className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600" 
          />
        </div>
      </div>

      {/* SECTION 3: CONTACT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <Mail size={12} className="text-cyan-400" /> Email
          </label>
          <input 
            name="email" 
            type="email" 
            defaultValue={initialData?.email} 
            placeholder="client@email.com" 
            className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600" 
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <Phone size={12} className="text-cyan-400" /> Téléphone Fixe
          </label>
          <input 
            name="phone" 
            type="tel" 
            value={phoneValue}
            onChange={handlePhoneChange}
            placeholder="0212233445" 
            className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600" 
          />
          {phoneError && (
            <p className="text-[8px] text-rose-400 font-bold mt-1">{phoneError}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <Phone size={12} className="text-cyan-400" /> Mobile
          </label>
          <input 
            name="mobile" 
            type="tel" 
            value={mobileValue}
            onChange={handleMobileChange}
            placeholder="0555123456" 
            className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600" 
          />
          {mobileError && (
            <p className="text-[8px] text-rose-400 font-bold mt-1">{mobileError}</p>
          )}
        </div>
      </div>

      {/* SECTION 4: ADRESSE */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 space-y-6">
        <h3 className="text-lg font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-white/10 pb-4">
          <MapPin size={18} />
          Adresse
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">Ville</label>
            <input 
              name="city" 
              defaultValue={address.city} 
              placeholder="Alger, Oran..." 
              className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">Rue / Quartier</label>
            <input 
              name="street" 
              defaultValue={address.street} 
              placeholder="Rue..." 
              className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm placeholder:text-zinc-600" 
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: CATÉGORIE & STATUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <Tag size={12} className="text-cyan-400" /> Catégorie
          </label>
          <div className="relative">
            <select 
              name="category" 
              defaultValue={initialData?.category || "regular"} 
              className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none"
            >
              <option value="regular" className="bg-[#020617] text-white">Régulier</option>
              <option value="vip" className="bg-[#020617] text-white">VIP</option>
              <option value="wholesale" className="bg-[#020617] text-white">Grossiste</option>
              <option value="retail" className="bg-[#020617] text-white">Détaillant</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic ml-2">
            <ShieldCheck size={12} className="text-cyan-400" /> Statut
          </label>
          <div className="relative">
            <select 
              name="isActive" 
              defaultValue={initialData?.isActive ? "true" : "false"} 
              className="w-full p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none"
            >
              <option value="true" className="bg-[#020617] text-white">Actif</option>
              <option value="false" className="bg-[#020617] text-white">Inactif</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* BOUTON SOUMISSION */}
      <button
        type="submit"
        disabled={isPending || !!phoneError || !!mobileError}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Traitement...</span>
          </>
        ) : (
          <>
            {mode === "create" ? "Créer" : "Mettre à jour"}
            <CheckCircle2 size={18} />
          </>
        )}
      </button>
    </form>
  );
}