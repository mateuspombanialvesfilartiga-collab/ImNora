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

interface DynamicCity {
  city: string;
  state: string;
  label: string;
  count: number;
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
  const [availableCities, setAvailableCities] = useState<DynamicCity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [city, setCity] = useState('');
  const [representationStatus, setRepresentationStatus] = useState<string>('all'); // 'all' | 'open' | 'selected'
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minBedrooms, setMinBedrooms] = useState<string>('');

  const fetchCities = async () => {
    try {
      const res = await apiRequest<{ cities: DynamicCity[] }>('/api/properties/cities');
      setAvailableCities(res.cities || []);
    } catch (err) {
      console.error('Error fetching dynamic cities:', err);
      setAvailableCities([]);
    }
  };

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
    fetchCities();
  }, [representationStatus, propertyType, city]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* ======================================================== */}
      {/* MOTIVATING HERO & STARTUP PRESENTATION                  */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-[#081426] text-[#FAF8F5] p-6 sm:p-10 lg:p-12 border border-[#1A2E4C] shadow-xl">
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F223D] border border-[#2A446B] text-xs font-semibold text-[#C5A880]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>A Revolução Imobiliária Transparente</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#FAF8F5] leading-tight sm:leading-tight">
            Venda ou compre seu imóvel sem os <span className="text-[#C5A880]">6% abusivos</span> das imobiliárias tradicionais.
          </h1>

          <p className="text-sm sm:text-base text-[#D4C8B5] leading-relaxed max-w-3xl">
            A Imnora conecta proprietários diretamente aos melhores <strong>corretores autônomos credenciados pelo CRECI</strong>.
            Sem a burocracia ou taxas infladas das grandes imobiliárias: corretores dedicados disputam a representação do seu imóvel
            com comissões justas e atendimento ágil, enquanto compradores negociam com total segurança jurídica.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-login-btn"
              onClick={() => onOpenAuth ? onOpenAuth('login') : onNavigate && onNavigate('login')}
              className="px-6 py-3 bg-[#C5A880] hover:bg-[#b5966d] text-[#081426] font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Acessar Meu Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-owner-cta"
              onClick={() => {
                if (userRole === 'owner' && onOpenNewProperty) {
                  onOpenNewProperty();
                } else if (onOpenAuth) {
                  onOpenAuth('register', 'owner');
                }
              }}
              className="px-5 py-3 bg-[#0F223D] hover:bg-[#162D4D] text-[#FAF8F5] border border-[#2A446B] font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#C5A880]" />
              <span>Anunciar Imóvel</span>
            </button>

            <button
              id="hero-seller-cta"
              onClick={() => onOpenAuth ? onOpenAuth('register', 'seller') : onNavigate && onNavigate('login')}
              className="px-5 py-3 bg-transparent hover:bg-white/5 text-[#FAF8F5] font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#C5A880]" />
              <span>Sou Corretor Autônomo (CRECI)</span>
            </button>
          </div>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#1A2E4C]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#0F223D] text-[#C5A880] shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FAF8F5]">Economia de até 40%</h4>
                <p className="text-[11px] text-[#A39682] mt-0.5">Comissões a partir de 3% disputadas entre corretores dedicados.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#0F223D] text-[#C5A880] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FAF8F5]">100% Auditado (CRECI)</h4>
                <p className="text-[11px] text-[#A39682] mt-0.5">Apenas corretores com registro profissional ativo e histórico conferido.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#0F223D] text-[#C5A880] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FAF8F5]">Venda Mais Rápida</h4>
                <p className="text-[11px] text-[#A39682] mt-0.5">Atendimento próximo, sem os processos lentos das imobiliárias comuns.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Header: Clean & Direct Real Estate Catalog */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5D9C5]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#081426] tracking-tight">
            Catálogo de Imóveis Reais
          </h2>
          <p className="text-xs text-[#5C5346] mt-0.5">
            Imóveis anunciados com corretores autônomos credenciados pelo CRECI.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (onOpenNewProperty) onOpenNewProperty();
              else if (onOpenAuth) onOpenAuth('login');
            }}
            className="px-4 py-2.5 bg-[#081426] hover:bg-[#122744] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#C5A880]" />
            Anunciar Imóvel
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SEARCH & FILTER BAR                                  */}
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
                id="filter-city-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={availableCities.length === 0}
                className="px-3 py-1.5 bg-white border border-[#E2D7C5] rounded-xl text-xs text-[#081426] focus:outline-none disabled:bg-[#F0EAE1] disabled:text-[#857B6E] disabled:cursor-not-allowed"
                title={availableCities.length === 0 ? 'Nenhum imóvel cadastrado no momento' : 'Filtrar por cidade'}
              >
                {availableCities.length === 0 ? (
                  <option value="">Cidades (Nenhum imóvel cadastrado)</option>
                ) : (
                  <>
                    <option value="">Todas as Cidades ({availableCities.length})</option>
                    {availableCities.map((item) => (
                      <option key={`${item.city}-${item.state}`} value={item.city}>
                        {item.label} ({item.count} {item.count === 1 ? 'imóvel' : 'imóveis'})
                      </option>
                    ))}
                  </>
                )}
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
