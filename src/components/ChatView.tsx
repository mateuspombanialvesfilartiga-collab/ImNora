import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../types.js';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  MessageSquare,
  Send,
  UserCheck,
  ShieldCheck,
  Building2,
  Clock,
  AlertCircle,
  Home,
  Briefcase,
  KeyRound,
  ArrowLeft,
  Sparkles,
  Users
} from 'lucide-react';

export interface ChatViewProps {
  initialConversationId?: string | null;
  onOpenProperty: (propertyId: string) => void;
  // Requested tab mode:
  // 'seller' = "Chat com o vendedor" (for Buyer or Owner)
  // 'owners' = "Chat com os proprietários" (for Seller)
  // 'buyers' = "Chat com os compradores" (for Seller)
  // 'all' = default
  chatMode?: 'seller' | 'owners' | 'buyers' | 'all';
  onSwitchChatMode?: (mode: 'owners' | 'buyers' | 'seller') => void;
  onOpenExplore?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  initialConversationId,
  onOpenProperty,
  chatMode = 'all',
  onSwitchChatMode,
  onOpenExplore
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For seller role, internal tab selection: 'owners' | 'buyers'
  const [sellerSubTab, setSellerSubTab] = useState<'owners' | 'buyers'>(
    chatMode === 'buyers' ? 'buyers' : 'owners'
  );

