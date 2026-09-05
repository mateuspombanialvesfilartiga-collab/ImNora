import React, { useState, useEffect } from 'react';
import { Property } from '../types.js';
import { apiRequest } from '../api/client.js';
import { PropertyCard } from '../components/PropertyCard.js';
import {
  Search,
  Filter,
  Users,
  CheckCircle2,
  Building2,
  MapPin,
  Sparkles,
  Shield,
  ShieldCheck,
  Percent,
  Award,
  Clock,
  ArrowRight,
  PlusCircle,
  Briefcase,
  HelpCircle,
  SlidersHorizontal,
  X,
  BadgePercent,
  Check
} from 'lucide-react';

interface ExploreViewProps {
  onSelectProperty: (property: Property) => void;
  onQuickApply: (property: Property) => void;
  userRole?: string;
  onOpenNewProperty?: () => void;
  onOpenAuth?: (mode: 'login' | 'register', roleHint?: string) => void;
  onNavigate?: (view: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onSelectProperty,
  onQuickApply,
  userRole,
  onOpenNewProperty,
  onOpenAuth,
  onNavigate
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active persona tab for persuasive benefits
  const [activePersona, setActivePersona] = useState<'owner' | 'seller' | 'buyer'>('owner');

  // Filters
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [city, setCity] = useState('');
  const [representationStatus, setRepresentationStatus] = useState<string>('all'); // 'all' | 'open' | 'selected'
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minBedrooms, setMinBedrooms] = useState<string>('');

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (propertyType) params.set('propertyType', propertyType);
      if (city) params.set('city', city);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (minBedrooms) params.set('minBedrooms', minBedrooms);

      if (representationStatus === 'open') {
        params.set('status', 'published_open');
      } else if (representationStatus === 'selected') {
        params.set('status', 'seller_selected');
      }

