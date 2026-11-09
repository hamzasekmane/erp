"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, AlertCircle, Check, Layers } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface EditGroupFormProps {
  groupId: string;
  initialData: {
    name: string;
    description: string | null;
    color: string;
    discount: number;
    groupedBilling: boolean;
  };
  token: string;
}

const colorOptions = [
  { value: "from-cyan-500 to-blue-600", label: "Cyan → Bleu", bg: "bg-gradient-to-r from-cyan-500 to-blue-600" },
  { value: "from-emerald-500 to-teal-600", label: "Émeraude → Teal", bg: "bg-gradient-to-r from-emerald-500 to-teal-600" },
  { value: "from-violet-500 to-purple-600", label: "Violet → Pourpre", bg: "bg-gradient-to-r from-violet-500 to-purple-600" },
  { value: "from-amber-500 to-orange-600", label: "Ambre → Orange", bg: "bg-gradient-to-r from-amber-500 to-orange-600" },
  { value: "from-rose-500 to-pink-600", label: "Rose → Rose foncé", bg: "bg-gradient-to-r from-rose-500 to-pink-600" },
  { value: "from-indigo-500 to-blue-600", label: "Indigo → Bleu", bg: "bg-gradient-to-r from-indigo-500 to-blue-600" },
];

export default function EditGroupForm({ groupId, initialData, token }: EditGroupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    description: initialData.description || "",
    color: initialData.color || "from-cyan-500 to-blue-600",
    discount: initialData.discount || 0,
    groupedBilling: initialData.groupedBilling || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du groupe est requis";
    } else if (formData.name.length < 3) {
      newErrors.name = "Le nom doit contenir au moins 3 caractères";
    }
    
    if (formData.discount < 0 || formData.discount > 100) {
      newErrors.discount = "La remise doit être entre 0 et 100%";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        discount: Number(formData.discount),
        groupedBilling: formData.groupedBilling,
      };

      const res = await fetch(`${API_URL}/client-groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 400 && result.message?.includes("name")) {
          setErrors({ name: "Ce nom de groupe est déjà utilisé" });
          throw new Error("Ce nom de groupe est déjà utilisé");
        }
        throw new Error(result.message || "Erreur lors de la mise à jour");
      }

      toast.success("Groupe mis à jour avec succès");
      router.push(`/dashboard/clients/groups/${groupId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, groupedBilling: e.target.checked }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ===== SECTION INFORMATIONS DE BASE ===== */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-cyan-500/10 rounded-xl">
            <Layers size={20} className="text-cyan-400" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">
            Informations du groupe
          </h3>
        </div>

        {/* Champ Nom */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            Nom du groupe <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="ex: Smartphone Store All Alger"
            className={`w-full bg-white/5 border ${
              errors.name ? 'border-rose-500/50' : 'border-white/10'
            } rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors`}
          />
          {errors.name && (
            <p className="text-rose-400 text-[10px] font-bold mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.name}
            </p>
          )}
        </div>

        {/* Champ Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            Description (optionnelle)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description du groupe..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Sélecteur de Couleur */}
        <div className="space-y-2">
          <label htmlFor="color" className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            Couleur du groupe
          </label>
          <select
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-colors"
          >
            {colorOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-zinc-900">
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Aperçu de la couleur */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 uppercase">Aperçu:</span>
            <div className={`h-8 w-24 rounded-lg bg-gradient-to-r ${formData.color} opacity-80`} />
          </div>
        </div>
      </div>

      {/* ===== SECTION PARAMÈTRES DE FACTURATION ===== */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Layers size={20} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">
            Paramètres de facturation
          </h3>
        </div>

        {/* Champ Remise */}
        <div className="space-y-2">
          <label htmlFor="discount" className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            Remise spéciale (%)
          </label>
          <div className="relative">
            <input
              type="number"
              id="discount"
              name="discount"
              min="0"
              max="100"
              step="1"
              value={formData.discount}
              onChange={handleChange}
              className={`w-full bg-white/5 border ${
                errors.discount ? 'border-rose-500/50' : 'border-white/10'
              } rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-colors`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              %
            </span>
          </div>
          {errors.discount && (
            <p className="text-rose-400 text-[10px] font-bold mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.discount}
            </p>
          )}
        </div>

        {/* Checkbox Facturation groupée */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs text-zinc-400 block">Facturation groupée</span>
            <p className="text-[8px] text-zinc-600 mt-1">
              Tous les clients du groupe apparaîtront sur une seule facture
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, groupedBilling: !prev.groupedBilling }))}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
              formData.groupedBilling ? 'bg-emerald-500' : 'bg-zinc-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                formData.groupedBilling ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ===== NOTE INFORMATIVE ===== */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-transparent backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-cyan-500/20 rounded-xl flex-shrink-0">
          <AlertCircle size={20} className="text-cyan-400" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
            ℹ️ Modification du groupe
          </h4>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Les modifications des paramètres de facturation affecteront toutes les futures 
            factures des clients de ce groupe.
          </p>
        </div>
      </div>

      {/* ===== BOUTONS D'ACTION ===== */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-4 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black text-zinc-400 uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          <X size={16} />
          Annuler
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-4 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-xs font-black text-white uppercase tracking-wider hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save size={16} />
              Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
}