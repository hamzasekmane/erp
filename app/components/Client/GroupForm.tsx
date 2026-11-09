"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, 
  X, 
  Layers, 
  Palette, 
  Users, 
  FileText, 
  AlertCircle,
  Loader2,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { createClientGroupAction, updateClientGroupAction } from "@/app/actions/clientGroupActions";
import { 
  ClientGroup, 
  GroupFormData,
  COLOR_OPTIONS,
  DEFAULT_GROUP_VALUES,
  GROUP_ERROR_MESSAGES,
  GROUP_SUCCESS_MESSAGES
} from "@/app/types/clientGroup.types";

interface GroupFormProps {
  initialData?: Partial<ClientGroup>;
  mode?: "create" | "edit";
  groupId?: string;
  token?: string;
}

export default function GroupForm({ initialData, mode = "create", groupId }: GroupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  
  const [formData, setFormData] = useState<GroupFormData>({
    name: initialData?.name ?? DEFAULT_GROUP_VALUES.name,
    description: String(initialData?.description ?? DEFAULT_GROUP_VALUES.description),
    color: String(initialData?.color ?? DEFAULT_GROUP_VALUES.color),
    discount: initialData?.discount ?? DEFAULT_GROUP_VALUES.discount,
    groupedBilling: initialData?.groupedBilling ?? DEFAULT_GROUP_VALUES.groupedBilling,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = GROUP_ERROR_MESSAGES.NAME_REQUIRED;
    } else if (formData.name.length < 3) {
      newErrors.name = "Le nom doit contenir au moins 3 caractères";
    }
    
    if (formData.discount < 0 || formData.discount > 100) {
      newErrors.discount = GROUP_ERROR_MESSAGES.DISCOUNT_INVALID;
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
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("color", formData.color);
      formDataToSend.append("discount", formData.discount.toString());
      formDataToSend.append("groupedBilling", formData.groupedBilling ? "true" : "false");

      let result;
      
      if (mode === "create") {
        result = await createClientGroupAction(null, formDataToSend);
      } else {
        const id = groupId || initialData?._id || "";
        if (!id) {
          toast.error("ID du groupe manquant");
          setIsLoading(false);
          return;
        }
        result = await updateClientGroupAction(id, null, formDataToSend);
      }

      if (result.success) {
        toast.success(mode === "create" ? GROUP_SUCCESS_MESSAGES.CREATED : GROUP_SUCCESS_MESSAGES.UPDATED);
        router.push("/dashboard/clients/groups");
        router.refresh();
      } else {
        toast.error(result.error || "Une erreur est survenue");
        
        if (result.error?.includes("nom") || result.error?.includes("name")) {
          setErrors({ name: GROUP_ERROR_MESSAGES.NAME_EXISTS });
        }
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setFormData(prev => ({ ...prev, discount: Math.min(100, Math.max(0, value)) }));
    if (errors.discount) {
      setErrors(prev => ({ ...prev, discount: "" }));
    }
  };

  const selectedColor = COLOR_OPTIONS.find(opt => opt.value === formData.color) || COLOR_OPTIONS[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      
      {/* ===== SECTION INFORMATIONS DE BASE ===== */}
      <div className="space-y-6">
        <h2 className="text-lg font-black uppercase tracking-wider text-[var(--accent)] flex items-center gap-2 border-b border-[var(--border)] pb-4">
          <Layers size={18} />
          Informations générales
        </h2>

        {/* Nom du groupe */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--foreground-muted)] tracking-widest ml-2">
            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full"></span>
            Nom du groupe <span className="text-rose-400 ml-1">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: VIP, Professionnels, Fidèles..."
            className={`w-full p-5 rounded-2xl bg-[var(--card-bg)] backdrop-blur-sm border ${
              errors.name ? 'border-rose-500/50' : 'border-[var(--border)]'
            } text-[var(--foreground)] font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all duration-300 text-sm placeholder:text-[var(--foreground-muted)]/50`}
            required
          />
          {errors.name && (
            <p className="text-rose-400 text-[10px] font-bold mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--foreground-muted)] tracking-widest ml-2">
            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full"></span>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Décrivez l'objectif de ce groupe..."
            rows={4}
            className="w-full p-5 rounded-2xl bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border)] text-[var(--foreground)] font-medium outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all duration-300 text-sm placeholder:text-[var(--foreground-muted)]/50 resize-none"
          />
          <p className="text-[8px] text-[var(--foreground-muted)]/60 uppercase tracking-wider mt-1">
            Une description claire aide à comprendre la segmentation
          </p>
        </div>
      </div>

      {/* ===== SECTION COULEUR ===== */}
      <div className="space-y-6 pt-4">
        <h2 className="text-lg font-black uppercase tracking-wider text-[var(--accent)] flex items-center gap-2 border-b border-[var(--border)] pb-4">
          <Palette size={18} />
          Identité visuelle
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COLOR_OPTIONS.map((color, index) => (
            <label
              key={index}
              className="relative cursor-pointer group/color"
            >
              <input
                type="radio"
                name="color"
                value={color.value}
                checked={formData.color === color.value}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="sr-only peer"
              />
              <div className={`
                ${color.bg} h-16 rounded-xl border-2 transition-all duration-300
                peer-checked:border-white peer-checked:scale-105 peer-checked:shadow-lg peer-checked:shadow-[var(--accent)]/30
                border-transparent group-hover/color:scale-105 group-hover/color:border-white/50
                flex items-center justify-center
              `}>
                <span className="text-[8px] font-black text-white uppercase tracking-wider bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  {color.label.split(' ')[0]}
                </span>
              </div>
            </label>
          ))}
        </div>
        
        {/* Aperçu de la couleur sélectionnée */}
        <div className="flex items-center gap-3 p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] transition-all duration-300 hover:border-[var(--accent)]/30">
          <span className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-wider">Couleur sélectionnée:</span>
          <div className={`w-8 h-8 rounded-lg ${selectedColor.bg} transition-all duration-300`} />
          <span className="text-xs text-[var(--foreground)] font-bold">{selectedColor.label}</span>
        </div>
      </div>

      {/* ===== SECTION CLIENTS ===== */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-wider text-[var(--accent)] flex items-center gap-2 border-b border-[var(--border)] pb-4">
            <Users size={18} />
            Clients du groupe
          </h2>
          
          {mode === "edit" && (
            <button
              type="button"
              onClick={() => setShowClientSelector(!showClientSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] hover:bg-[var(--accent)]/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--accent)] transition-all duration-300 border border-[var(--border)] hover:border-[var(--accent)]/30"
            >
              <Plus size={14} />
              {showClientSelector ? "Masquer" : "Ajouter des clients"}
            </button>
          )}
        </div>

        {/* Mode création - message informatif */}
        {mode === "create" && (
          <div className="bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 space-y-4 transition-all duration-300 hover:border-[var(--accent)]/30">
            <p className="text-[10px] text-[var(--foreground)] font-medium">
              Vous pourrez assigner des clients à ce groupe après sa création, ou directement depuis la fiche client.
            </p>
            
            <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
              <p className="text-[9px] text-amber-400/90 font-medium">
                Les groupes vous permettent de segmenter vos clients pour des analyses plus précises et des actions groupées.
              </p>
            </div>
          </div>
        )}

        {/* Mode édition - message */}
        {mode === "edit" && (
          <div className="bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 space-y-4 transition-all duration-300 hover:border-[var(--accent)]/30">
            <p className="text-[10px] text-[var(--foreground)] font-medium">
              La gestion des clients dans ce groupe se fait depuis la page de détails du groupe.
            </p>
            
            {initialData?.clientCount ? (
              <div className="flex items-center gap-2 p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl">
                <Users size={16} className="text-[var(--accent)]" />
                <span className="text-xs text-[var(--accent)] font-bold">
                  {initialData.clientCount} client(s) dans ce groupe
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-zinc-500/10 border border-zinc-500/30 rounded-xl">
                <AlertCircle size={16} className="text-[var(--foreground-muted)]" />
                <span className="text-xs text-[var(--foreground-muted)]">
                  Aucun client dans ce groupe pour le moment
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== SECTION PARAMÈTRES AVANCÉS ===== */}
      <div className="space-y-6 pt-4">
        <h2 className="text-lg font-black uppercase tracking-wider text-[var(--accent)] flex items-center gap-2 border-b border-[var(--border)] pb-4">
          <FileText size={18} />
          Paramètres avancés
        </h2>

        <div className="space-y-4">
          {/* Remise spéciale */}
          <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] transition-all duration-300 hover:border-[var(--accent)]/30">
            <div>
              <p className="text-xs font-bold text-[var(--foreground)]">Remise spéciale</p>
              <p className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-wider mt-1">
                Appliquer une remise automatique
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.discount}
                onChange={handleNumberChange}
                min="0"
                max="100"
                className={`w-20 p-2 bg-[var(--card-bg)] border ${
                  errors.discount ? 'border-rose-500/50' : 'border-[var(--border)]'
                } rounded-lg text-[var(--foreground)] text-right font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all duration-300`}
              />
              <span className="text-[8px] text-[var(--foreground-muted)]">%</span>
            </div>
          </div>
          {errors.discount && (
            <p className="text-rose-400 text-[10px] font-bold mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.discount}
            </p>
          )}

          {/* Facturation groupée */}
          <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] transition-all duration-300 hover:border-[var(--accent)]/30">
            <div>
              <p className="text-xs font-bold text-[var(--foreground)]">Facturation groupée</p>
              <p className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-wider mt-1">
                Regrouper les factures par période
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.groupedBilling}
                onChange={(e) => setFormData({ ...formData, groupedBilling: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--card-bg)] border border-[var(--border)] rounded-full peer peer-checked:bg-[var(--accent)] transition-all duration-300"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform duration-300"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ===== BOUTONS D'ACTION ===== */}
      <div className="flex items-center gap-4 pt-8 border-t border-[var(--border)]">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-[var(--accent)] to-blue-600 hover:from-[var(--accent-dark)] hover:to-blue-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[var(--accent)]/20"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {isLoading 
            ? (mode === "create" ? "Création..." : "Modification...") 
            : (mode === "create" ? "Créer le groupe" : "Modifier le groupe")
          }
        </button>
        
        <button
          type="button"
          onClick={() => router.push("/dashboard/clients/groups")}
          className="px-8 py-5 bg-[var(--card-bg)] hover:bg-[var(--accent)]/10 rounded-2xl font-black uppercase text-xs tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all duration-300 border border-[var(--border)] hover:border-[var(--accent)]/30 flex items-center gap-2"
        >
          <X size={18} />
          Annuler
        </button>
      </div>
    </form>
  );
}