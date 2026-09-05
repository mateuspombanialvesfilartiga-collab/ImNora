import React, { useState, useEffect } from 'react';
import { Property } from '../types.js';
import { apiRequest } from '../api/client.js';
import {
  Home,
  Heart,
  MessageSquare,
  Award,
  Search,
  Building2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface BuyerDashboardViewProps {
  onSelectProperty: (property: Property) => void;
  onOpenExplore: () => void;
  onOpenChat: () => void;
  onOpenReviewModal: (negotiationId: string, sellerName: string, propTitle: string) => void;
}

export const BuyerDashboardView: React.FC<BuyerDashboardViewProps> = ({
  onSelectProperty,
  onOpenExplore,
  onOpenChat,
  onOpenReviewModal
}) => {
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiRequest<{ pendingReviews: any[] }>('/api/negotiations/pending-reviews');
        setPendingReviews(res.pendingReviews);
      } catch (err) {
        console.error('Error fetching buyer reviews:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
              <Home className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Painel do Comprador
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Encontre imóveis com corretores credenciados, agende visitas e acompanhe suas negociações.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenChat}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ver Mensagens
          </button>
          <button
            onClick={onOpenExplore}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            Explorar Imóveis
          </button>
        </div>
      </div>

      {/* Pending Reviews Alert if purchase was concluded */}
      {pendingReviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <Award className="w-4 h-4 text-amber-600" />
            Parabéns pela aquisição! Como foi o atendimento do corretor responsável?
          </div>
          <div className="space-y-2">
            {pendingReviews.map((rev) => (
              <div key={rev.negotiation_id} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-amber-200/70 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{rev.property_title}</span>
                  <span className="text-slate-500 block text-[11px]">Corretor: {rev.seller_name} ({rev.creci_number}-{rev.creci_state})</span>
                </div>
                <button
                  onClick={() => onOpenReviewModal(rev.negotiation_id, rev.seller_name, rev.property_title)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition-colors"
                >
                  Avaliar Atendimento
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buyer Quick Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Corretores Verificados</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Todos os imóveis representados têm um corretor com CRECI ativo e conferido pela administração do elo.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Comunicação Segura</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fale diretamente com o profissional responsável pelo imóvel através do chat protegido do elo.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Reputação Real</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consulte o histórico de avaliações reais de outros compradores antes de agendar sua visita.
          </p>
        </div>
      </div>
    </div>
  );
};
