import React, { useState, useEffect } from 'react';
import { SellerApplication, Property } from '../types.js';
import { apiRequest } from '../api/client.js';
import {
  X,
  Star,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Award
} from 'lucide-react';

interface OwnerApplicationsViewProps {
  propertyId: string;
  onClose: () => void;
  onBrokerSelected?: () => void;
  onApplicationAccepted?: () => void;
  onStartChatWithSeller?: (sellerId: string) => void;
}

export const OwnerApplicationsView: React.FC<OwnerApplicationsViewProps> = ({
  propertyId,
  onClose,
  onBrokerSelected,
  onApplicationAccepted,
  onStartChatWithSeller
}) => {
  const [data, setData] = useState<{ property: Property; applications: SellerApplication[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [confirmModalApp, setConfirmModalApp] = useState<SellerApplication | null>(null);
  const [reopening, setReopening] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'commission' | 'sales'>('rating');

  const notifySelection = () => {
    if (onBrokerSelected) onBrokerSelected();
    if (onApplicationAccepted) onApplicationAccepted();
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ property: Property; applications: SellerApplication[] }>(
        `/api/applications/properties/${propertyId}/applications`
      );
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar candidaturas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [propertyId]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleConfirmAccept = async (application: SellerApplication) => {
    setAcceptingId(application.id);
    setError(null);
    try {
      await apiRequest(`/api/applications/${application.id}/accept`, { method: 'POST' });
      setConfirmModalApp(null);
      await fetchApplications();
      notifySelection();
    } catch (err: any) {
      setError(err.message || 'Erro ao selecionar corretor.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReopen = async () => {
    if (!confirm('Deseja reabrir este imóvel para novas candidaturas de corretores autônomos? O corretor atual perderá a representação exclusiva.')) {
      return;
    }
    setReopening(true);
    try {
      await apiRequest(`/api/properties/${propertyId}/reopen`, { method: 'POST' });
      await fetchApplications();
      notifySelection();
    } catch (err: any) {
      setError(err.message || 'Erro ao reabrir candidaturas.');
    } finally {
      setReopening(false);
    }
  };

  const sortedApplications = data?.applications ? [...data.applications].sort((a, b) => {
    if (a.status === 'accepted') return -1;
    if (b.status === 'accepted') return 1;
    if (sortBy === 'rating') {
      return (b.seller_rating || 0) - (a.seller_rating || 0);
    } else if (sortBy === 'commission') {
      return a.commission_percent - b.commission_percent;
    } else {
      return (b.seller_sales_count || 0) - (a.seller_sales_count || 0);
    }
  }) : [];

  const acceptedApplication = data?.applications.find(a => a.status === 'accepted');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#F8FAFC] rounded-2xl max-w-6xl w-full h-[90vh] shadow-2xl border border-slate-200 relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Navbar / Header inside the modal view */}
        <div className="h-14 bg-[#0F172A] border-b border-slate-700/90 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-white">
              elo<span className="text-emerald-400">.</span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline-block">
              Gestão de Disputas & Candidaturas
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-[11px] text-slate-200 uppercase font-bold tracking-wider">Proprietário</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body with Sidebar + Content matching Professional Polish */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar (Left) */}
          <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col gap-5 shrink-0 overflow-y-auto">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Imóvel Selecionado
              </h3>
              <p className="text-lg font-bold leading-tight text-slate-900">
                {data?.property.title || 'Carregando imóvel...'}
              </p>
              <p className="text-xs text-slate-500 italic">
                ID: #{data?.property.id ? data.property.id.substring(0, 8).toUpperCase() : 'ELO-0000'}
              </p>
            </div>

            <div className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden relative">
              {data?.property.primary_image ? (
                <img
                  src={data.property.primary_image}
                  alt={data.property.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-medium">Foto Principal</span>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Valor Venda</span>
                <span className="font-bold text-slate-900">
                  {data ? formatCurrency(data.property.price) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Status</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                  data?.property.status === 'published_open'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {data?.property.status === 'published_open' ? 'Aberto a Candidaturas' : 'Representante Escolhido'}
                </span>
              </div>
              {data?.property.city && (
                <div className="flex justify-between text-xs items-center text-slate-500 pt-1 border-t border-slate-100">
                  <span>Localização:</span>
                  <span className="font-medium text-slate-700">{data.property.neighborhood}, {data.property.city}</span>
                </div>
              )}
            </div>

            {acceptedApplication ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Corretor Oficial Atribuído
                </div>
                <p className="text-xs text-emerald-800">
                  <strong>{acceptedApplication.seller_name}</strong> representa este imóvel com taxa de comissão de <strong>{acceptedApplication.commission_percent}%</strong>.
                </p>
                <button
                  onClick={handleReopen}
                  disabled={reopening}
                  className="w-full mt-2 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${reopening ? 'animate-spin' : ''}`} />
                  Reabrir para Disputa
                </button>
              </div>
            ) : (
              <div className="mt-auto p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  Você recebeu <strong>{data?.applications.length || 0} propostas</strong> de vendedores para este imóvel.
                </p>
              </div>
            )}
          </div>

          {/* Main Content Area (Right) */}
          <div className="flex-1 p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Candidaturas de Vendedores</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Analise o perfil, histórico e comissão proposta por cada profissional.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 self-start sm:self-auto">
                <span className="font-medium">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-semibold text-xs text-slate-800 shadow-2xs"
                >
                  <option value="rating">Maior Nota</option>
                  <option value="commission">Menor Comissão</option>
                  <option value="sales">Mais Vendas</option>
                </select>
              </div>
            </header>

            {/* Table Container */}
            <div className="flex-1 overflow-auto bg-white rounded-2xl border border-slate-200 shadow-xs min-h-[300px]">
              {isLoading ? (
                <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-[#0F172A] rounded-full animate-spin"></div>
                  <span>Carregando candidaturas...</span>
                </div>
              ) : sortedApplications.length === 0 ? (
                <div className="py-20 text-center px-4 space-y-3">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">Nenhuma candidatura recebida ainda</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Seu imóvel está visível na aba de oportunidades dos corretores autônomos credenciados. As propostas com percentual de comissão aparecerão nesta tabela.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Vendedor</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nota / Histórico</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">CRECI</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Comissão</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {sortedApplications.map((app) => {
                      const isAccepted = app.status === 'accepted';
                      const isRejected = app.status === 'rejected';

                      return (
                        <tr
                          key={app.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isAccepted ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          {/* Vendedor */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {app.seller_photo ? (
                                <img
                                  src={app.seller_photo}
                                  alt={app.seller_name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {app.seller_name ? app.seller_name.charAt(0).toUpperCase() : 'V'}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {app.seller_name}
                                </span>
                                {app.message ? (
                                  <p className="text-xs text-slate-500 italic max-w-xs truncate mt-0.5" title={app.message}>
                                    "{app.message}"
                                  </p>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Corretor autônomo elo</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Nota / Histórico */}
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                                ★ {app.seller_rating ? app.seller_rating.toFixed(1) : '5.0'}
                                <span className="text-slate-400 font-normal text-[11px]">
                                  ({app.seller_reviews_count || 0} avaliações)
                                </span>
                              </span>
                              <span className="text-slate-500 text-[10px] uppercase font-bold mt-1">
                                {app.seller_sales_count || 0} vendas no elo
                              </span>
                            </div>
                          </td>

                          {/* CRECI */}
                          <td className="p-4">
                            <span className="font-mono text-xs text-slate-700 bg-slate-100/80 px-2 py-1 rounded border border-slate-200">
                              CRECI-{app.seller_creci_state} {app.seller_creci}
                            </span>
                          </td>

                          {/* Comissão */}
                          <td className="p-4 text-center">
                            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                              {app.commission_percent}%
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-medium">
                              ≈ {formatCurrency(app.estimatedCommissionValue || 0)}
                            </div>
                          </td>

                          {/* Ação */}
                          <td className="p-4 text-right">
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Escolhido
                              </span>
                            ) : isRejected ? (
                              <span className="text-xs text-slate-400 font-medium">
                                Não selecionado
                              </span>
                            ) : (
                              <button
                                id={`select-broker-btn-${app.id}`}
                                onClick={() => setConfirmModalApp(app)}
                                className="bg-[#0F172A] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-800 shadow-xs transition-colors"
                              >
                                Escolher Vendedor
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer matching Professional Polish */}
            <footer className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 border-t border-slate-200 pt-4 gap-2">
              <p>© 2024 Elo Marketplace Imobiliário. Sistema de taxas dinâmico ativo.</p>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                {sortedApplications.length} Vendedores Disponíveis na sua região
              </span>
            </footer>
          </div>
        </main>

        {/* Confirmation Modal before Atomic Acceptance */}
        {confirmModalApp && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Confirmar Escolha de Vendedor</h3>
                  <p className="text-xs text-slate-500">Transação atômica de exclusividade</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Corretor:</span>
                  <span className="font-bold text-slate-900">{confirmModalApp.seller_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CRECI:</span>
                  <span className="font-bold text-slate-900">{confirmModalApp.seller_creci}-{confirmModalApp.seller_creci_state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Comissão Acordada:</span>
                  <span className="font-bold text-emerald-700 text-sm">{confirmModalApp.commission_percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor Estimado:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(confirmModalApp.estimatedCommissionValue || 0)}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  O que acontece agora:
                </div>
                <p>
                  1. {confirmModalApp.seller_name} torna-se o representante oficial deste imóvel.<br />
                  2. As outras candidaturas serão encerradas automaticamente.<br />
                  3. O anúncio passará a exibir o corretor publicamente aos compradores.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmModalApp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Voltar
                </button>
                <button
                  id="confirm-broker-selection-btn"
                  onClick={() => handleConfirmAccept(confirmModalApp)}
                  disabled={acceptingId !== null}
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {acceptingId ? 'Processando transação...' : 'Confirmar e Selecionar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

