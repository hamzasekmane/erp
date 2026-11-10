"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Shield,
  Lock,
  Calendar,
  Zap,
  Rocket,
  Crown,
  Users,
  Database,
  Headphones,
  FileText,
  Receipt,
  ArrowRight,
  Sparkles,
  Heart,
  Gift
} from "lucide-react";

// Plans disponibles
const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    period: "mois",
    description: "Parfait pour les petites entreprises",
    features: [
      "Jusqu'à 10 utilisateurs",
      "5 Go de stockage",
      "Support par email",
      "API basique",
      "1 entreprise",
      "Factures illimitées"
    ],
    color: "from-blue-500/20 to-blue-500/5",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-500",
    buttonColor: "bg-blue-500",
    popular: false
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    period: "mois",
    description: "Idéal pour les entreprises en croissance",
    features: [
      "Jusqu'à 50 utilisateurs",
      "50 Go de stockage",
      "Support prioritaire 24/7",
      "API complète",
      "Multi-entreprises",
      "Factures illimitées",
      "Rapports avancés",
      "Export PDF/Excel"
    ],
    color: "from-[var(--accent)]/20 to-[var(--accent)]/5",
    borderColor: "border-[var(--accent)]/50",
    textColor: "text-[var(--accent)]",
    buttonColor: "bg-[var(--accent)]",
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 249,
    period: "mois",
    description: "Pour les grandes organisations",
    features: [
      "Utilisateurs illimités",
      "500 Go de stockage",
      "Support dédié 24/7",
      "API personnalisée",
      "Multi-entreprises",
      "Factures illimitées",
      "Analytique avancée",
      "SLA garantie",
      "Formation incluse"
    ],
    color: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-500",
    buttonColor: "bg-purple-500",
    popular: false
  }
];

