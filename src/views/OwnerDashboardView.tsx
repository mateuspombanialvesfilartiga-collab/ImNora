import React, { useState, useEffect } from 'react';
import { Property } from '../types.js';
import { apiRequest } from '../api/client.js';
import {
  KeyRound,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  MessageSquare,
  Award,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface OwnerDashboardViewProps {
  onOpenNewProperty: () => void;
  onOpenDispute: (propertyId: string) => void;
  onOpenConcludeSale: (property: Property) => void;
  onStartChatWithSeller: (sellerId: string) => void;
  onOpenReviewModal: (negotiationId: string, sellerName: string, propTitle: string) => void;
}

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({
  onOpenNewProperty,
  onOpenDispute,
  onOpenConcludeSale,
  onStartChatWithSeller,
  onOpenReviewModal
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [propsRes, revsRes] = await Promise.all([
        apiRequest<{ properties: Property[] }>('/api/properties/owner/my-properties'),
        apiRequest<{ pendingReviews: any[] }>('/api/negotiations/pending-reviews')
      ]);
      setProperties(propsRes.properties);
      setPendingReviews(revsRes.pendingReviews);
    } catch (err) {
      console.error('Error loading owner dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Painel do Proprietário
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie seus anúncios, compare propostas de corretores autônomos e acompanhe a venda dos seus imóveis.
          </p>
        </div>

        <button
          onClick={onOpenNewProperty}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Anunciar Novo Imóvel
        </button>
      </div>

      {/* Pending Reviews Alert if sale was completed */}
      {pendingReviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <Award className="w-4 h-4 text-amber-600" />
            Venda Concluída! Deixe sua avaliação sobre o corretor
          </div>
          <div className="space-y-2">
            {pendingReviews.map((rev) => (
              <div key={rev.negotiation_id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200/70 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{rev.property_title}</span>
                  <span className="text-slate-500 block text-[11px]">Corretor: {rev.seller_name} ({rev.creci_number}-{rev.creci_state})</span>
                </div>
                <button
                  onClick={() => onOpenReviewModal(rev.negotiation_id, rev.seller_name, rev.property_title)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition-colors"
                >
                  Avaliar Corretor
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Properties List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Seus Imóveis Cadastrados ({properties.length})</h2>
          <button onClick={fetchData} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Carregando seus imóveis...</div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Você ainda não anunciou nenhum imóvel</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Publique seu imóvel em poucos minutos e comece a receber propostas com diferentes comissões de corretores autônomos.
            </p>
            <button
              onClick={onOpenNewProperty}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              Anunciar Primeiro Imóvel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {properties.map((prop) => {
              const isOpen = prop.status === 'published_open';
              const isSelected = prop.status === 'seller_selected' || prop.status === 'in_negotiation';
              const isSold = prop.status === 'sold';

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={prop.primary_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'}
                      alt={prop.title}
                      className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">{prop.title}</h3>
                        {isOpen && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Disputa de Corretores Ativa
                          </span>
                        )}
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Corretor Ativo
                          </span>
                        )}
                        {isSold && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            Vendido
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500">
                        {prop.neighborhood}, {prop.city} • <strong className="text-slate-900 font-bold">{formatCurrency(prop.price)}</strong>
                      </div>

                      {/* Representation summary */}
                      <div className="text-xs pt-1">
                        {isOpen ? (
                          <span className="text-amber-700 font-semibold">
                            🔥 {prop.open_applications_count || 0} propostas de corretores recebidas
                          </span>
                        ) : isSelected && prop.seller_name ? (
                          <span className="text-slate-600">
                            Representado por: <strong className="text-slate-900">{prop.seller_name}</strong> (CRECI {prop.seller_creci})
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    {isOpen && (
                      <button
                        onClick={() => onOpenDispute(prop.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Ver Candidatos ({prop.open_applications_count || 0})
                      </button>
                    )}

                    {isSelected && (
                      <>
                        <button
                          onClick={() => onOpenDispute(prop.id)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Detalhes da Disputa
                        </button>

                        {prop.assigned_seller_id && (
                          <button
                            onClick={() => onStartChatWithSeller(prop.assigned_seller_id!)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Chat Corretor
                          </button>
                        )}

                        <button
                          onClick={() => onOpenConcludeSale(prop)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Concluir Venda
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
