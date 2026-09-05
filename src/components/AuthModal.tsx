import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  KeyRound,
  Home,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose, onSuccess }) => {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'buyer' | 'seller' | 'owner'>('buyer');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [creciNumber, setCreciNumber] = useState('');
  const [creciState, setCreciState] = useState('SP');
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          role,
          fullName,
          phone: phone || undefined,
          creciNumber: role === 'seller' ? creciNumber : undefined,
          creciState: role === 'seller' ? creciState : undefined,
          bio: role === 'seller' ? bio : undefined
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Acessar Conta elo' : 'Criar Nova Conta no elo'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login'
                ? 'Entre para gerenciar seus imóveis ou mensagens'
                : 'Selecione seu papel para começar'}
            </p>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cadastre-se
            </button>
          </div>

          {/* Registration Role Selection */}
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Selecione seu perfil:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === 'buyer'
                      ? 'border-sky-500 bg-sky-50/70 text-sky-900 ring-2 ring-sky-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Home className="w-4 h-4 mb-1 text-sky-600" />
                  <div className="text-xs font-bold">Comprador</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === 'seller'
                      ? 'border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Briefcase className="w-4 h-4 mb-1 text-amber-600" />
                  <div className="text-xs font-bold">Corretor</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === 'owner'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <KeyRound className="w-4 h-4 mb-1 text-emerald-600" />
                  <div className="text-xs font-bold">Proprietário</div>
                </button>
              </div>
            </div>
          )}

          {/* Additional register fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome e Sobrenome"
                  className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="mt-1 w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {role === 'seller' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    CRECI Obrigatório
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        value={creciNumber}
                        onChange={(e) => setCreciNumber(e.target.value)}
                        placeholder="Número CRECI"
                        className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={creciState}
                        onChange={(e) => setCreciState(e.target.value.toUpperCase())}
                        placeholder="UF"
                        className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg text-center font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Regiões de atuação, especialidades..."
                      className="mt-1 w-full p-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email & Password */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">E-mail</label>
              {mode === 'login' && (
                <span className="text-[10px] text-slate-400">Ex: carlos.corretor@elo.com.br</span>
              )}
            </div>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="modal-login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Senha</label>
            </div>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="modal-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 dígitos (A-z, 0-9)"
                className="w-full pl-9 pr-9 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-[10px] text-slate-400 mt-1">
                A senha deve conter ao menos 8 caracteres com letras maiúsculas, minúsculas e números.
              </p>
            )}
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Processando...' : mode === 'login' ? 'Entrar no elo' : 'Criar Minha Conta'}
          </button>
        </form>
      </div>
    </div>
  );
};
