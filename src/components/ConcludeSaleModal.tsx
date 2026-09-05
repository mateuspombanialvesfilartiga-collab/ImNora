import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { Property } from '../types.js';
import { X, DollarSign, CheckCircle2, AlertCircle, Calculator, ShieldCheck, User } from 'lucide-react';

interface ConcludeSaleModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

interface BuyerOption {
  id: string;
  name: string;
  email: string;
}

export const ConcludeSaleModal: React.FC<ConcludeSaleModalProps> = ({
  property,
  onClose,
  onSuccess
}) => {
  const [finalSalePrice, setFinalSalePrice] = useState<number>(property.price);
  const [buyerId, setBuyerId] = useState<string>('');
  const [eligibleBuyers, setEligibleBuyers] = useState<BuyerOption[]>([]);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBuyers() {
      try {
        const res = await apiRequest<{ buyers: BuyerOption[] }>(`/api/negotiations/eligible-buyers?propertyId=${property.id}`);
        setEligibleBuyers(res.buyers || []);
        if (res.buyers && res.buyers.length > 0) {
          setBuyerId(res.buyers[0].id);
        }
      } catch (err) {
        console.warn('Could not load buyers:', err);
      } finally {
        setIsLoadingBuyers(false);
      }
    }
    loadBuyers();
  }, [property.id]);

  // Estimation based on accepted proposal (default 4.5% commission, 1.5% platform fee)
  const sellerCommissionPercent = 4.5;
  const platformFeePercent = 1.5;

  const sellerCommissionValue = (finalSalePrice * sellerCommissionPercent) / 100;
  const platformFeeValue = (finalSalePrice * platformFeePercent) / 100;
  const netOwnerValue = finalSalePrice - sellerCommissionValue - platformFeeValue;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerId) {
      setError('Selecione ou informe o comprador.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest('/api/negotiations/complete', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.id,
          buyerId,
          finalSalePrice: Number(finalSalePrice)
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao concluir venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Concluir Venda do Imóvel</h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{property.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Valor Final Fechado da Venda (R$)</label>
            <input
              type="number"
              step="1000"
              required
              value={finalSalePrice}
              onChange={(e) => setFinalSalePrice(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Comprador Final</span>
              {isLoadingBuyers && <span className="text-[11px] text-slate-400">Carregando compradores...</span>}
            </label>
            {eligibleBuyers.length > 0 ? (
              <select
                value={buyerId}
                required
                onChange={(e) => setBuyerId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-none font-medium"
              >
                {eligibleBuyers.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.email})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                placeholder="ID ou E-mail do comprador cadastrado"
                className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-none"
              />
            )}
          </div>

          {/* Transparent Settlement Breakdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Calculator className="w-4 h-4 text-slate-600" />
              Demonstrativo Financeiro Transparente elo
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Preço Bruto de Venda:</span>
              <span className="font-bold text-slate-900">{formatCurrency(finalSalePrice)}</span>
            </div>

            <div className="flex justify-between text-amber-700">
              <span>(-) Comissão Corretor Autônomo (~{sellerCommissionPercent}%):</span>
              <span className="font-bold">-{formatCurrency(sellerCommissionValue)}</span>
            </div>

            <div className="flex justify-between text-purple-700">
              <span>(-) Taxa da Plataforma elo ({platformFeePercent}%):</span>
              <span className="font-bold">-{formatCurrency(platformFeeValue)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-sm">Líquido do Proprietário:</span>
              <span className="font-extrabold text-emerald-700 text-lg">{formatCurrency(netOwnerValue)}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Ao concluir, o imóvel será marcado como <strong>Vendido</strong>, a comissão do corretor será liquidada e tanto o comprador quanto o proprietário serão convidados a avaliar a atuação do corretor autônomo.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              id="confirm-conclude-sale-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Liquidando...' : 'Confirmar e Concluir Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
