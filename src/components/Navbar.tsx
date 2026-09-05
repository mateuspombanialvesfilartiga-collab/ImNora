import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ImnoraLogo } from './ImnoraLogo.js';
import {
  Building2,
  KeyRound,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  Heart,
  PlusCircle,
  Briefcase,
  Layers,
  ChevronDown,
  LogOut,
  Sparkles,
  Home,
  CheckCircle2,
  Clock,
  Menu,
  X,
  LogIn,
  Users
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenNewProperty: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenNewProperty
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = () => {
    if (!user) return null;
    let dotColor = 'bg-[#C5A880]';
    let label = 'Proprietário';

    switch (user.role) {
      case 'owner':
        dotColor = 'bg-[#C5A880]';
        label = 'Proprietário';
        break;
      case 'seller':
        dotColor = user.sellerVerifiedStatus === 'approved' ? 'bg-[#C5A880]' : 'bg-amber-400';
        label = user.sellerVerifiedStatus === 'approved' ? 'Corretor Verificado' : 'Corretor (Pendente)';
        break;
      case 'buyer':
        dotColor = 'bg-sky-400';
        label = 'Comprador';
        break;
      case 'admin':
        dotColor = 'bg-purple-400';
        label = 'Administrador';
        break;
    }

    return (
      <div className="flex items-center gap-2 bg-[#0F223D] px-3 py-1 rounded-full border border-[#1F3759]">
        <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
        <span className="text-[11px] text-[#EFE9DE] uppercase font-bold tracking-wider">{label}</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#081426] border-b border-[#1A2E4C] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              id="nav-logo-btn"
              onClick={() => onNavigate('explore')}
              className="group text-left focus:outline-none shrink-0 cursor-pointer"
            >
              <ImnoraLogo variant="light" size="sm" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium">
              <button
                id="nav-explore-btn"
                onClick={() => onNavigate('explore')}
                className={`transition-colors py-1 ${
                  currentView === 'explore'
                    ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                    : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                }`}
              >
                Imóveis
              </button>
              <button
                id="nav-sellers-btn"
                onClick={() => onNavigate('sellers')}
                className={`transition-colors py-1 ${
                  currentView === 'sellers'
                    ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                    : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                }`}
              >
                Corretores Autônomos
              </button>
              <button
                id="nav-how-it-works-btn"
                onClick={() => onNavigate('how_it_works')}
                className={`transition-colors py-1 ${
                  currentView === 'how_it_works'
                    ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                    : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                }`}
              >
                Como Funciona
              </button>

              {/* Unauthenticated: Visible Login tab */}
              {!user && (
                <button
                  id="nav-login-tab-btn"
                  onClick={() => onNavigate('login')}
                  className={`transition-colors py-1 flex items-center gap-1.5 ${
                    currentView === 'login'
                      ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                      : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 text-[#C5A880]" />
                  Entrar / Login
                </button>
              )}

              {/* Owner Role Navigation */}
              {user?.role === 'owner' && (
                <>
                  <button
                    id="nav-owner-dashboard-btn"
                    onClick={() => onNavigate('owner_dashboard')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'owner_dashboard'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#C5A880]" />
                    Meus Imóveis
                  </button>
                  <button
                    id="nav-owner-chat-seller-btn"
                    onClick={() => onNavigate('chat_seller')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'chat_seller' || currentView === 'chat'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C5A880]" />
                    Chat com o vendedor
                  </button>
                </>
              )}

              {/* Buyer Role Navigation */}
              {user?.role === 'buyer' && (
                <>
                  <button
                    id="nav-buyer-favorites-btn"
                    onClick={() => onNavigate('buyer_dashboard')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'buyer_dashboard'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-[#C5A880]" />
                    Favoritos
                  </button>
                  <button
                    id="nav-buyer-chat-seller-btn"
                    onClick={() => onNavigate('chat_seller')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'chat_seller' || currentView === 'chat'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C5A880]" />
                    Chat com o vendedor
                  </button>
                </>
              )}

              {/* Seller Role Navigation: TWO specific tabs */}
              {user?.role === 'seller' && (
                <>
                  <button
                    id="nav-seller-dashboard-btn"
                    onClick={() => onNavigate('seller_dashboard')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'seller_dashboard'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-[#C5A880]" />
                    Painel Corretor
                  </button>
                  <button
                    id="nav-seller-chat-owners-btn"
                    onClick={() => onNavigate('chat_owners')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'chat_owners'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#C5A880]" />
                    Chat com os proprietários
                  </button>
                  <button
                    id="nav-seller-chat-buyers-btn"
                    onClick={() => onNavigate('chat_buyers')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'chat_buyers'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-[#C5A880]" />
                    Chat com os compradores
                  </button>
                </>
              )}

              {/* Admin Role Navigation */}
              {user?.role === 'admin' && (
                <>
                  <button
                    id="nav-admin-panel-btn"
                    onClick={() => onNavigate('admin_panel')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'admin_panel'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                    Administração
                  </button>
                  <button
                    id="nav-admin-chat-btn"
                    onClick={() => onNavigate('chat')}
                    className={`transition-colors py-1 flex items-center gap-1.5 ${
                      currentView === 'chat'
                        ? 'text-[#FAF8F5] border-b-2 border-[#C5A880] font-semibold'
                        : 'text-[#D4C3A3] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C5A880]" />
                    Mensagens
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5 lg:gap-3">
            {/* If Owner: "+ Anunciar Imóvel" */}
            {user?.role === 'owner' && (
              <button
                id="nav-publish-property-btn"
                onClick={onOpenNewProperty}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-[#C5A880] hover:bg-[#B89563] text-[#081426] text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Anunciar Imóvel
              </button>
            )}

            {/* Authenticated user menu vs Login/Register */}
            {user ? (
              <div className="relative">
                <button
                  id="nav-user-profile-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 hover:bg-[#0F223D] rounded-full transition-colors"
                >
                  <div className="hidden sm:block">
                    {getRoleBadge()}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#162D4D] border border-[#2B476D] flex items-center justify-center text-[#FAF8F5] font-bold text-xs shadow-xs">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#D4C3A3] hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5 sm:hidden">{getRoleBadge()}</div>
                    </div>

                    {user.role === 'owner' && (
                      <>
                        <button
                          onClick={() => {
                            onNavigate('owner_dashboard');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <KeyRound className="w-4 h-4 text-emerald-600" />
                          Meus Imóveis & Candidatos
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('chat_seller');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          Chat com o vendedor
                        </button>
                      </>
                    )}

                    {user.role === 'seller' && (
                      <>
                        <button
                          onClick={() => {
                            onNavigate('seller_dashboard');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Briefcase className="w-4 h-4 text-amber-600" />
                          Painel de Oportunidades
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('chat_owners');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <KeyRound className="w-4 h-4 text-emerald-600" />
                          Chat com os proprietários
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('chat_buyers');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Users className="w-4 h-4 text-sky-600" />
                          Chat com os compradores
                        </button>
                      </>
                    )}

                    {user.role === 'buyer' && (
                      <>
                        <button
                          onClick={() => {
                            onNavigate('buyer_dashboard');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          Imóveis Favoritos
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('chat_seller');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4 text-sky-600" />
                          Chat com o vendedor
                        </button>
                      </>
                    )}

                    {user.role === 'admin' && (
                      <>
                        <button
                          onClick={() => {
                            onNavigate('admin_panel');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          Painel de Controle Admin
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('chat');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          Todas as Conversas
                        </button>
                      </>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      id="nav-logout-btn"
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        onNavigate('explore');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da Conta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#D4C3A3] hover:text-[#FAF8F5] transition-colors"
                >
                  Entrar
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-1.5 text-xs font-bold text-[#081426] bg-[#C5A880] hover:bg-[#B89563] rounded-lg shadow-sm transition-all"
                >
                  Criar Conta
                </button>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              id="nav-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#D4C3A3] hover:text-[#FAF8F5] hover:bg-[#0F223D] rounded-lg"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1A2E4C] bg-[#081426] px-4 pt-2 pb-4 space-y-2 animate-in fade-in">
          <button
            onClick={() => {
              onNavigate('explore');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm font-medium text-[#D4C3A3] hover:text-[#FAF8F5]"
          >
            Imóveis
          </button>
          <button
            onClick={() => {
              onNavigate('sellers');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm font-medium text-[#D4C3A3] hover:text-[#FAF8F5]"
          >
            Corretores Autônomos
          </button>
          <button
            onClick={() => {
              onNavigate('how_it_works');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm font-medium text-[#D4C3A3] hover:text-[#FAF8F5]"
          >
            Como Funciona
          </button>

          {!user && (
            <div className="pt-2 border-t border-[#1A2E4C] flex flex-col gap-2">
              <button
                id="mobile-nav-login-tab-btn"
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#C5A880] flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Entrar / Login
              </button>
              <button
                onClick={() => {
                  onOpenAuth('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#081426] bg-[#C5A880] px-3 rounded-lg"
              >
                Criar Nova Conta
              </button>
            </div>
          )}

          {user?.role === 'owner' && (
            <>
              <button
                onClick={() => {
                  onNavigate('owner_dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#C5A880] flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Meus Imóveis & Disputas
              </button>
              <button
                id="mobile-nav-owner-chat-btn"
                onClick={() => {
                  onNavigate('chat_seller');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#EFE9DE] flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat com o vendedor
              </button>
            </>
          )}

          {user?.role === 'buyer' && (
            <>
              <button
                onClick={() => {
                  onNavigate('buyer_dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#C5A880] flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Imóveis Favoritos
              </button>
              <button
                id="mobile-nav-buyer-chat-btn"
                onClick={() => {
                  onNavigate('chat_seller');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#EFE9DE] flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat com o vendedor
              </button>
            </>
          )}

          {user?.role === 'seller' && (
            <>
              <button
                onClick={() => {
                  onNavigate('seller_dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#C5A880] flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Painel do Corretor
              </button>
              <button
                id="mobile-nav-seller-chat-owners-btn"
                onClick={() => {
                  onNavigate('chat_owners');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#EFE9DE] flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Chat com os proprietários
              </button>
              <button
                id="mobile-nav-seller-chat-buyers-btn"
                onClick={() => {
                  onNavigate('chat_buyers');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#EFE9DE] flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Chat com os compradores
              </button>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => {
                  onNavigate('admin_panel');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#C5A880] flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Administração & Testes
              </button>
              <button
                onClick={() => {
                  onNavigate('chat');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-semibold text-[#EFE9DE] flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Todas as Conversas
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
