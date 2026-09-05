import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Property, SellerPublicProfile } from './types.js';
import { apiRequest } from './api/client.js';
import { Navbar } from './components/Navbar.js';
import { ExploreView } from './views/ExploreView.js';
import { SellersView } from './views/SellersView.js';
import { HowItWorksView } from './views/HowItWorksView.js';
import { LoginView } from './views/LoginView.js';
import { OwnerDashboardView } from './views/OwnerDashboardView.js';
import { SellerDashboardView } from './views/SellerDashboardView.js';
import { BuyerDashboardView } from './views/BuyerDashboardView.js';
import { AdminPanel } from './components/AdminPanel.js';
import { ChatView } from './components/ChatView.js';
import { ImnoraLogo } from './components/ImnoraLogo.js';

// Modals
import { AuthModal } from './components/AuthModal.js';
import { PropertyDetailModal } from './components/PropertyDetailModal.js';
import { ApplyModal } from './components/ApplyModal.js';
import { OwnerApplicationsView } from './components/OwnerApplicationsView.js';
import { NewPropertyModal } from './components/NewPropertyModal.js';
import { ConcludeSaleModal } from './components/ConcludeSaleModal.js';
import { ReviewModal } from './components/ReviewModal.js';
import { SellerProfileModal } from './components/SellerProfileModal.js';

