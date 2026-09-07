import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { User as UserType } from '../types.js';
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
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  initialRole?: 'buyer' | 'seller' | 'owner';
  onClose: () => void;
  onSuccess: (user?: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode,
  initialRole = 'buyer',
  onClose,
  onSuccess
}) => {
  const { login, register, switchRole } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'buyer' | 'seller' | 'owner'>(initialRole);

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
        const loggedUser = await login(email, password);
        onSuccess(loggedUser);
      } else {
        const newUser = await register({
          email,
          password,
          role,
          fullName,
          phone: phone || undefined,
          creciNumber: role === 'seller' ? creciNumber : undefined,
          creciState: role === 'seller' ? creciState : undefined,
          bio: role === 'seller' ? bio : undefined
        });
        onSuccess(newUser);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#081426]/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E5D9C5] relative animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5D9C5]">
          <div>
            <h3 className="text-xl font-extrabold text-[#081426] tracking-tight">
              {mode === 'login' ? 'Acessar Conta Imnora' : 'Criar Conta no Imnora'}
            </h3>
            <p className="text-xs text-[#5C5346] mt-0.5">
              {mode === 'login'
                ? 'Faça login para ser direcionado ao seu dashboard exclusivo'
                : 'Cadastre seu perfil verídico conectado ao banco de dados'}
            </p>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="p-2 text-[#857B6E] hover:text-[#081426] hover:bg-[#EFE9DE] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#EFE9DE] rounded-xl text-xs font-bold border border-[#E2D7C5]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#081426] text-[#FAF8F5] shadow-xs'
                  : 'text-[#5C5346] hover:text-[#081426]'
              }`}
            >
              Entrar com E-mail
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#081426] text-[#FAF8F5] shadow-xs'
                  : 'text-[#5C5346] hover:text-[#081426]'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {/* Registration Role Selection */}
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#081426]">Selecione seu perfil:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'buyer'
                      ? 'border-[#081426] bg-[#081426] text-[#FAF8F5] ring-2 ring-[#C5A880]'
                      : 'border-[#E5D9C5] bg-white hover:border-[#C5A880] text-[#5C5346]'
                  }`}
                >
                  <Home className={`w-4 h-4 mb-1 ${role === 'buyer' ? 'text-[#C5A880]' : 'text-[#857B6E]'}`} />
                  <div className="text-xs font-bold">Comprador</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'seller'
                      ? 'border-[#081426] bg-[#081426] text-[#FAF8F5] ring-2 ring-[#C5A880]'
                      : 'border-[#E5D9C5] bg-white hover:border-[#C5A880] text-[#5C5346]'
                  }`}
                >
                  <Briefcase className={`w-4 h-4 mb-1 ${role === 'seller' ? 'text-[#C5A880]' : 'text-[#857B6E]'}`} />
                  <div className="text-xs font-bold">Corretor</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'owner'
                      ? 'border-[#081426] bg-[#081426] text-[#FAF8F5] ring-2 ring-[#C5A880]'
                      : 'border-[#E5D9C5] bg-white hover:border-[#C5A880] text-[#5C5346]'
                  }`}
                >
                  <KeyRound className={`w-4 h-4 mb-1 ${role === 'owner' ? 'text-[#C5A880]' : 'text-[#857B6E]'}`} />
                  <div className="text-xs font-bold">Proprietário</div>
                </button>
              </div>
            </div>
          )}

          {/* Additional register fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-[#081426]">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome e Sobrenome"
                  className="mt-1 w-full px-3 py-2 text-xs text-[#081426] bg-white border border-[#E5D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#081426]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#081426]">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="mt-1 w-full px-3 py-2 text-xs text-[#081426] bg-white border border-[#E5D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#081426]"
                />
              </div>

              {role === 'seller' && (
                <div className="p-3 bg-[#EFE9DE] border border-[#E2D7C5] rounded-xl space-y-2">
                  <div className="text-xs font-bold text-[#081426] flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#C5A880]" />
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
                        className="w-full px-2.5 py-1.5 text-xs text-[#081426] bg-white border border-[#E5D9C5] rounded-lg"
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
                        className="w-full px-2.5 py-1.5 text-xs text-[#081426] bg-white border border-[#E5D9C5] rounded-lg text-center font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Regiões de atuação, especialidades..."
                      className="mt-1 w-full p-2 text-xs text-[#081426] bg-white border border-[#E5D9C5] rounded-lg resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email & Password */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#081426]">E-mail</label>
            </div>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-[#857B6E] absolute left-3 top-2.5" />
              <input
                id="modal-login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-9 pr-3 py-2 text-xs text-[#081426] bg-white border border-[#E5D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#081426]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#081426]">Senha</label>
            </div>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-[#857B6E] absolute left-3 top-2.5" />
              <input
                id="modal-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 dígitos"
                className="w-full pl-9 pr-9 py-2 text-xs text-[#081426] bg-white border border-[#E5D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#081426]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-[#857B6E] hover:text-[#081426] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#081426] hover:bg-[#122744] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Processando...' : mode === 'login' ? 'Entrar no Imnora' : 'Criar Minha Conta'}
            <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
          </button>
        </form>
      </div>
    </div>
  );
};
