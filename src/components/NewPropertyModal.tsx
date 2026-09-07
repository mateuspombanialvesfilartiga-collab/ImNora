import React, { useState } from 'react';
import { apiRequest } from '../api/client.js';
import {
  X,
  Building2,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Check,
  RefreshCw
} from 'lucide-react';

interface NewPropertyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Curated high-definition real estate photos available as 1-click presets
const PRESET_PHOTOS = [
  {
    name: 'Apartamento Moema',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Casa com Jardim',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Cobertura Panorâmica',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Studio Design',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Living Integrado',
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Sala Comercial',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
  }
];

export const NewPropertyModal: React.FC<NewPropertyModalProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('Apartamento');
  const [price, setPrice] = useState<number>(650000);
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [suites, setSuites] = useState(1);
  const [parkingSpots, setParkingSpots] = useState(1);
  const [areaSqm, setAreaSqm] = useState(75);

  // Image states
  const [imageUrl, setImageUrl] = useState<string>(PRESET_PHOTOS[0].url);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle direct file upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setError('A foto selecionada é muito grande (máximo 8MB).');
      return;
    }

    setIsUploading(true);
    setImageError(false);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError('Erro ao carregar a imagem do seu aparelho.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Normalize image URL
    let finalImageUrl = imageUrl.trim();
    if (!finalImageUrl) {
      finalImageUrl = PRESET_PHOTOS[0].url;
    } else if (!finalImageUrl.startsWith('data:image/') && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = 'https://' + finalImageUrl;
    }

    try {
      await apiRequest('/api/properties', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          propertyType,
          price: Number(price),
          address: address.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          suites: Number(suites),
          parkingSpots: Number(parkingSpots),
          areaSqm: Number(areaSqm),
          images: [finalImageUrl]
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar imóvel.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Anunciar Imóvel no elo</h3>
              <p className="text-xs text-slate-500">Abra para candidaturas de corretores autônomos</p>
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
            <label className="text-xs font-bold text-slate-700">Título do Anúncio</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Apartamento Iluminado com Varanda Gourmet em Moema"
              className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Tipo de Imóvel</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-none"
              >
                <option>Apartamento</option>
                <option>Casa</option>
                <option>Cobertura</option>
                <option>Studio</option>
                <option>Sala Comercial</option>
                <option>Terreno</option>
                <option>Sobrado</option>
                <option>Chácara</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Valor Pretendido de Venda (R$)</label>
              <input
                type="number"
                step="1000"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Bairro</label>
              <input
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Pinheiros"
                className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Cidade</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">UF</label>
              <input
                type="text"
                maxLength={2}
                required
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none uppercase font-bold text-center"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Endereço Completo</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua dos Pinheiros, 540"
              className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none"
            />
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700">Quartos</label>
              <input
                type="number"
                min="0"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="mt-1 w-full px-2 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700">Suítes</label>
              <input
                type="number"
                min="0"
                value={suites}
                onChange={(e) => setSuites(Number(e.target.value))}
                className="mt-1 w-full px-2 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700">Banheiros</label>
              <input
                type="number"
                min="1"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="mt-1 w-full px-2 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700">Vagas</label>
              <input
                type="number"
                min="0"
                value={parkingSpots}
                onChange={(e) => setParkingSpots(Number(e.target.value))}
                className="mt-1 w-full px-2 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700">Área (m²)</label>
              <input
                type="number"
                min="1"
                value={areaSqm}
                onChange={(e) => setAreaSqm(Number(e.target.value))}
                className="mt-1 w-full px-2 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          {/* Photo Section with Live Preview & File Upload */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Foto do Imóvel (Link URL ou Envio de Arquivo)
              </label>

              {/* Upload file button */}
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>{isUploading ? 'Carregando...' : 'Enviar foto do celular/PC'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* URL Input */}
            <input
              type="text"
              required
              value={imageUrl.startsWith('data:image/') ? '[Foto carregada do dispositivo]' : imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageError(false);
              }}
              placeholder="Cole o link da imagem (ex: https://...)"
              className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />

            {/* Live Visual Preview */}
            <div className="relative aspect-[16/9] w-full max-h-48 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Prévia do Imóvel"
                className="w-full h-full object-cover"
                onError={() => {
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
              />
              {imageError && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center p-4 text-center text-white space-y-1.5 backdrop-blur-2xs">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                  <span className="text-xs font-bold">Não foi possível carregar este link.</span>
                  <span className="text-[11px] text-slate-300 max-w-sm">
                    Clique em uma das fotos modelo abaixo ou use o botão "Enviar foto do celular/PC".
                  </span>
                </div>
              )}
            </div>

            {/* Curated Presets Selection */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Ou selecione uma foto pronta de alta qualidade:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url);
                      setImageError(false);
                    }}
                    className={`relative rounded-lg overflow-hidden border-2 aspect-[4/3] group text-left transition-all ${
                      imageUrl === preset.url ? 'border-emerald-600 ring-2 ring-emerald-400/40' : 'border-slate-200 hover:border-slate-400 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] font-semibold px-1 py-0.5 truncate text-center block">
                      {preset.name}
                    </span>
                    {imageUrl === preset.url && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Descrição Detalhada</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a iluminação natural, vista, acabamentos, reforma recente..."
              className="mt-1 w-full p-3 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="submit-property-btn"
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Publicando...' : 'Publicar e Abrir a Corretores'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