function MainLayout() {
  const { user, isAuthenticated } = useAuth();

  // Navigation views:
  // 'explore' | 'sellers' | 'how_it_works' | 'login'
  // 'owner_dashboard' | 'seller_dashboard' | 'buyer_dashboard' | 'dashboard'
  // 'chat_seller' | 'chat_owners' | 'chat_buyers' | 'chat'
  // 'admin_panel' | 'admin'
  const [currentView, setCurrentView] = useState<string>('explore');

  // Active Modals
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [applyProperty, setApplyProperty] = useState<Property | null>(null);
  const [disputePropertyId, setDisputePropertyId] = useState<string | null>(null);
  const [isNewPropertyOpen, setIsNewPropertyOpen] = useState(false);
  const [concludeSaleProperty, setConcludeSaleProperty] = useState<Property | null>(null);
  const [sellerProfileId, setSellerProfileId] = useState<string | null>(null);
  const [reviewModalData, setReviewModalData] = useState<{
    isOpen: boolean;
    negotiationId: string;
    sellerName: string;
    propertyTitle: string;
  } | null>(null);

  // Chat initial conversation
  const [chatInitialConvId, setChatInitialConvId] = useState<string | null>(null);

  // Handlers
  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleApply = (property: Property) => {
    if (!isAuthenticated) {
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }
    setApplyProperty(property);
  };

  const handleStartChatWithSeller = async (sellerId: string, propertyId?: string) => {
    if (!isAuthenticated) {
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }

    if (propertyId) {
      try {
        const res = await apiRequest<{ conversationId: string }>('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            propertyId,
            recipientId: sellerId,
            initialMessage: 'Olá! Tenho interesse no imóvel e gostaria de tirar algumas dúvidas.'
          })
        });
        setChatInitialConvId(res.conversationId);
      } catch (err) {
        console.warn('Conversation might already exist', err);
      }
    }

    setCurrentView('chat_seller');
  };

  const handleOpenPropertyById = async (propId: string) => {
    try {
      const res = await apiRequest<{ property: Property }>(`/api/properties/${propId}`);
      setSelectedProperty(res.property);
    } catch (err) {
      console.error('Error fetching property detail', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col font-sans antialiased text-[#081426] selection:bg-[#081426] selection:text-[#FAF8F5]">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'login') {
            setCurrentView('login');
          } else if (view === 'dashboard') {
            if (user?.role === 'owner') setCurrentView('owner_dashboard');
            else if (user?.role === 'seller') setCurrentView('seller_dashboard');
            else if (user?.role === 'buyer') setCurrentView('buyer_dashboard');
            else if (user?.role === 'admin') setCurrentView('admin_panel');
            else setCurrentView('login');
          } else {
            setCurrentView(view);
          }
        }}
        onOpenAuth={handleOpenAuth}
        onOpenNewProperty={() => {
          if (!isAuthenticated) {
            setAuthModal({ isOpen: true, mode: 'login' });
          } else {
            setIsNewPropertyOpen(true);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Explore Properties View */}
        {currentView === 'explore' && (
          <ExploreView
            onSelectProperty={(p) => setSelectedProperty(p)}
            onQuickApply={handleApply}
            userRole={user?.role}
            onOpenNewProperty={() => {
              if (!isAuthenticated) {
                setAuthModal({ isOpen: true, mode: 'login' });
              } else {
                setIsNewPropertyOpen(true);
              }
            }}
            onOpenAuth={handleOpenAuth}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {/* Sellers Directory View */}
        {currentView === 'sellers' && (
          <SellersView
            onOpenSellerProfile={(id) => setSellerProfileId(id)}
          />
        )}

        {/* How It Works Explanation View */}
        {currentView === 'how_it_works' && (
          <HowItWorksView onOpenAuth={handleOpenAuth} />
        )}

        {/* Dedicated Login / Register View */}
        {currentView === 'login' && (
          <LoginView
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {/* Owner Dashboard */}
        {(currentView === 'owner_dashboard' || (currentView === 'dashboard' && user?.role === 'owner')) && (
          <OwnerDashboardView
            onOpenNewProperty={() => setIsNewPropertyOpen(true)}
            onOpenDispute={(propId) => setDisputePropertyId(propId)}
            onOpenConcludeSale={(prop) => setConcludeSaleProperty(prop)}
            onStartChatWithSeller={(sellerId) => handleStartChatWithSeller(sellerId)}
            onOpenReviewModal={(negotiationId, sellerName, propTitle) => {
              setReviewModalData({
                isOpen: true,
                negotiationId,
                sellerName,
                propertyTitle: propTitle
              });
            }}
          />
        )}

        {/* Seller Dashboard */}
        {(currentView === 'seller_dashboard' || (currentView === 'dashboard' && user?.role === 'seller')) && (
          <SellerDashboardView
            onSelectProperty={(p) => setSelectedProperty(p)}
            onOpenApply={handleApply}
            onStartChat={() => setCurrentView('chat_buyers')}
          />
        )}

        {/* Buyer Dashboard */}
        {(currentView === 'buyer_dashboard' || (currentView === 'dashboard' && user?.role === 'buyer')) && (
          <BuyerDashboardView
            onSelectProperty={(p) => setSelectedProperty(p)}
            onOpenExplore={() => setCurrentView('explore')}
            onOpenChat={() => setCurrentView('chat_seller')}
            onOpenReviewModal={(negotiationId, sellerName, propTitle) => {
              setReviewModalData({
                isOpen: true,
                negotiationId,
                sellerName,
                propertyTitle: propTitle
              });
            }}
          />
        )}

        {/* Chat: Buyer or Owner chatting with seller ("Chat com o vendedor") */}
        {currentView === 'chat_seller' && (
          <ChatView
            chatMode="seller"
            initialConversationId={chatInitialConvId}
            onOpenProperty={handleOpenPropertyById}
            onOpenExplore={() => setCurrentView('explore')}
          />
        )}

        {/* Chat: Seller chatting with owners ("Chat com os proprietários") */}
        {currentView === 'chat_owners' && (
          <ChatView
            chatMode="owners"
            initialConversationId={chatInitialConvId}
            onOpenProperty={handleOpenPropertyById}
            onSwitchChatMode={(mode) => {
              if (mode === 'buyers') setCurrentView('chat_buyers');
            }}
            onOpenExplore={() => setCurrentView('explore')}
          />
        )}

        {/* Chat: Seller chatting with buyers ("Chat com os compradores") */}
        {currentView === 'chat_buyers' && (
          <ChatView
            chatMode="buyers"
            initialConversationId={chatInitialConvId}
            onOpenProperty={handleOpenPropertyById}
            onSwitchChatMode={(mode) => {
              if (mode === 'owners') setCurrentView('chat_owners');
            }}
            onOpenExplore={() => setCurrentView('explore')}
          />
        )}

        {/* Generic Chat fallback */}
        {currentView === 'chat' && (
          <ChatView
            chatMode="all"
            initialConversationId={chatInitialConvId}
            onOpenProperty={handleOpenPropertyById}
            onOpenExplore={() => setCurrentView('explore')}
          />
        )}

        {/* Admin Panel */}
        {(currentView === 'admin_panel' || currentView === 'admin' || (currentView === 'dashboard' && user?.role === 'admin')) && (
          <AdminPanel />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#081426] border-t border-[#1A2E4C] mt-20 py-8 text-xs text-[#D4C3A3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <ImnoraLogo variant="light" size="sm" />
            <span className="hidden sm:inline text-[#1F3759]">|</span>
            <span className="text-[#A39682]">
              A startup imobiliária que substitui os 6% fixos por concorrência justa e corretores com CRECI ativo.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#857B6E]">
            <span className="flex items-center gap-1.5 text-[#C5A880] font-medium">
              <span className="w-2 h-2 bg-[#C5A880] rounded-full inline-block animate-pulse"></span>
              Plataforma Ativa & Imóveis 100% Reais
            </span>
            <span>•</span>
            <button
              onClick={() => setCurrentView('how_it_works')}
              className="hover:text-[#FAF8F5] transition-colors cursor-pointer"
            >
              Como Funciona
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('admin_panel')}
              className="hover:text-[#FAF8F5] font-semibold transition-colors cursor-pointer"
            >
              Painel de Auditoria
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      {authModal.isOpen && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
          onSuccess={() => {
            setAuthModal({ isOpen: false, mode: 'login' });
          }}
        />
      )}

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          currentUser={user}
          onClose={() => setSelectedProperty(null)}
          onStartChatWithSeller={async (prop, sellerId) => {
            setSelectedProperty(null);
            await handleStartChatWithSeller(sellerId, prop.id);
          }}
          onOpenApply={(prop) => {
            setSelectedProperty(null);
            handleApply(prop);
          }}
          onOpenOwnerDispute={(propId) => {
            setSelectedProperty(null);
            setDisputePropertyId(propId);
          }}
          onOpenSellerProfile={(sellerId) => {
            setSelectedProperty(null);
            setSellerProfileId(sellerId);
          }}
        />
      )}

      {applyProperty && (
        <ApplyModal
          property={applyProperty}
          onClose={() => setApplyProperty(null)}
          onSuccess={() => {
            setApplyProperty(null);
            if (user?.role === 'seller') {
              setCurrentView('seller_dashboard');
            }
          }}
        />
      )}

      {disputePropertyId && (
        <OwnerApplicationsView
          propertyId={disputePropertyId}
          onClose={() => setDisputePropertyId(null)}
          onApplicationAccepted={() => {
            setDisputePropertyId(null);
            setCurrentView('owner_dashboard');
          }}
        />
      )}

      {isNewPropertyOpen && (
        <NewPropertyModal
          onClose={() => setIsNewPropertyOpen(false)}
          onSuccess={() => {
            setIsNewPropertyOpen(false);
            setCurrentView('owner_dashboard');
          }}
        />
      )}

      {concludeSaleProperty && (
        <ConcludeSaleModal
          property={concludeSaleProperty}
          onClose={() => setConcludeSaleProperty(null)}
          onSuccess={() => {
            setConcludeSaleProperty(null);
            setCurrentView('owner_dashboard');
          }}
        />
      )}

      {sellerProfileId && (
        <SellerProfileModal
          sellerId={sellerProfileId}
          onClose={() => setSellerProfileId(null)}
          onSelectProperty={(prop) => {
            setSellerProfileId(null);
            setSelectedProperty(prop);
          }}
        />
      )}

      {reviewModalData?.isOpen && (
        <ReviewModal
          negotiationId={reviewModalData.negotiationId}
          sellerName={reviewModalData.sellerName}
          propertyTitle={reviewModalData.propertyTitle}
          onClose={() => setReviewModalData(null)}
          onSuccess={() => {
            setReviewModalData(null);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