// Périodes d'abonnement
const periods = [
  { id: "monthly", name: "Mensuel", discount: 0, suffix: "/mois" },
  { id: "yearly", name: "Annuel", discount: 20, suffix: "/an", popular: true }
];

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [formData, setFormData] = useState({
    companyName: "",
    vatNumber: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
    firstName: "",
    lastName: ""
  });
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: ""
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedPlanData = plans.find(p => p.id === selectedPlan)!;
  const selectedPeriodData = periods.find(p => p.id === selectedPeriod)!;
  
  const calculatePrice = () => {
    let price = selectedPlanData.price;
    if (selectedPeriod === "yearly") {
      price = price * 12;
      price = price * (1 - selectedPeriodData.discount / 100);
    }
    return Math.round(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (e.target.name === "number") {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) value = value.slice(0, 19);
    }
    
    if (e.target.name === "expiry") {
      value = value.replace(/\//g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      if (value.length > 5) value = value.slice(0, 5);
    }
    
    if (e.target.name === "cvc" && value.length > 4) value = value.slice(0, 4);
    
    setCardData({
      ...cardData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Simulation de succès
      setMessage({ type: 'success', text: 'Abonnement créé avec succès ! Redirection...' });
      setTimeout(() => {
        router.push('/dashboard/subscription');
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la création de l\'abonnement' });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = calculatePrice();
  const yearlySavings = selectedPeriod === "yearly" 
    ? (selectedPlanData.price * 12) - totalPrice 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
        {/* HEADER SECTION */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/subscription"
            className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
          >
            <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
          </Link>
          <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
            <Rocket size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                VELORA • NEW_SUBSCRIPTION
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                ● CHECKOUT
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
              Créer un <span className="text-[var(--accent)]">Abonnement</span>
            </h1>
            <p className="text-xs text-[var(--foreground-muted)] font-mono">
              Choisissez votre formule et commencez votre aventure
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
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-black transition-all ${
                step >= s 
                  ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30' 
                  : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground-muted)]'
              }`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 mx-2 transition-all ${
                  step > s ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Select Plan */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                      <Crown size={16} className="text-[var(--accent)]" />
                    </div>
                    <h2 className="text-lg font-black">Choisissez votre formule</h2>
                  </div>
                  
                  {/* Period Toggle */}
                  <div className="flex gap-3 mb-6 p-1 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                    {periods.map((period) => (
                      <button
                        key={period.id}
                        onClick={() => setSelectedPeriod(period.id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all relative ${
                          selectedPeriod === period.id
                            ? 'bg-[var(--accent)] text-white shadow-lg'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {period.name}
                        {period.discount > 0 && (
                          <span className="absolute -top-2 -right-1 text-[8px] font-black px-1.5 py-0.5 bg-amber-500 text-white rounded-full">
                            -{period.discount}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                          selectedPlan === plan.id
                            ? `${plan.borderColor} bg-gradient-to-br ${plan.color}`
                            : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-2 -right-2">
                            <div className="bg-[var(--accent)] text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                              POPULAIRE
                            </div>
                          </div>
                        )}
                        <h3 className="font-black mb-1">{plan.name}</h3>
                        <div className="mb-2">
                          <span className="text-2xl font-black">{plan.price}€</span>
                          <span className="text-xs text-[var(--foreground-muted)]">
                            {selectedPeriod === "yearly" ? "/an" : "/mois"}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--foreground-muted)]">{plan.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Company Information */}
            {step === 2 && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                    <Building2 size={16} className="text-[var(--accent)]" />
                  </div>
                  <h2 className="text-lg font-black">Informations société</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Nom de la société *</label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">N° TVA (optionnel)</label>
                    <div className="relative">
                      <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                      <input
                        type="text"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Email *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Téléphone *</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1">Adresse *</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-3 text-[var(--foreground-muted)]" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Ville *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Code postal *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Pays *</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option>France</option>
                      <option>Belgique</option>
                      <option>Suisse</option>
                      <option>Canada</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Information */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                      <CreditCard size={16} className="text-[var(--accent)]" />
                    </div>
                    <h2 className="text-lg font-black">Informations de paiement</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Numéro de carte *</label>
                      <div className="relative">
                        <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                        <input
                          type="text"
                          name="number"
                          value={cardData.number}
                          onChange={handleCardChange}
                          placeholder="4242 4242 4242 4242"
                          className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] font-mono"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Date d'expiration *</label>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                          <input
                            type="text"
                            name="expiry"
                            value={cardData.expiry}
                            onChange={handleCardChange}
                            placeholder="MM/YY"
                            className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] font-mono"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">CVC *</label>
                        <div className="relative">
                          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                          <input
                            type="text"
                            name="cvc"
                            value={cardData.cvc}
                            onChange={handleCardChange}
                            placeholder="123"
                            className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] font-mono"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Nom sur la carte *</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                        <input
                          type="text"
                          name="name"
                          value={cardData.name}
                          onChange={handleCardChange}
                          placeholder="John DOE"
                          className="w-full pl-9 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Security Notice */}
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <Shield size={18} className="text-emerald-500" />
                  <div>
                    <p className="text-xs font-medium">Paiement 100% sécurisé</p>
                    <p className="text-[9px] text-[var(--foreground-muted)]">Vos informations bancaires sont cryptées et sécurisées</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[var(--accent)]/20 rounded-lg">
                    <Receipt size={16} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="font-black">Récapitulatif</h3>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--foreground-muted)]">Plan {selectedPlanData.name}</span>
                    <span className="text-sm font-medium">
                      {selectedPeriod === "yearly" 
                        ? `${selectedPlanData.price * 12}€` 
                        : `${selectedPlanData.price}€`}
                    </span>
                  </div>
                  
                  {selectedPeriod === "yearly" && (
                    <div className="flex justify-between text-emerald-500">
                      <span className="text-sm">Réduction annuelle (-20%)</span>
                      <span className="text-sm font-medium">-{yearlySavings}€</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Taxes (20% VAT)</span>
                    <span>Inclus</span>
                  </div>
                  
                  <div className="border-t border-[var(--border)] pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-black">Total</span>
                      <span className="text-2xl font-black text-[var(--accent)]">{totalPrice}€</span>
                    </div>
                    <p className="text-[9px] text-[var(--foreground-muted)] text-right">
                      {selectedPeriod === "yearly" ? "par an" : "par mois"}
                    </p>
                  </div>
                </div>
                
                {selectedPeriod === "yearly" && (
                  <div className="mb-4 p-2 bg-emerald-500/10 rounded-lg text-center">
                    <p className="text-[10px] font-medium text-emerald-500">
                      ✨ Économisez {yearlySavings}€ avec l'abonnement annuel
                    </p>
                  </div>
                )}
              </div>
              
              {/* Selected Plan Features */}
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <h4 className="text-sm font-black mb-3">Ce qui est inclus</h4>
                <ul className="space-y-2">
                  {selectedPlanData.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs">
                      <CheckCircle size={12} className="text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Guarantee */}
              <div className="text-center p-4">
                <Heart size={20} className="mx-auto text-rose-500 mb-2" />
                <p className="text-[10px] text-[var(--foreground-muted)]">
                  Satisfaction garantie • Annulation possible à tout moment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-[var(--border)]">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--accent)]/10 transition-colors"
            >
              Retour
            </button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2"
            >
              Continuer
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white rounded-xl text-sm font-medium hover:scale-105 transition-all duration-300 shadow-lg shadow-[var(--accent)]/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Traitement...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Confirmer l'abonnement
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Subscription Creation • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Paiement sécurisé par Stripe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}