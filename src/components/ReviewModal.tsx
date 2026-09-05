import React, { useState } from 'react';
import { apiRequest } from '../api/client.js';
import { X, Star, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  negotiationId: string;
  sellerName: string;
  propertyTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  negotiationId,
  sellerName,
  propertyTitle,
  onClose,
  onSuccess
}) => {
  const [ratingService, setRatingService] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingProfessionalism, setRatingProfessionalism] = useState(5);
  const [ratingOverall, setRatingOverall] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          negotiationId,
          ratingService,
          ratingCommunication,
          ratingProfessionalism,
          ratingOverall,
          comment: comment.trim() || undefined
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Avaliar Corretor Autônomo</h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{sellerName} • {propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full">
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
          <div className="space-y-1">
            <StarRating label="Nota Geral da Experiência" value={ratingOverall} onChange={setRatingOverall} />
            <StarRating label="Qualidade do Atendimento" value={ratingService} onChange={setRatingService} />
            <StarRating label="Comunicação & Agilidade" value={ratingCommunication} onChange={setRatingCommunication} />
            <StarRating label="Profissionalismo & Postura" value={ratingProfessionalism} onChange={setRatingProfessionalism} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Comentário Público (Opcional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva como foi a condução da venda pelo corretor..."
              className="w-full p-3 text-xs text-slate-800 border border-slate-300 rounded-xl focus:outline-none resize-none"
            />
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
              id="submit-review-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
