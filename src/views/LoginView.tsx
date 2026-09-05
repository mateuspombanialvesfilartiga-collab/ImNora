import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
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
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

interface LoginViewProps {
  onNavigate: (view: string) => void;
  initialMode?: 'login' | 'register';
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, initialMode = 'login' }) => {
  const { user, isAuthenticated, login, register, logout } = useAuth();
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessMessage('Login realizado com sucesso!');
        setTimeout(() => {
          onNavigate('explore');
        }, 500);
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
        setSuccessMessage('Conta criada com sucesso!');
        setTimeout(() => {
          if (role === 'owner') onNavigate('owner_dashboard');
          else if (role === 'seller') onNavigate('seller_dashboard');
          else onNavigate('explore');
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar operação. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold text-2xl">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Sessão Ativa
            </span>
            <h2 className="text-2xl font-black text-slate-900">{user.fullName}</h2>
            <p className="text-xs text-slate-500 mt-1">{user.email}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              Papel: {user.role === 'owner' ? 'Proprietário' : user.role === 'seller' ? 'Corretor (Vendedor)' : user.role === 'buyer' ? 'Comprador' : 'Administrador'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            {user.role === 'owner' && (
              <button
                onClick={() => onNavigate('owner_dashboard')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Ir para Meus Imóveis
              </button>
            )}
            {user.role === 'seller' && (
              <button
                onClick={() => onNavigate('seller_dashboard')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Ir para Painel do Corretor
              </button>
            )}
            {user.role === 'buyer' && (
              <button
                onClick={() => onNavigate('buyer_dashboard')}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Ir para Imóveis Favoritos
              </button>
            )}
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin_panel')}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Ir para Painel de Administração
              </button>
            )}

            <button
              onClick={() => onNavigate('explore')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              Explorar Imóveis
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={async () => {
                await logout();
                onNavigate('login');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
            >
              Sair desta conta / Entrar com outro usuário
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Portal de Autenticação Segura elo
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Acessar sua Conta' : 'Criar Nova Conta no elo'}
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {mode === 'login'
              ? 'Entre com seu e-mail e senha cadastrados para acessar sua conta.'
              : 'Cadastre-se como Comprador, Corretor ou Proprietário para participar do marketplace imobiliário.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            id="tab-login-btn"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-3 rounded-xl transition-all ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrar na Conta
          </button>
          <button
            type="button"
            id="tab-register-btn"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-3 rounded-xl transition-all ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold">Atenção</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">Sucesso</p>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Role Selection */}
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                Escolha seu Tipo de Usuário (Obrigatório)
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === 'buyer'
                      ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Home className={`w-5 h-5 mb-1 ${role === 'buyer' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-slate-900">Comprador</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Buscar & visitar imóveis</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === 'seller'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 mb-1 ${role === 'seller' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-slate-900">Corretor</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Candidatar com CRECI</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === 'owner'
                      ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <KeyRound className={`w-5 h-5 mb-1 ${role === 'owner' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-slate-900">Proprietário</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Anunciar & escolher corretor</div>
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700">Nome Completo</label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Telefone / WhatsApp</label>
                <div className="relative mt-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {role === 'seller' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    Credenciamento Profissional Obrigatório (CRECI)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Número do CRECI</label>
                      <input
                        type="text"
                        required
                        value={creciNumber}
                        onChange={(e) => setCreciNumber(e.target.value)}
                        placeholder="Ex: 123456"
                        className="mt-1 w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">UF</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={creciState}
                        onChange={(e) => setCreciState(e.target.value.toUpperCase())}
                        placeholder="SP"
                        className="mt-1 w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl uppercase text-center font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Apresentação / Especialidades</label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Bairros de foco, anos de mercado..."
                      className="mt-1 w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email input */}
          <div>
            <label className="text-xs font-bold text-slate-700">E-mail</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-input-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="text-xs font-bold text-slate-700">Senha</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-input-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 dígitos (letras e números)"
                className="w-full pl-9 pr-10 py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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

          {/* Submit button */}
          <button
            id="login-submit-button"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isLoading ? (
              'Autenticando...'
            ) : mode === 'login' ? (
              <>
                Entrar no elo
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              'Criar Minha Conta no elo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
