// frontend/app/dashboard/hr/employees/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  XCircle,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Shield,
  CheckCircle,
  Loader2,
  Upload,
  Camera,
  Trash2
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { createEmployeeAction } from "@/app/actions/hrActions";

interface EmployeeFormData {
  // Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  nationality: string;
  
  // Informations professionnelles
  position: string;
  department: string;
  manager: string;
  hireDate: string;
  contractType: "cdi" | "cdd" | "stage" | "freelance";
  contractEndDate?: string;
  probationPeriod: number; // en jours
  workLocation: string;
  
  // Rémunération
  salary: number;
  currency: string;
  bankName: string;
  bankAccount: string;
  rib: string;
  
  // Congés
  annualLeave: number;
  sickLeave: number;
  
  // Statut
  status: "active" | "inactive" | "on_leave";
  isActive: boolean;
  
  // Documents
  cinNumber: string;
  cinExpiry: string;
  passportNumber?: string;
  socialSecurityNumber: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    birthPlace: "",
    address: "",
    nationality: "Algérienne",
    
    position: "",
    department: "",
    manager: "",
    hireDate: "",
    contractType: "cdi",
    contractEndDate: "",
    probationPeriod: 90,
    workLocation: "Alger",
    
    salary: 0,
    currency: "DZD",
    bankName: "",
    bankAccount: "",
    rib: "",
    
    annualLeave: 30,
    sickLeave: 15,
    
    status: "active",
    isActive: true,
    
    cinNumber: "",
    cinExpiry: "",
    passportNumber: "",
    socialSecurityNumber: ""
  });

  const departments = [
    "IT",
    "Finance",
    "Marketing",
    "Ressources Humaines",
    "Commercial",
    "Logistique",
    "Production",
    "Direction"
  ];

  const managers = [
    "Karim Mansouri",
    "Nadia Bensalem",
    "Ahmed Benali",
    "Samira Kaci",
    "Mohamed Slimani"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    setLoading(true);
    try {
      const result = await createEmployeeAction({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        position: formData.position,
        departmentName: formData.department,
        contractType: formData.contractType,
        hireDate: formData.hireDate,
        salary: Number(formData.salary) || 0,
      });

      if (!result.success) {
        toast.error(result.message || "Création impossible");
        return;
      }

      toast.success("Employé créé avec succès !");
      router.push("/dashboard/hr/employees");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/hr/employees"
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-zinc-500" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <UserPlus className="text-indigo-500" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    Nouvel employé
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Ajoutez un nouveau collaborateur
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              href="/dashboard/hr/employees"
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <XCircle size={18} />
              Annuler
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Enregistrer
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Camera size={14} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Photo de profil</p>
                <p className="text-xs text-zinc-500">Format recommandé: JPG, PNG (max 2MB)</p>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <User size={18} className="text-indigo-500" />
                Informations personnelles
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Prénom *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="Ahmed"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nom *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="Benali"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email professionnel *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="ahmed.benali@velora.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="+213 555 123 456"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date de naissance</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Lieu de naissance</label>
                <input
                  type="text"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="Alger"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Adresse</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm resize-none"
                  placeholder="15 Rue Didouche Mourad, Alger"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nationalité</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Briefcase size={18} className="text-indigo-500" />
                Informations professionnelles
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Poste *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="Développeur Full Stack"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Département *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  required
                >
                  <option value="">Sélectionner</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Manager</label>
                <select
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                >
                  <option value="">Sélectionner</option>
                  {managers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date d'embauche *</label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type de contrat *</label>
                <select
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                >
                  <option value="cdi">CDI</option>
                  <option value="cdd">CDD</option>
                  <option value="stage">Stage</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              {formData.contractType === "cdd" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date de fin de contrat</label>
                  <input
                    type="date"
                    name="contractEndDate"
                    value={formData.contractEndDate}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Période d'essai (jours)</label>
                <input
                  type="number"
                  name="probationPeriod"
                  value={formData.probationPeriod}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Lieu de travail</label>
                <input
                  type="text"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="Alger"
                />
              </div>
            </div>
          </div>

          {/* Rémunération */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <DollarSign size={18} className="text-indigo-500" />
                Rémunération
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Salaire brut mensuel *</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="45000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Banque</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                  placeholder="Banque d'Algérie"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Numéro de compte</label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">RIB</label>
                <input
                  type="text"
                  name="rib"
                  value={formData.rib}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Congés */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-indigo-500" />
                Congés
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Congés annuels (jours)</label>
                <input
                  type="number"
                  name="annualLeave"
                  value={formData.annualLeave}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Congés maladie (jours)</label>
                <input
                  type="number"
                  name="sickLeave"
                  value={formData.sickLeave}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" />
                Documents
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Numéro CIN</label>
                <input
                  type="text"
                  name="cinNumber"
                  value={formData.cinNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date d'expiration CIN</label>
                <input
                  type="date"
                  name="cinExpiry"
                  value={formData.cinExpiry}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Numéro de sécurité sociale</label>
                <input
                  type="text"
                  name="socialSecurityNumber"
                  value={formData.socialSecurityNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Passeport (optionnel)</label>
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-indigo-500" />
                Statut
              </h2>
            </div>
            <div className="p-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked, status: e.target.checked ? "active" : "inactive" }))}
                  className="w-5 h-5 rounded border-zinc-300 text-indigo-600"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">Employé actif</span>
                  <p className="text-xs text-zinc-500">L'employé peut se connecter et accéder au système</p>
                </div>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}