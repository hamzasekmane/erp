"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Check, Search, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { addClientsToGroupAction } from "@/app/actions/clientGroupActions";

interface AddClientsModalProps {
  groupId: string;
  token: string;
  existingClientIds: string[];
}

interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  balance?: number;
  code?: string;
}

export default function AddClientsModal({ groupId, token, existingClientIds }: AddClientsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  // Rechercher des clients
  const searchClients = async () => {
    if (!search.trim()) {
      toast.error("Veuillez entrer un terme de recherche");
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      console.log("🔍 Recherche de clients avec le terme:", search);
      
      const res = await fetch(`${API_URL}/clients?search=${encodeURIComponent(search)}&limit=20`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        console.error("Erreur API:", res.status, res.statusText);
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("📦 Données reçues:", data);
      
      // Gérer différents formats de réponse
      let clientsList: Client[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        clientsList = data.data;
      } else if (Array.isArray(data)) {
        clientsList = data;
      } else if (data.clients && Array.isArray(data.clients)) {
        clientsList = data.clients;
      }
      
      console.log(`📊 ${clientsList.length} clients trouvés au total`);
      
      // Filtrer les clients déjà dans le groupe
      const filteredClients = clientsList.filter(
        (client: Client) => !existingClientIds.includes(client._id)
      );
      
      console.log(`✅ ${filteredClients.length} nouveaux clients disponibles`);
      setClients(filteredClients);
      
      if (filteredClients.length === 0) {
        if (clientsList.length > 0) {
          toast.info("Tous les clients trouvés sont déjà dans ce groupe");
        } else {
          toast.info("Aucun client trouvé avec ces critères");
        }
      }
    } catch (error) {
      console.error("❌ Erreur recherche clients:", error);
      toast.error("Erreur lors de la recherche. Vérifiez que le serveur est en cours d'exécution.");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter les clients sélectionnés
  const addClients = async () => {
    if (selectedClients.length === 0) {
      toast.error("Sélectionnez au moins un client");
      return;
    }

    setIsAdding(true);
    try {
      console.log("📤 Ajout des clients au groupe:", selectedClients);
      const result = await addClientsToGroupAction(groupId, selectedClients);
      
      if (result.success) {
        toast.success(`${selectedClients.length} client(s) ajouté(s) au groupe`);
        setIsOpen(false);
        setSelectedClients([]);
        setClients([]);
        setSearch("");
        setHasSearched(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      console.error("❌ Erreur ajout clients:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsAdding(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchClients();
    }
  };

  return (
    <>
      {/* Bouton pour ouvrir le modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-[10px] font-black uppercase tracking-wider text-cyan-400 transition-all"
      >
        <UserPlus size={14} />
        Ajouter des clients
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-gradient-to-br from-zinc-900 to-black border border-cyan-500/30 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl">
                  <UserPlus size={20} className="text-cyan-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Ajouter des clients
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearch("");
                  setClients([]);
                  setSelectedClients([]);
                  setHasSearched(false);
                }}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Rechercher un client par nom, email ou téléphone..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-colors"
                  autoFocus
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>
              <button
                onClick={searchClients}
                disabled={isLoading || !search.trim()}
                className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-[10px] font-black text-cyan-400 uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Recherche...
                  </>
                ) : (
                  "Rechercher"
                )}
              </button>
            </div>

            {/* Résultats */}
            {hasSearched && (
              <div className="mb-2 flex justify-between items-center px-2">
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">
                  {clients.length} client(s) trouvé(s)
                </span>
                {selectedClients.length > 0 && (
                  <span className="text-[8px] text-cyan-400">
                    {selectedClients.length} sélectionné(s)
                  </span>
                )}
              </div>
            )}

            {/* Liste des clients */}
            <div className="max-h-96 overflow-y-auto space-y-2 mb-6 custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="text-cyan-400 animate-spin" />
                </div>
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <label
                    key={client._id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedClients.includes(client._id)
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client._id)}
                        onChange={() => toggleClient(client._id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedClients.includes(client._id)
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-zinc-500'
                      }`}>
                        {selectedClients.includes(client._id) && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{client.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {client.email || client.phone || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-cyan-400 font-bold">
                        {(client.balance || 0).toLocaleString()} DA
                      </span>
                      {client.code && (
                        <p className="text-[8px] text-zinc-500">{client.code}</p>
                      )}
                    </div>
                  </label>
                ))
              ) : hasSearched ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 text-sm font-bold mb-1">Aucun client trouvé</p>
                  <p className="text-[8px] text-zinc-600">
                    {search ? `Aucun résultat pour "${search}"` : "Essayez d'autres termes de recherche"}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-xs">Recherchez des clients à ajouter au groupe</p>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearch("");
                  setClients([]);
                  setSelectedClients([]);
                  setHasSearched(false);
                }}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black text-zinc-400 uppercase tracking-wider transition-all"
              >
                Annuler
              </button>
              <button
                onClick={addClients}
                disabled={isAdding || selectedClients.length === 0}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-xs font-black text-white uppercase tracking-wider hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    Ajouter ({selectedClients.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles pour la scrollbar personnalisée */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </>
  );
}