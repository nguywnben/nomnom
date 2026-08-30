import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Icon from '../../components/Icon.jsx';
import {
  fetchChatConversationsApi,
  fetchChatMessagesApi,
  sendChatMessageApi,
  markChatReadApi,
} from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll.js';

const SUGGESTIONS = [
  'Quán ơi không cay nhé!',
  'Món chuẩn bị xong chưa ạ?',
  'Cho mình xin thêm nước chấm ạ',
  'Giao giúp mình ở cổng sau nhé',
];

function formatMsgTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget() {
  const { user, chatOpen, setChatOpen, activeChatId, setActiveChatId } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionScroll = useHorizontalDragScroll();

  // 1. Tải danh sách các cuộc trò chuyện
  const loadConversations = useCallback(async (silent = false) => {
    if (!user) return;
    try {
      const response = await fetchChatConversationsApi();
      setConversations(response.data || []);
      if (!silent) setError('');
    } catch (err) {
      if (!silent) setError(err.message || 'Không thể tải trò chuyện.');
    }
  }, [user]);

  // Polling danh sách hội thoại mỗi 5s
  useEffect(() => {
    if (!user) return undefined;
    loadConversations();
    const timer = window.setInterval(() => loadConversations(true), 5000);
    return () => window.clearInterval(timer);
  }, [loadConversations, user]);

  // 2. Tải tin nhắn khi đang mở một cuộc trò chuyện cụ thể trong Popup
  const loadMessages = useCallback(async (convId, silent = false) => {
    if (!convId || !user) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetchChatMessagesApi(convId);
      setMessages(res.data || []);
      // Tự động đánh dấu đã đọc
      markChatReadApi(convId).catch(() => {});
    } catch (err) {
      if (!silent) setError(err.message || 'Không thể tải tin nhắn.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [user]);

  // Polling tin nhắn mỗi 3s khi đang mở activeChatId
  useEffect(() => {
    if (!chatOpen || !activeChatId || !user) return undefined;
    loadMessages(activeChatId);
    const timer = window.setInterval(() => loadMessages(activeChatId, true), 3000);
    return () => window.clearInterval(timer);
  }, [chatOpen, activeChatId, loadMessages, user]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (chatOpen && activeChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen, activeChatId]);

  // 3. Gửi tin nhắn
  const handleSend = async (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !activeChatId || sending) return;

    setSending(true);
    try {
      const res = await sendChatMessageApi(activeChatId, textToSend);
      if (res?.message) {
        setMessages((prev) => [...prev, res.message]);
      }
      if (!customText) setInputText('');
      loadConversations(true);
    } catch (err) {
      setError(err.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  // Cuộc trò chuyện đang chọn
  const activeConversation = useMemo(() => {
    if (!activeChatId) return null;
    return conversations.find((c) => String(c.id) === String(activeChatId)) || null;
  }, [activeChatId, conversations]);

  // Không hiển thị widget khi đang đứng trong trang Chat toàn màn hình
  if (!user || location.pathname.startsWith('/chat')) {
    return null;
  }

  const totalUnread = conversations.reduce((total, item) => total + (item.unreadCount || 0), 0);

  return (
    <>
      {/* Nút tròn nổi mở popup */}
      {!chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-button text-on-primary shadow-soft-lg hover:bg-primary-active active:scale-95 transition-all md:bottom-6 md:right-6"
          aria-label="Mở trò chuyện"
        >
          <Icon name="chat" size={18} />
          <span className="font-semibold hidden sm:inline">Trò chuyện</span>
          {totalUnread > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-primary nums">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Khung Popup Chat Nhỏ Nổi Góc Phải Dưới */}
      {chatOpen && (
        <section
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3 z-40 flex h-[520px] max-h-[calc(100vh-120px)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card shadow-soft-xl md:bottom-6 md:right-6 animate-in fade-in slide-in-from-bottom-3 duration-200"
          aria-label="Khung trò chuyện nhỏ"
        >
          {/* Header Popup */}
          <header className="flex items-center justify-between border-b border-hairline bg-surface-card px-3.5 py-3 shadow-xs">
            {activeChatId && activeConversation ? (
              // Header khi đang trong phòng chat
              <>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setActiveChatId(null)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-canvas-soft text-body hover:text-ink transition-colors"
                    aria-label="Quay lại danh sách"
                  >
                    <Icon name="chevronLeft" size={16} />
                  </button>
                  <Avatar
                    src={activeConversation.otherParticipant?.avatarUrl}
                    name={activeConversation.restaurantName || activeConversation.otherParticipant?.name}
                    size="sm"
                    className="border border-hairline shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-sm font-bold text-ink">
                      {activeConversation.restaurantName || activeConversation.otherParticipant?.name}
                    </div>
                    <div className="truncate text-[11px] text-body flex items-center gap-1">
                      <span>Đơn:</span>
                      <span className="font-semibold text-primary">#{activeConversation.orderCode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setChatOpen(false);
                      navigate(`/chat/${activeChatId}`);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas-soft text-body hover:text-ink transition-colors"
                    title="Mở toàn màn hình"
                    aria-label="Mở toàn màn hình"
                  >
                    <Icon name="arrowRight" size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas-soft text-body hover:text-ink transition-colors"
                    aria-label="Đóng popup"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              </>
            ) : (
              // Header khi ở danh sách cuộc trò chuyện
              <>
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon name="chat" size={15} />
                  </div>
                  <div>
                    <div className="text-body-sm font-bold text-ink">Trò chuyện theo đơn</div>
                    <div className="text-[11px] text-body">
                      {totalUnread > 0 ? `${totalUnread} tin nhắn mới chưa đọc` : 'Hỗ trợ khách hàng & Quán ăn'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setChatOpen(false);
                      navigate('/chat/inbox');
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas-soft text-body hover:text-ink transition-colors"
                    title="Mở trang hộp thư lớn"
                    aria-label="Mở trang hộp thư lớn"
                  >
                    <Icon name="arrowRight" size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas-soft text-body hover:text-ink transition-colors"
                    aria-label="Đóng popup"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              </>
            )}
          </header>

          {/* Body Popup: Chế độ 1 (Danh sách hội thoại) hoặc Chế độ 2 (Phòng chat trực tiếp) */}
          {activeChatId ? (
            // ===== CHẾ ĐỘ 2: PHÒNG CHAT TRỰC TIẾP =====
            <div className="flex flex-1 flex-col min-h-0 bg-canvas-subtle/30">
              {/* Vùng hiển thị tin nhắn */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Banner ngữ cảnh đơn hàng */}
                <div className="rounded-xl border border-hairline bg-surface-card p-2.5 text-center shadow-xs">
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink">
                    <Icon name="package" size={13} className="text-primary" />
                    Đơn hàng #{activeConversation?.orderCode}
                  </div>
                  <p className="text-[10px] text-body mt-0.5">
                    Mọi tin nhắn được lưu trữ theo tiến độ đơn hàng
                  </p>
                </div>

                {loadingMessages ? (
                  <div className="py-8 text-center text-caption text-body">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="py-8 text-center text-body-sm text-body">
                    <p className="font-medium text-ink">Chưa có tin nhắn nào</p>
                    <p className="text-[11px] mt-1 text-body">Gửi câu hỏi hoặc chọn gợi ý bên dưới để trao đổi nhé!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const mine = Number(msg.senderUserId) === Number(user?.id);
                    return (
                      <div
                        key={msg.id}
                        className={clsx('flex flex-col', mine ? 'items-end' : 'items-start')}
                      >
                        <div
                          className={clsx(
                            'max-w-[85%] rounded-2xl px-3.5 py-2 text-body-sm break-words shadow-xs',
                            mine
                              ? 'bg-primary text-white rounded-br-xs'
                              : 'bg-surface-card text-ink rounded-bl-xs border border-hairline'
                          )}
                        >
                          {!mine && (
                            <div className="mb-0.5 text-[10px] font-bold text-primary">
                              {msg.senderName}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                          <div
                            className={clsx(
                              'mt-0.5 text-[9px] text-right',
                              mine ? 'text-white/70' : 'text-body'
                            )}
                          >
                            {formatMsgTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Gợi ý tin nhắn nhanh (Quick Chips) - Chỉ hiện khi đoạn chat trống, ẩn scrollbar, hỗ trợ kéo chuột và điền vào ô nhập */}
              {!loadingMessages && messages.length === 0 && (
                <div
                  ref={suggestionScroll.ref}
                  onMouseDown={suggestionScroll.onMouseDown}
                  onClickCapture={suggestionScroll.onClickCapture}
                  className="overflow-x-auto border-t border-hairline/60 bg-surface-card px-2.5 py-2 flex items-center gap-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none cursor-grab active:cursor-grabbing"
                >
                  <span className="text-[10px] font-semibold text-body shrink-0 pl-1">Gợi ý:</span>
                  {SUGGESTIONS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(chip);
                        inputRef.current?.focus();
                      }}
                      className="shrink-0 rounded-full border border-hairline bg-canvas-soft px-2.5 py-1 text-[11px] font-medium text-ink hover:border-primary hover:text-primary transition-all active:scale-95 shadow-xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Ô nhập tin nhắn */}
              <div className="border-t border-hairline bg-surface-card p-2.5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    maxLength={2000}
                    placeholder="Nhập tin nhắn..."
                    className="h-10 min-w-0 flex-1 rounded-xl border border-hairline bg-canvas-soft px-3 text-body-sm text-ink placeholder:text-body focus:border-primary focus:bg-surface-card focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    aria-label="Gửi tin nhắn"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-xs hover:bg-primary-active active:scale-95 disabled:bg-muted-soft disabled:text-canvas transition-all"
                  >
                    <Icon name={sending ? 'spinner' : 'send'} size={16} className={sending ? 'animate-spin' : ''} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            // ===== CHẾ ĐỘ 1: DANH SÁCH CUỘC TRÒ CHUYỆN =====
            <div className="flex flex-1 flex-col min-h-0 bg-surface-card">
              {error && (
                <div className="border-b border-error bg-[#fbeaea] p-2 text-caption text-error">
                  {error}
                </div>
              )}

              <ul className="min-h-0 flex-1 overflow-y-auto divide-y divide-hairline">
                {conversations.length === 0 ? (
                  <li className="p-6 text-center text-body-sm text-body">
                    <p className="font-medium text-ink">Chưa có cuộc trò chuyện nào</p>
                    <p className="mt-1 text-[11px]">Mở chat từ một đơn hàng để trao đổi trực tiếp với quán ăn.</p>
                  </li>
                ) : (
                  conversations.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setActiveChatId(item.id)}
                        className="flex w-full items-center gap-2.5 p-3 text-left hover:bg-canvas-soft transition-colors"
                      >
                        <Avatar
                          src={item.otherParticipant?.avatarUrl}
                          name={item.restaurantName || item.otherParticipant?.name}
                          size="md"
                          className="border border-hairline shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="truncate text-body-sm font-bold text-ink">
                              {item.restaurantName || item.otherParticipant?.name}
                            </div>
                            <span className="shrink-0 text-[10px] text-body">
                              {formatMsgTime(item.lastMessageAt || item.updatedAt)}
                            </span>
                          </div>
                          <div className="truncate text-[11px] text-body mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-primary">#{item.orderCode}</span>
                            <span>•</span>
                            <span className="truncate">{item.lastMessage || 'Bắt đầu cuộc trò chuyện...'}</span>
                          </div>
                        </div>
                        {item.unreadCount > 0 && (
                          <Badge tone="live" size="sm">
                            {item.unreadCount}
                          </Badge>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <button
                type="button"
                onClick={() => {
                  setChatOpen(false);
                  navigate('/chat/inbox');
                }}
                className="h-11 border-t border-hairline text-button text-primary font-semibold hover:bg-canvas-soft transition-colors"
              >
                Mở trang Hộp thư đầy đủ
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