      const res = await apiRequest<{ properties: Property[] }>(`/api/properties?${params.toString()}`);
      setProperties(res.properties);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [representationStatus, propertyType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  const clearFilters = () => {
    setSearch('');
    setPropertyType('');
    setCity('');
    setRepresentationStatus('all');
    setMinPrice('');
    setMaxPrice('');
    setMinBedrooms('');
    setTimeout(fetchProperties, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* ======================================================== */}
      {/* 1. HERO BANNER: DARK BLUE & WARM BEIGE PERSUASIVE INTRO */}
      {/* ======================================================== */}
      <section className="relative rounded-3xl bg-[#081426] border border-[#1A2E4C] text-[#FAF8F5] overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-14">
        {/* Subtle geometric & light effects */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-[#C5A880]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-[#162D4D]/60 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Persuasive Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F223D] border border-[#C5A880]/40 text-[#C5A880] text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>A Revolução Imobiliária Transparente</span>
          </div>

          {/* Core Compelling Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#FAF8F5] leading-[1.15]">
            Venda ou compre seu imóvel sem os <span className="text-[#C5A880]">6% abusivos</span> das imobiliárias tradicionais.
          </h1>

          {/* Persuasive Sub-headline */}
          <p className="text-base sm:text-lg text-[#D4C3A3] font-normal leading-relaxed max-w-3xl">
            A <strong>Imnora</strong> conecta você diretamente aos melhores corretores autônomos credenciados pelo <strong>CRECI</strong>. 
            Eles disputam a representação do seu imóvel oferecendo comissões menores, dedicação exclusiva e agilidade comprovada.
          </p>

          {/* Key Value Statistics / Conversion Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#0F223D]/80 border border-[#1F3759] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center shrink-0 text-[#C5A880]">
                <BadgePercent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#FAF8F5]">Economia de até 40%</p>
                <p className="text-xs text-[#D4C3A3]">Comissões livres a partir de 3%</p>
              </div>
            </div>

            <div className="bg-[#0F223D]/80 border border-[#1F3759] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center shrink-0 text-[#C5A880]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#FAF8F5]">100% Auditado</p>
                <p className="text-xs text-[#D4C3A3]">Corretores com CRECI validado</p>
              </div>
            </div>

            <div className="bg-[#0F223D]/80 border border-[#1F3759] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center shrink-0 text-[#C5A880]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#FAF8F5]">Venda Mais Rápida</p>
                <p className="text-xs text-[#D4C3A3]">Corretores focados e motivados</p>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              id="hero-publish-property-btn"
              onClick={() => {
                if (onOpenNewProperty) onOpenNewProperty();
                else if (onOpenAuth) onOpenAuth('login');
              }}
              className="px-6 py-3.5 bg-[#C5A880] hover:bg-[#B89563] text-[#081426] font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              Anunciar Meu Imóvel Gratuitamente
            </button>

            <button
              id="hero-register-seller-btn"
              onClick={() => {
                if (onOpenAuth) onOpenAuth('register', 'seller');
                else if (onNavigate) onNavigate('login');
              }}
              className="px-5 py-3.5 bg-[#0F223D] hover:bg-[#162D4D] text-[#FAF8F5] border border-[#2A446B] font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#C5A880]" />
              Quero Vender como Corretor Autônomo
            </button>

            <button
              id="hero-learn-more-btn"
              onClick={() => onNavigate && onNavigate('how_it_works')}
              className="px-4 py-3.5 text-[#D4C3A3] hover:text-[#FAF8F5] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Entenda como funciona</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. PERSUASIVE VALUE PILLARS: WHY CHOOSE IMNORA */}
      {/* ======================================================== */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-[#EFE9DE] text-[#081426] text-xs font-bold uppercase tracking-wider">
            Vantagens Exclusivas Imnora
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#081426]">
            Por que usar a Imnora em vez de uma imobiliária tradicional?
          </h2>
          <p className="text-sm text-[#5C5346]">
            Descubra por que proprietários, corretores autônomos e compradores estão migrando para o nosso ecossistema.
          </p>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-[#EFE9DE] rounded-2xl gap-1 border border-[#E2D7C5]">
            <button
              onClick={() => setActivePersona('owner')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activePersona === 'owner'
                  ? 'bg-[#081426] text-[#FAF8F5] shadow-md'
                  : 'text-[#5C5346] hover:text-[#081426]'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#C5A880]" />
              Para Proprietários
            </button>
            <button
              onClick={() => setActivePersona('seller')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activePersona === 'seller'
                  ? 'bg-[#081426] text-[#FAF8F5] shadow-md'
                  : 'text-[#5C5346] hover:text-[#081426]'
              }`}
            >
              <Briefcase className="w-4 h-4 text-[#C5A880]" />
              Para Corretores Autônomos
            </button>
            <button
              onClick={() => setActivePersona('buyer')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activePersona === 'buyer'
                  ? 'bg-[#081426] text-[#FAF8F5] shadow-md'
                  : 'text-[#5C5346] hover:text-[#081426]'
              }`}
            >
              <Users className="w-4 h-4 text-[#C5A880]" />
              Para Compradores
            </button>
          </div>
        </div>

        {/* Dynamic Persona Benefits Showcase */}
        <div className="bg-[#FAF8F5] border border-[#E5D9C5] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm">
          {activePersona === 'owner' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-bold text-[#081426] text-base">Comissão Justa e Negociável</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  Em imobiliárias convencionais, a comissão é engessada em 6%. Na Imnora, você recebe propostas com taxas a partir de 3% e escolhe quem melhor valoriza seu imóvel.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> Economia de R$ 15.000 a R$ 60.000
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-bold text-[#081426] text-base">Corretor com Dedicação Real</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  O corretor que você escolhe ganha a oportunidade com exclusividade pactuada. Ele não deixa seu anúncio esquecido; ele investe tempo e tráfego qualificado para vender logo.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> Atendimento personalizado e direto
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-bold text-[#081426] text-base">Anúncio Grátis & Risco Zero</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  Você não paga nada para publicar seu imóvel ou receber propostas. Os honorários só são liquidados quando a transação for assinada com o comprador em cartório.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> Pagamento 100% no êxito da venda
                </div>
              </div>
            </div>
          )}

          {activePersona === 'seller' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-bold text-[#081426] text-base">100% da Comissão é Sua</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  Pare de repassar 50% dos seus honorários para grandes redes imobiliárias. Na Imnora, você negocia sua taxa direto com o dono e fica com o fruto do seu trabalho.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> O dobro de renda por venda fechada
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-bold text-[#081426] text-base">Acesso Direto a Imóveis Reais</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  Receba alertas de novos imóveis cadastrados pelos proprietários na sua região. Analise fotos, especificações e envie sua proposta de venda em minutos.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> Captação qualificada sem porta a porta
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-bold text-[#081426] text-base">Construa sua Reputação Digital</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  Seu perfil exibe seu número de CRECI auditado, avaliações 5 estrelas e vendas concluídas. Quanto melhor seu serviço, mais proprietários escolherão você.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> Perfil profissional com autoridade
                </div>
              </div>
            </div>
          )}

          {activePersona === 'buyer' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-bold text-[#081426] text-base">Zero Imóveis Falsos</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  Chega de contatar anúncios de imóveis que já foram vendidos ou fotos falsas para atrair cliques. Na Imnora, cada imóvel é cadastrado pelo proprietário real com checagem de dados.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> Dados reais e atualizados
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-bold text-[#081426] text-base">Atendimento Rápido e Humano</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  Fale diretamente com o corretor responsável pelo chat seguro. Tire dúvidas, agende visitas com rapidez e receba suporte dedicado até a entrega das chaves.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> Sem robôs ou esperas burocráticas
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-bold text-[#081426] text-base">Segurança Jurídica Completa</h3>
                <p className="text-xs text-[#5C5346] leading-relaxed">
                  Corretores com inscrição ativa no CRECI e orientações para certidões negativas, contratos digitais e validações cartorárias seguras.
                </p>
                <div className="pt-2 text-xs font-semibold text-[#8C6B3A] flex items-center gap-1">
                  <Check className="w-4 h-4 text-[#C5A880]" /> Total proteção para seu investimento
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SEARCH & FILTER BAR                                  */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="bg-[#FAF8F5] rounded-2xl border border-[#E5D9C5] p-4 sm:p-5 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#857B6E] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por bairro, cidade, rua ou palavra-chave..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2D7C5] rounded-xl text-xs text-[#081426] focus:outline-none focus:ring-2 focus:ring-[#081426]"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#081426] hover:bg-[#122744] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#C5A880]" />
              Buscar Imóveis
            </button>
          </form>

          {/* Filters row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EFE9DE]">
            {/* Representation status filter toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-[#EFE9DE] rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRepresentationStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  representationStatus === 'all'
                    ? 'bg-[#081426] text-[#FAF8F5] shadow-xs'
                    : 'text-[#5C5346] hover:text-[#081426]'
                }`}
              >
                Todos os Imóveis
              </button>
              <button
                type="button"
                onClick={() => setRepresentationStatus('open')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  representationStatus === 'open'
                    ? 'bg-[#081426] text-[#C5A880] shadow-xs font-bold border border-[#C5A880]/40'
                    : 'text-[#5C5346] hover:text-[#081426]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Abertos a Corretores
              </button>
              <button
                type="button"
                onClick={() => setRepresentationStatus('selected')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  representationStatus === 'selected'
                    ? 'bg-[#081426] text-[#FAF8F5] shadow-xs font-bold'
                    : 'text-[#5C5346] hover:text-[#081426]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880]" />
                Com Corretor Escolhido
              </button>
            </div>

            {/* Quick Dropdowns */}
            <div className="flex items-center gap-2">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E2D7C5] rounded-xl text-xs text-[#081426] focus:outline-none"
              >
                <option value="">Tipo: Todos</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Cobertura">Cobertura</option>
                <option value="Studio">Studio</option>
              </select>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E2D7C5] rounded-xl text-xs text-[#081426] focus:outline-none"
              >
                <option value="">Cidade: Todas</option>
                <option value="São Paulo">São Paulo</option>
                <option value="Campinas">Campinas</option>
                <option value="Rio de Janeiro">Rio de Janeiro</option>
              </select>

              {(search || propertyType || city || representationStatus !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="p-1.5 text-[#857B6E] hover:text-[#081426] hover:bg-[#EFE9DE] rounded-lg transition-colors cursor-pointer"
                  title="Limpar filtros"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. GENUINE PROPERTY LISTING & STARTUP LAUNCH STATE      */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#081426]">
              {representationStatus === 'open'
                ? 'Imóveis Abertos para Propostas de Corretores'
                : representationStatus === 'selected'
                ? 'Imóveis com Corretor Oficial Selecionado'
                : 'Imóveis Disponíveis'}
            </h2>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-[#EFE9DE] text-[#665D52]">
              Verificados
            </span>
          </div>

          <span className="text-xs text-[#665D52] font-medium">
            {properties.length} {properties.length === 1 ? 'imóvel cadastrado' : 'imóveis cadastrados'}
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#857B6E] flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#E2D7C5] border-t-[#081426] rounded-full animate-spin"></div>
            <span>Carregando catálogo oficial da Imnora...</span>
          </div>
        ) : properties.length === 0 ? (
          /* ======================================================== */
          /* STARTUP LAUNCHPAD: ZERO FAKE PROPERTIES, GENUINE READY   */
          /* ======================================================== */
          <div className="bg-[#FAF8F5] rounded-3xl border border-[#E5D9C5] p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#081426] text-[#C5A880] flex items-center justify-center mx-auto shadow-md">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="max-w-lg mx-auto space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#EFE9DE] text-[#081426] text-[11px] font-bold uppercase tracking-wider">
                Catálogo 100% Real • Sem Anúncios Falsos
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#081426]">
                Startup Pronta para Publicação: Seja o Primeiro a Anunciar!
              </h3>
              <p className="text-xs sm:text-sm text-[#5C5346] leading-relaxed">
                Na <strong>Imnora</strong>, nós eliminamos todos os imóveis fictícios e anúncios duplicados para garantir um marketplace transparente. 
                Cadastre seu imóvel agora e receba propostas imediatas de corretores autônomos com taxas reduzidas.
              </p>
            </div>

            {/* Step-by-step conversion pathway */}
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
              <div className="p-4 bg-white rounded-2xl border border-[#EFE9DE] space-y-1">
                <span className="text-xs font-bold text-[#C5A880]">Passo 1</span>
                <p className="text-xs font-bold text-[#081426]">Cadastre em 2 min</p>
                <p className="text-[11px] text-[#857B6E]">Sem taxa de adesão ou exclusividade forçada.</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#EFE9DE] space-y-1">
                <span className="text-xs font-bold text-[#C5A880]">Passo 2</span>
                <p className="text-xs font-bold text-[#081426]">Receba Propostas</p>
                <p className="text-[11px] text-[#857B6E]">Corretores disputam quem vende pela menor taxa.</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#EFE9DE] space-y-1">
                <span className="text-xs font-bold text-[#C5A880]">Passo 3</span>
                <p className="text-xs font-bold text-[#081426]">Venda com Sucesso</p>
                <p className="text-[11px] text-[#857B6E]">Comissão paga apenas após a escritura em cartório.</p>
              </div>
            </div>

            {/* Launch Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="catalog-empty-publish-btn"
                onClick={() => {
                  if (onOpenNewProperty) onOpenNewProperty();
                  else if (onOpenAuth) onOpenAuth('login');
                }}
                className="px-6 py-3 bg-[#081426] hover:bg-[#122744] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4 text-[#C5A880]" />
                + Anunciar Meu Imóvel Gratuitamente
              </button>

              <button
                id="catalog-empty-view-sellers-btn"
                onClick={() => onNavigate && onNavigate('sellers')}
                className="px-5 py-3 bg-white hover:bg-[#EFE9DE] text-[#081426] border border-[#E2D7C5] rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#8C6B3A]" />
                Conhecer Corretores Autônomos
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                onSelect={onSelectProperty}
                userRole={userRole}
                onQuickApply={onQuickApply}
              />
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 5. LEGAL SAFETY & TRUST FOOTER BANNER                    */}
      {/* ======================================================== */}
      <section className="rounded-3xl bg-[#EFE9DE] border border-[#E2D7C5] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-[#081426] font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#8C6B3A]" />
            <span>Segurança Jurídica e Transparência Garantidas</span>
          </div>
          <p className="text-xs text-[#5C5346] max-w-xl">
            A Imnora opera em conformidade com as diretrizes do COFECI/CRECI. Todos os contratos de intermediação e propostas contam com auditoria digital para tranquilidade de ambas as partes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate && onNavigate('how_it_works')}
            className="px-4 py-2.5 bg-[#081426] hover:bg-[#122744] text-[#FAF8F5] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Saber Mais
          </button>
        </div>
      </section>
    </div>
  );
};
