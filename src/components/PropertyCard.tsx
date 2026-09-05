import React from 'react';
import { Property } from '../types.js';
import {
  Bed,
  Bath,
  Maximize2,
  MapPin,
  Star,
  CheckCircle2,
  Users,
  Car,
  Heart,
  Briefcase
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  isFavorited?: boolean;
  onSelect: (property: Property) => void;
  onToggleFavorite?: (propertyId: string, e: React.MouseEvent) => void;
  userRole?: string;
  onQuickApply?: (property: Property, e: React.MouseEvent) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isFavorited = false,
  onSelect,
  onToggleFavorite,
  userRole,
  onQuickApply
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const isSellerSelected = property.status === 'seller_selected' || property.status === 'in_negotiation';
  const isOpenForApplications = property.status === 'published_open';

  return (
    <div
      id={`property-card-${property.id}`}
      onClick={() => onSelect(property)}
      className="group bg-[#FAF8F5] rounded-2xl border border-[#E5D9C5] hover:border-[#C5A880] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Property Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#EFE9DE]">
        <img
          src={property.primary_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => onToggleFavorite(property.id, e)}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
              isFavorited
                ? 'bg-rose-50 text-rose-600 shadow-sm'
                : 'bg-white/85 text-slate-700 hover:bg-white'
            }`}
            title={isFavorited ? 'Remover dos favoritos' : 'Favoritar imóvel'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        )}

        {/* Property Type Badge */}
        <div className="absolute top-3 left-3 bg-[#081426]/90 backdrop-blur-md text-[#FAF8F5] text-[11px] font-semibold px-2.5 py-1 rounded-md border border-[#1F3759]/50">
          {property.property_type}
        </div>

        {/* Status representation badge at the bottom of the image */}
        <div className="absolute bottom-2 left-2 right-2">
          {isOpenForApplications ? (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#081426]/90 border border-[#C5A880]/60 backdrop-blur-md text-[#FAF8F5] text-xs font-semibold shadow-xs">
              <span className="flex items-center gap-1.5 text-[#C5A880]">
                <Users className="w-3.5 h-3.5" />
                Aberto a Corretores
              </span>
              <span className="text-[11px] bg-[#C5A880]/20 text-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#C5A880]/30">
                {property.open_applications_count || 0} disputando
              </span>
            </div>
          ) : isSellerSelected && property.seller_name ? (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#081426]/90 backdrop-blur-md text-[#FAF8F5] text-xs shadow-xs border border-[#1A2E4C]">
              <div className="flex items-center gap-2 truncate">
                {property.seller_photo ? (
                  <img
                    src={property.seller_photo}
                    alt={property.seller_name}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#162D4D] text-[10px] font-bold flex items-center justify-center shrink-0">
                    {property.seller_name.charAt(0)}
                  </div>
                )}
                <span className="font-semibold truncate text-[11px]">
                  Corretor: {property.seller_name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-[#C5A880] font-semibold text-[11px]">
                <Star className="w-3 h-3 fill-[#C5A880] text-[#C5A880]" />
                <span>{property.seller_rating ? property.seller_rating.toFixed(1) : '5.0'}</span>
              </div>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-md bg-[#081426]/85 backdrop-blur-md text-[#FAF8F5] text-xs font-medium">
              Em negociação
            </div>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Price */}
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xl font-bold text-[#081426] tracking-tight">
              {formatCurrency(property.price)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[#081426] text-sm line-clamp-1 group-hover:text-[#8C6B3A] transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-[#665D52] text-xs mt-1 mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#8C6B3A]" />
            <span className="truncate">
              {property.neighborhood}, {property.city} - {property.state}
            </span>
          </div>

          {/* Specs icons */}
          <div className="grid grid-cols-4 gap-2 py-2 border-y border-[#E5D9C5] text-[#5C5346] text-xs">
            <div className="flex items-center gap-1.5" title="Quartos">
              <Bed className="w-3.5 h-3.5 text-[#8C6B3A]" />
              <span>{property.bedrooms} qts</span>
            </div>
            <div className="flex items-center gap-1.5" title="Banheiros">
              <Bath className="w-3.5 h-3.5 text-[#8C6B3A]" />
              <span>{property.bathrooms} ban</span>
            </div>
            <div className="flex items-center gap-1.5" title="Vagas de Garagem">
              <Car className="w-3.5 h-3.5 text-[#8C6B3A]" />
              <span>{property.parking_spots} vag</span>
            </div>
            <div className="flex items-center gap-1.5" title="Área Útil">
              <Maximize2 className="w-3.5 h-3.5 text-[#8C6B3A]" />
              <span>{property.area_sqm} m²</span>
            </div>
          </div>
        </div>

        {/* Footer / Action helper */}
        <div className="mt-3 pt-2 flex items-center justify-between">
          {userRole === 'seller' && isOpenForApplications && onQuickApply ? (
            <button
              onClick={(e) => onQuickApply(property, e)}
              className="w-full py-2 bg-[#081426] hover:bg-[#0E233F] text-[#FAF8F5] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs border border-[#1A2E4C]"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#C5A880]" />
              Candidatar-se com Comissão
            </button>
          ) : (
            <div className="w-full flex items-center justify-between text-xs text-[#665D52]">
              <span className="text-[11px] text-[#857B6E]">
                {isSellerSelected ? 'Intermediação exclusiva' : 'Disputa de comissão ativa'}
              </span>
              <span className="font-bold text-[#081426] group-hover:text-[#8C6B3A] flex items-center gap-1 transition-colors">
                Ver detalhes &rarr;
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
