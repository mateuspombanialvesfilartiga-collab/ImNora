import React, { useState } from 'react';
import { Property, User } from '../types.js';
import {
  X,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Car,
  Star,
  CheckCircle2,
  MessageSquare,
  Briefcase,
  Users,
  ShieldAlert,
  Calendar,
  Share2,
  Building2,
  Info
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: Property | null;
  currentUser: User | null;
  onClose: () => void;
  onStartChatWithSeller: (property: Property, sellerId: string) => void;
  onOpenApply: (property: Property) => void;
  onOpenOwnerDispute: (propertyId: string) => void;
  onOpenSellerProfile: (sellerId: string) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  currentUser,
  onClose,
  onStartChatWithSeller,
  onOpenApply,
  onOpenOwnerDispute,
  onOpenSellerProfile
}) => {
  if (!property) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = property.images && property.images.length > 0
    ? property.images.map(i => i.image_url)
    : [property.primary_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const isOwnerOfThis = currentUser?.id === property.owner_id;
  const isAssignedSeller = currentUser?.id === property.assigned_seller_id;
  const isOpenForApplications = property.status === 'published_open';
  const isSellerSelected = property.status === 'seller_selected' || property.status === 'in_negotiation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky top bar with close */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              {property.property_type}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Código: #{property.id.substring(0, 8)}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative">
              <img
                src={images[activeImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-lg">
                Foto {activeImageIndex + 1} de {images.length}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx ? 'border-slate-900 scale-102' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{property.title}</h2>
              <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{property.address}, {property.neighborhood}, {property.city} - {property.state}</span>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs font-medium text-slate-400">Valor de Venda</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(property.price)}
              </div>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-200/60">
                <Bed className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Dormitórios</div>
                <div className="text-sm font-bold text-slate-900">{property.bedrooms} quartos ({property.suites || 0} suítes)</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-200/60">
                <Bath className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Banheiros</div>
                <div className="text-sm font-bold text-slate-900">{property.bathrooms} banheiros</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-200/60">
                <Car className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Vagas</div>
                <div className="text-sm font-bold text-slate-900">{property.parking_spots} vagas cobertas</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-200/60">
                <Maximize2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Área Privativa</div>
                <div className="text-sm font-bold text-slate-900">{property.area_sqm} m²</div>
              </div>
            </div>
          </div>

          {/* Representation Status Box - O diferencial central do produto */}
          <div className="rounded-2xl border p-5 transition-all">
            {isSellerSelected && property.assigned_seller_id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Corretor Autônomo Selecionado pelo Proprietário
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                    Exclusividade de Atendimento elo
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  <div className="flex items-center gap-3.5">
                    {property.seller_photo ? (
                      <img
                        src={property.seller_photo}
                        alt={property.seller_name}
                        className="w-14 h-14 rounded-xl object-cover shadow-2xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center">
                        {property.seller_name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenSellerProfile(property.assigned_seller_id!)}
                          className="font-bold text-slate-900 text-base hover:text-emerald-700 text-left transition-colors"
                        >
                          {property.seller_name}
                        </button>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          CRECI {property.seller_creci}-{property.seller_creci_state}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {property.seller_rating ? property.seller_rating.toFixed(1) : '5.0'} ({property.seller_reviews_count || 0} avaliações)
                        </span>
                        <span>•</span>
                        <span>{property.seller_sales_count || 0} vendas concluídas</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA: Chat with broker (comprador fala apenas com o corretor) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenSellerProfile(property.assigned_seller_id!)}
                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
                    >
                      Ver Perfil
                    </button>
                    <button
                      id="property-contact-seller-btn"
                      onClick={() => onStartChatWithSeller(property, property.assigned_seller_id!)}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center gap-2 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Conversar com Corretor
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 italic">
                  * Todo contato, dúvidas e agendamento de visita são intermediados por este corretor autônomo selecionado pelo proprietário.
                </p>
              </div>
            ) : isOpenForApplications ? (
              <div className="space-y-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Users className="w-5 h-5 text-amber-600" />
                  Imóvel Aberto para Candidaturas de Corretores Autônomos
                </div>

                <p className="text-xs text-amber-800 leading-relaxed">
                  O proprietário publicou este imóvel na plataforma e está recebendo propostas de corretores autônomos.
                  Cada corretor propõe sua taxa de comissão e estratégia de venda. O proprietário analisará o histórico,
                  as avaliações e as comissões antes de selecionar quem representará a venda.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-amber-700 font-medium">
                    {property.open_applications_count && property.open_applications_count > 0 ? (
                      <span>🔥 {property.open_applications_count} corretores já enviaram proposta de comissão</span>
                    ) : (
                      <span>Nenhum corretor selecionado ainda. Seja o primeiro a se candidatar!</span>
                    )}
                  </div>

                  {/* Actions depending on role */}
                  {currentUser?.role === 'seller' ? (
                    <button
                      id="property-apply-seller-btn"
                      onClick={() => onOpenApply(property)}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                    >
                      <Briefcase className="w-4 h-4" />
                      Candidatar-se Propondo Comissão
                    </button>
                  ) : isOwnerOfThis ? (
                    <button
                      id="property-manage-applications-btn"
                      onClick={() => onOpenOwnerDispute(property.id)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Ver Candidatos e Escolher Corretor
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200">
                      <Info className="w-3.5 h-3.5 text-amber-600" />
                      <span>Compradores: o contato será liberado assim que o corretor for selecionado.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl">
                Status atual: {property.status}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base">Descrição do Imóvel</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-base">Diferenciais e Infraestrutura</h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
