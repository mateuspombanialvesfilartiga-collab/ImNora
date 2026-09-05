import React, { useState, useEffect } from 'react';
import { SellerPublicProfile, Review, Property } from '../types.js';
import { apiRequest } from '../api/client.js';
import {
  X,
  Star,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  MessageSquare,
  Award,
  ThumbsUp,
  MapPin
} from 'lucide-react';

interface SellerProfileModalProps {
  sellerId: string | null;
  onClose: () => void;
  onSelectProperty: (property: Property) => void;
  onStartChat?: (sellerId: string) => void;
}

export const SellerProfileModal: React.FC<SellerProfileModalProps> = ({
  sellerId,
  onClose,
  onSelectProperty,
  onStartChat
}) => {
  if (!sellerId) return null;

  const [profile, setProfile] = useState<SellerPublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [pRes, rRes] = await Promise.all([
          apiRequest<{ seller: SellerPublicProfile }>(`/api/sellers/${sellerId}`),
          apiRequest<{ reviews: Review[] }>(`/api/reviews/seller/${sellerId}`)
        ]);
        setProfile(pRes.seller);
        setReviews(rRes.reviews);
      } catch (err) {
        console.error('Error loading seller profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [sellerId]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 p-6 md:p-8 space-y-6">
        {/* Header with close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Perfil do Corretor Autônomo
          </span>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading || !profile ? (
          <div className="py-16 text-center text-xs text-slate-400">Carregando perfil do corretor...</div>
        ) : (
          <div className="space-y-6">
            {/* Top seller card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-xs"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-800 text-white font-bold text-2xl flex items-center justify-center shadow-xs">
                  {profile.full_name.charAt(0)}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900">{profile.full_name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    CRECI {profile.creci_number}-{profile.creci_state}
                  </span>
                  {profile.verified_status === 'approved' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      CRECI Verificado
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    {profile.rating_avg.toFixed(1)} ({profile.reviews_count} avaliações)
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-800">{profile.sales_count} vendas no elo</span>
                </div>

                {profile.bio && (
                  <p className="text-xs text-slate-600 pt-2 leading-relaxed max-w-lg">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Represented Properties list */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-600" />
                Imóveis Atualmente Representados ({profile.representedProperties.length})
              </h4>

              {profile.representedProperties.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl">
                  Nenhum imóvel ativo sob representação no momento.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.representedProperties.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onClose();
                        onSelectProperty(p);
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900 truncate">{p.title}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {p.neighborhood}, {p.city}
                      </div>
                      <div className="font-bold text-emerald-700">{formatCurrency(p.price)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real Reviews */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Avaliações de Clientes ({reviews.length})
              </h4>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl">
                  Ainda não há avaliações registradas para este corretor.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {r.reviewerName} ({r.reviewerRole})
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{r.ratingOverall.toFixed(1)}</span>
                        </div>
                      </div>

                      {r.comment && (
                        <p className="text-xs text-slate-600 italic">
                          "{r.comment}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Venda de: {r.propertyTitle}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