  // Sync if prop changes
  useEffect(() => {
    if (chatMode === 'buyers') setSellerSubTab('buyers');
    else if (chatMode === 'owners') setSellerSubTab('owners');
  }, [chatMode]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await apiRequest<{ conversations: Conversation[] }>('/api/conversations');
      setConversations(res.conversations);
      if (!activeConvId && res.conversations.length > 0) {
        // Find first eligible conversation matching current filter
        const eligible = res.conversations.filter(c => {
          if (user?.role === 'buyer') return c.conversation_type === 'buyer_seller';
          if (user?.role === 'owner') return c.conversation_type === 'seller_owner';
          if (user?.role === 'seller') {
            return sellerSubTab === 'owners'
              ? c.conversation_type === 'seller_owner'
              : c.conversation_type === 'buyer_seller';
          }
          return true;
        });
        if (eligible.length > 0) {
          setActiveConvId(eligible[0].id);
        } else if (res.conversations.length > 0) {
          setActiveConvId(res.conversations[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar conversas.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [sellerSubTab]);

  const fetchMessages = async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await apiRequest<{ messages: Message[] }>(`/api/conversations/${convId}/messages`);
      setMessages(res.messages);
    } catch (err: any) {
      setError(err.message || 'Erro ao abrir conversa.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !messageInput.trim() || isSending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      const res = await apiRequest<{ message: Message }>(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      setMessages(prev => [...prev, res.message]);
      fetchConversations();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations according to role and active tab
  const filteredConversations = conversations.filter(conv => {
    if (user?.role === 'buyer') {
      // Buyer chatting with sellers
      return conv.conversation_type === 'buyer_seller';
    }
    if (user?.role === 'owner') {
      // Owner chatting with assigned seller
      return conv.conversation_type === 'seller_owner';
    }
    if (user?.role === 'seller') {
      if (sellerSubTab === 'owners') {
        return conv.conversation_type === 'seller_owner';
      }
      return conv.conversation_type === 'buyer_seller';
    }
    return true;
  });

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Counts for Seller tabs
  const ownersCount = conversations.filter(c => c.conversation_type === 'seller_owner').length;
  const buyersCount = conversations.filter(c => c.conversation_type === 'buyer_seller').length;

  // Unread counts for Seller tabs
  const ownersUnread = conversations
    .filter(c => c.conversation_type === 'seller_owner')
    .reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const buyersUnread = conversations
    .filter(c => c.conversation_type === 'buyer_seller')
    .reduce((sum, c) => sum + (c.unread_count || 0), 0);

  // Determine header label based on requested naming
  const getHeaderTitle = () => {
    if (user?.role === 'buyer') return 'Chat com o vendedor';
    if (user?.role === 'owner') return 'Chat com o vendedor';
    if (user?.role === 'seller') {
      return sellerSubTab === 'owners' ? 'Chat com os proprietários' : 'Chat com os compradores';
    }
    return 'Central de Mensagens';
  };

  const getHeaderSubtitle = () => {
    if (user?.role === 'buyer') return 'Mensagens diretas com o corretor responsável pelo imóvel';
    if (user?.role === 'owner') return 'Alinhamento de visitas e negociação com seu corretor autorizado';
    if (user?.role === 'seller') {
      return sellerSubTab === 'owners'
        ? 'Relatórios de visitas e alinhamentos com proprietários de imóveis'
        : 'Atendimento, esclarecimento de dúvidas e agendamento de visitas com compradores';
    }
    return 'Comunicação direta, segura e auditada pelo elo';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-6rem)]">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col sm:flex-row overflow-hidden">
        {/* Left conversations list */}
        <div
          className={`w-full sm:w-80 md:w-96 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50 ${
            activeConvId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-700" />
                {getHeaderTitle()}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              {getHeaderSubtitle()}
            </p>

            {/* If seller: Two tabs ("Chat com os proprietários" / "Chat com os compradores") */}
            {user?.role === 'seller' && (
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold mt-3">
                <button
                  type="button"
                  id="tab-chat-owners"
                  onClick={() => {
                    setSellerSubTab('owners');
                    if (onSwitchChatMode) onSwitchChatMode('owners');
                  }}
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                    sellerSubTab === 'owners'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Proprietários</span>
                  {ownersCount > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full font-semibold">
                      {ownersCount}
                    </span>
                  )}
                  {ownersUnread > 0 && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></span>
                  )}
                </button>

                <button
                  type="button"
                  id="tab-chat-buyers"
                  onClick={() => {
                    setSellerSubTab('buyers');
                    if (onSwitchChatMode) onSwitchChatMode('buyers');
                  }}
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                    sellerSubTab === 'buyers'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">Compradores</span>
                  {buyersCount > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full font-semibold">
                      {buyersCount}
                    </span>
                  )}
                  {buyersUnread > 0 && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingList ? (
              <div className="p-8 text-center text-xs text-slate-400">Carregando conversas...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    {user?.role === 'seller'
                      ? sellerSubTab === 'owners'
                        ? 'Nenhuma conversa com proprietários ainda'
                        : 'Nenhuma conversa com compradores ainda'
                      : 'Nenhuma conversa ativa ainda'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {user?.role === 'buyer'
                      ? 'Ao explorar um imóvel de seu interesse, você pode clicar em "Conversar com Corretor".'
                      : user?.role === 'owner'
                      ? 'Ao selecionar um corretor em "Meus Imóveis", o canal de conversa é aberto imediatamente.'
                      : 'As conversas com seus clientes aparecerão organizadas aqui conforme novos contatos forem realizados.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                      isActive ? 'bg-white shadow-xs border-l-4 border-l-slate-900' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    {conv.peer.photo ? (
                      <img
                        src={conv.peer.photo}
                        alt={conv.peer.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {conv.peer.name.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.peer.name}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        {conv.peer.role === 'seller'
                          ? 'Corretor (Vendedor)'
                          : conv.peer.role === 'owner'
                          ? 'Proprietário'
                          : 'Comprador'}
                        {conv.peer.creci && ` • CRECI ${conv.peer.creci}`}
                      </div>

                      <div className="text-[11px] text-slate-400 truncate mt-1">
                        Imóvel: {conv.property_title}
                      </div>

                      {conv.last_message && (
                        <p className="text-[11px] text-slate-600 truncate mt-1 italic">
                          "{conv.last_message}"
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right chat window */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !activeConvId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Header */}
              <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  {/* Mobile Back button to list */}
                  <button
                    type="button"
                    onClick={() => setActiveConvId(null)}
                    className="sm:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                    title="Voltar para a lista"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {activeConv.peer.photo ? (
                    <img
                      src={activeConv.peer.photo}
                      alt={activeConv.peer.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-sm">
                      {activeConv.peer.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {activeConv.peer.name}
                      {activeConv.peer.creci && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                          CRECI {activeConv.peer.creci}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Imóvel:{' '}
                      <button
                        onClick={() => onOpenProperty(activeConv.property_id)}
                        className="font-medium text-slate-800 hover:text-emerald-700 underline text-left"
                      >
                        {activeConv.property_title}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 hidden md:block">
                  {activeConv.conversation_type === 'buyer_seller'
                    ? 'Comprador ↔ Corretor'
                    : 'Corretor ↔ Proprietário'}
                </div>
              </div>

              {/* Messages container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
                {isLoadingMessages ? (
                  <div className="text-center text-xs text-slate-400 py-10">Carregando histórico...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-10">
                    Envie a primeira mensagem para iniciar a conversa protegida.
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-slate-900 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (msg.read_at ? ' • Lida' : ' • Enviada')}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Escreva sua mensagem com clareza e cordialidade..."
                  className="flex-1 px-4 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 stroke-1" />
              <div className="text-sm font-semibold text-slate-700">Selecione uma conversa</div>
              <p className="text-xs text-slate-400 max-w-sm">
                Converse com segurança com os corretores autônomos ou proprietários autorizados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
