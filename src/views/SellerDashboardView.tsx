import React, { useState, useEffect } from 'react';
import { SellerApplication, Property } from '../types.js';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Briefcase,
  Star,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  Send,
  ShieldCheck,
  AlertCircle,
  Calculator,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

interface SellerDashboardViewProps {
  onSelectProperty: (property: Property) => void;
  onOpenApply: (property: Property) => void;
  onStartChat: (recipientId: string) => void;
}

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({
  onSelectProperty,
  onOpenApply,
  onStartChat
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'my_applications' | 'represented'>('opportunities');
  const [opportunities, setOpportunities] = useState<Property[]>([]);
  const [myApplications, setMyApplications] = useState<SellerApplication[]>([]);
  const [representedProperties, setRepresentedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isApproved = user?.sellerVerifiedStatus === 'approved';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [oppRes, myAppRes, repRes] = await Promise.all([
        apiRequest<{ properties: Property[] }>('/api/properties?status=published_open'),
        apiRequest<{ applications: SellerApplication[] }>('/api/applications/seller/my-applications'),
        apiRequest<{ properties: Property[] }>('/api/applications/seller/my-properties')
      ]);
      setOpportunities(oppRes.properties);
      setMyApplications(myAppRes.applications);
      setRepresentedProperties(repRes.properties);
    } catch (err) {
      console.error('Error loading seller dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Tem certeza que deseja retirar sua candidatura deste imóvel?')) return;
    try {
      await apiRequest(`/api/applications/${applicationId}/withdraw`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao retirar candidatura.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Painel do Corretor Autônomo
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Encontre novos imóveis para vender, defina sua margem de comissão e atenda compradores qualificados.
          </p>
        </div>

        {/* Verification Status Badge */}
        <div>
          {isApproved ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              CRECI Aprovado & Verificado
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600" />
              CRECI em Análise pela Administração
            </div>
          )}
        </div>
      </div>

      {!isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Cadastro sob Análise de Documentos</div>
            <p className="mt-1 leading-relaxed">
              Para garantir a segurança dos proprietários e compradores, nosso time administrativo está validando seus dados de CRECI.
              Enquanto isso, você pode explorar as oportunidades abertas na plataforma.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'opportunities'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Oportunidades Abertas ({opportunities.length})
        </button>

        <button
          onClick={() => setActiveTab('my_applications')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'my_applications'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          Minhas Candidaturas ({myApplications.length})
        </button>

        <button
          onClick={() => setActiveTab('represented')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'represented'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Imóveis que Represento ({representedProperties.length})
        </button>
      </div>

      {/* Tab 1: Opportunities */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Imóveis publicados por proprietários aguardando propostas de comissão de corretores autônomos.
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Carregando oportunidades...</div>
          ) : opportunities.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              Nenhuma oportunidade aberta no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-3">
                    <img
                      src={prop.primary_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'}
                      alt={prop.title}
                      className="w-full h-36 rounded-xl object-cover"
                    />

                    <div>
                      <div className="text-lg font-bold text-slate-900">{formatCurrency(prop.price)}</div>
                      <h4 className="font-semibold text-slate-800 text-xs line-clamp-1">{prop.title}</h4>
                      <p className="text-[11px] text-slate-500">{prop.neighborhood}, {prop.city}</p>
                    </div>

                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                      <div className="text-[10px] text-amber-700">Comissão sugerida a 4.5%:</div>
                      <div className="font-bold text-sm text-amber-900">
                        {formatCurrency((prop.price * 4.5) / 100)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenApply(prop)}
                    disabled={!isApproved}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    {isApproved ? 'Candidatar-se com Comissão' : 'Aguardando Aprovação de CRECI'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Applications */}
      {activeTab === 'my_applications' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Acompanhe a resposta dos proprietários às suas propostas de comissão.
          </div>

          <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {myApplications.map((app) => {
              const isAccepted = app.status === 'accepted';
              const isRejected = app.status === 'rejected';
              const isPending = app.status === 'submitted' || app.status === 'under_review';

              return (
                <div key={app.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={app.property_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'}
                      alt="prop"
                      className="w-16 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{app.property_title}</div>
                      <div className="text-xs text-slate-500">
                        {app.property_neighborhood}, {app.property_city} • {app.property_price ? formatCurrency(app.property_price) : ''}
                      </div>
                      <div className="text-xs pt-1">
                        Sua comissão proposta: <strong className="text-slate-900">{app.commission_percent}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isAccepted ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      isRejected ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {isAccepted ? 'Candidatura Aceita!' : isRejected ? 'Não Selecionada' : 'Em Avaliação'}
                    </span>

                    {isPending && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        Retirar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Represented Properties */}
      {activeTab === 'represented' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Imóveis onde sua candidatura foi aceita pelo proprietário. Você é o representante oficial.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {representedProperties.map((prop) => (
              <div key={prop.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src={prop.primary_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'}
                    alt={prop.title}
                    className="w-20 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{prop.title}</h4>
                    <div className="text-xs text-slate-500">{prop.neighborhood}, {prop.city}</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      {formatCurrency(prop.price)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Proprietário: <strong>{prop.owner_name}</strong>
                  </span>
                  <button
                    onClick={() => onStartChat(prop.owner_id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Falar com Proprietário
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
