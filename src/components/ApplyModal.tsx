import React, { useState } from 'react';
import { Property } from '../types.js';
import { apiRequest } from '../api/client.js';
import { X, Briefcase, Calculator, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ApplyModalProps {
  property: Property | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ property, onClose, onSuccess }) => {
  if (!property) return null;

  const [commissionPercent, setCommissionPercent] = useState<number>(4.5);
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedValue = (property.price * commissionPercent) / 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest(`/api/applications/properties/${property.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          commissionPercent: Number(commissionPercent),
          message: message.trim() || undefined
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar candidatura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Candidatar-se ao Imóvel</h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{property.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Property summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Valor do Imóvel:</span>
              <div className="text-base font-bold text-slate-900">{formatCurrency(property.price)}</div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Localização:</span>
              <div className="font-medium text-slate-700">{property.neighborhood}, {property.city}</div>
            </div>
          </div>

          {/* Commission slider and input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-amber-600" />
                Sua Proposta de Comissão (%)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="15.0"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2.5 py-1 text-right text-sm font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm font-bold text-slate-600">%</span>
              </div>
            </div>

            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.1"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>1.0% (Muito Competitivo)</span>
              <span>4.0% - 5.0% (Média de Mercado)</span>
              <span>10.0%</span>
            </div>

            {/* Live estimated earnings banner */}
            <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div>
                <div className="text-[11px] text-amber-700">Comissão estimada no êxito da venda:</div>
                <div className="text-base font-extrabold text-amber-900">
                  {formatCurrency(estimatedValue)}
                </div>
              </div>
              <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded font-semibold text-amber-900">
                Líquido para você
              </span>
            </div>
          </div>

          {/* Pitch Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900">
              Mensagem para o Proprietário (Diferencial & Estratégia)
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Olá! Atuo com foco na região de Moema há 8 anos, possuo carteira ativa de clientes compradores pré-aprovados e realizarei fotos profissionais com drone e tour 360..."
              className="w-full p-3 text-xs text-slate-800 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <p className="text-[11px] text-slate-400">
              O proprietário comparará sua proposta com as de outros corretores. Destaque sua experiência e credenciais!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              id="submit-seller-application-btn"
              type="submit"
              disabled={isSubmitting || commissionPercent < 0.5}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Enviando...' : 'Enviar Proposta ao Proprietário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
