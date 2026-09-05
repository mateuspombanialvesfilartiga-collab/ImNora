import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import {
  Briefcase,
  Star,
  CheckCircle2,
  ShieldCheck,
  Search,
  Building2,
  MapPin,
  ArrowRight
} from 'lucide-react';

interface SellersViewProps {
  onOpenSellerProfile: (sellerId: string) => void;
}

export const SellersView: React.FC<SellersViewProps> = ({ onOpenSellerProfile }) => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (state) params.set('state', state);

      const res = await apiRequest<{ sellers: any[] }>(`/api/sellers?${params.toString()}`);
      setSellers(res.sellers);
    } catch (err) {
      console.error('Error fetching sellers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [state]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSellers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Corretores Autônomos Verificados
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Profissionais com CRECI conferido e reputação construída pelas avaliações de compradores e proprietários no elo.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome do corretor, número de CRECI ou região..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
          >
            <option value="">Todos os Estados</option>
            <option value="SP">São Paulo (SP)</option>
            <option value="RJ">Rio de Janeiro (RJ)</option>
            <option value="MG">Minas Gerais (MG)</option>
          </select>

          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Carregando corretores autônomos...</div>
      ) : sellers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Nenhum corretor encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              onClick={() => onOpenSellerProfile(seller.id)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  {seller.photo_url ? (
                    <img
                      src={seller.photo_url}
                      alt={seller.full_name}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center shrink-0">
                      {seller.full_name.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
                        {seller.full_name}
                      </h3>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3" />
                        CRECI Verificado
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      CRECI {seller.creci_number}-{seller.creci_state}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {seller.rating_avg.toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{seller.reviews_count} avaliações</span>
                    </div>
                  </div>
                </div>

                {seller.bio && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {seller.bio}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  <strong>{seller.sales_count}</strong> vendas no elo
                </span>
                <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Ver perfil &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
