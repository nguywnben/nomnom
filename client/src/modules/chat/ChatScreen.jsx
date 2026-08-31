import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';
import TopNav from '../customer/TopNav.jsx';
import Footer from '../customer/Footer.jsx';
import {
  fetchChatConversationsApi,
  fetchChatMessagesApi,
  markChatReadApi,
  sendChatMessageApi,
} from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';

const ROLE_CONFIG = {
  customer: { label: 'Khách hàng', tone: 'outline' },
  merchant: { label: 'Quán ăn', tone: 'default' },
  admin: { label: 'Hỗ trợ NomNom', tone: 'live' },
};

const SUGGESTED_MESSAGES = [
  'Quán ơi món đã chuẩn bị xong chưa ạ?',
  'Cho mình xin thêm tương ớt và khăn giấy nhé!',
  'Giao giúp mình lên lầu với ạ.',
  'Cảm ơn quán nhiều nhé!',
];

export default function ChatScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, role, pushToast } = useApp();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(id === 'inbox' ? null : Number(id));
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scroller = useRef(null);
  const initialScrollDoneRef = useRef(false);

  // Load all conversations
  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const response = await fetchChatConversationsApi();
      const list = response.data || [];
      setConversations(list);
      setActiveId((current) => {
        if (current && list.some((item) => item.id === current)) return current;
        if (id && id !== 'inbox' && list.some((item) => item.id === Number(id))) return Number(id);
        return list[0]?.id || null;
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách trò chuyện.');
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [id]);

  // Load messages for the selected conversation
  const loadMessages = useCallback(async (conversationId, silent = false) => {
    if (!conversationId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const response = await fetchChatMessagesApi(conversationId);
      setActive(response.conversation);
      setMessages(response.data || []);
      await markChatReadApi(conversationId);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải tin nhắn.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(() => loadConversations(true), 5000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) {
      setActive(null);
      setMessages([]);
      return undefined;
    }
    initialScrollDoneRef.current = false;
    loadMessages(activeId);
    const timer = window.setInterval(() => loadMessages(activeId, true), 3000);
    return () => window.clearInterval(timer);
  }, [activeId, loadMessages]);

  useLayoutEffect(() => {
    if (!scroller.current || !messages.length) return;

    if (!initialScrollDoneRef.current) {
      // Lần đầu tải tin nhắn: Nhảy ngay xuống đáy tức thì không có độ trễ/trượt từ trên xuống
      scroller.current.scrollTop = scroller.current.scrollHeight;
      initialScrollDoneRef.current = true;
    } else {
      // Khi có tin nhắn mới gửi hoặc nhận thêm: Cuộn êm
      scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  const send = async (event) => {
    if (event) event.preventDefault();
    const body = text.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    try {
      const response = await sendChatMessageApi(activeId, body);
      setMessages((current) => [...current, response.message]);
      setText('');
      await loadConversations(true);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể gửi tin nhắn', message: err.message || 'Vui lòng thử lại.' });
    } finally {
      setSending(false);
    }
  };

  const handleSendQuickMessage = (msg) => {
    setText(msg);
  };

  // Group conversations by partner / restaurant so one restaurant doesn't create duplicate entries
  const groupedConversations = useMemo(() => {
    const groups = new Map();

    for (const conv of conversations) {
      // Group by restaurantId if present, otherwise by other participant user id
      const key = conv.restaurantId
        ? `rest_${conv.restaurantId}`
        : `user_${conv.otherParticipant?.id || conv.id}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          restaurantId: conv.restaurantId,
          restaurantName: conv.restaurantName,
          otherParticipant: conv.otherParticipant,
          conversations: [],
          totalUnread: 0,
          latestMessage: conv.lastMessage,
          latestAt: conv.lastMessageAt,
        });
      }

      const grp = groups.get(key);
      grp.conversations.push(conv);
      grp.totalUnread += conv.unreadCount || 0;

      if (!grp.latestAt || new Date(conv.lastMessageAt) > new Date(grp.latestAt)) {
        grp.latestAt = conv.lastMessageAt;
        grp.latestMessage = conv.lastMessage;
      }
    }

    let list = Array.from(groups.values()).sort(
      (a, b) => new Date(b.latestAt || 0) - new Date(a.latestAt || 0)
    );

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.restaurantName?.toLowerCase().includes(q) ||
          g.otherParticipant?.name?.toLowerCase().includes(q) ||
          g.conversations.some((c) => c.orderCode?.toLowerCase().includes(q))
      );
    }

    return list;
  }, [conversations, searchQuery]);

  // Find the currently active group
  const activeGroup = useMemo(() => {
    if (!activeId) return null;
    return groupedConversations.find((g) => g.conversations.some((c) => c.id === activeId)) || null;
  }, [groupedConversations, activeId]);

  const other = active?.otherParticipant;
  const meta = ROLE_CONFIG[other?.role] || ROLE_CONFIG.customer;
  const backTo = role === 'merchant' ? '/merchant' : role === 'admin' ? '/admin' : '/app';

  // Format message time
  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Format list item time
  const formatListTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* Top Header Navigation */}
      {role === 'customer' ? (
        <TopNav />
      ) : (
        <header className="sticky top-0 z-30 border-b border-hairline bg-surface-card/90 backdrop-blur-md">
          <div className="container-page flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to={backTo} className="flex items-center gap-2">
                <Logo />
              </Link>
              <span className="text-hairline-strong">/</span>
              <span className="text-body-sm font-semibold text-ink">
                {role === 'merchant' ? 'Cổng Quán Ăn' : 'Cổng Quản Trị'}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon="chevronLeft"
              onClick={() => nav(backTo)}
            >
              {role === 'merchant' ? 'Về Bảng Điều Khiển' : 'Về Trang Quản Trị'}
            </Button>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="flex-1 container-page mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb / Section Title */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon name="chat" size={18} />
            </div>
            <h1 className="text-title-md font-bold text-ink">Hộp thư & Trò chuyện</h1>
          </div>
          <p className="mt-0.5 text-caption text-body">
            Trao đổi trực tiếp với quán ăn và khách hàng theo từng đơn hàng cụ thể
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-error/30 bg-error/10 p-3 text-body-sm text-error" role="alert">
            {error}
          </div>
        )}

        {/* 2-Column Chat Shell Card */}
        <div className="rounded-2xl border border-hairline bg-surface-card shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] max-h-[calc(100vh-200px)] min-h-[500px]">
          {/* Left Sidebar: Inbox Conversations List */}
          <aside className="w-full md:w-80 lg:w-96 shrink-0 border-b md:border-b-0 md:border-r border-hairline flex flex-col bg-surface-card">
            {/* Search header */}
            <div className="p-3 border-b border-hairline bg-canvas-subtle/40">
              <div className="relative h-9">
                <Icon name="search" size={16} className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body" />
                <input
                  type="text"
                  placeholder="Tìm quán, khách hoặc mã đơn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-8 text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-body hover:text-ink"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-hairline">
              {loadingList && !conversations.length ? (
                <div className="p-8 text-center text-body-sm text-body" role="status">
                  <Icon name="spinner" size={20} className="mx-auto mb-2 animate-spin text-primary" />
                  Đang tải hộp thư...
                </div>
              ) : !groupedConversations.length ? (
                <div className="p-8 text-center text-body-sm text-body">
                  <Icon name="chat" size={28} className="mx-auto mb-2 text-hairline-strong" />
                  {searchQuery ? 'Không tìm thấy cuộc trò chuyện phù hợp.' : 'Chưa có cuộc trò chuyện nào.'}
                </div>
              ) : (
                groupedConversations.map((group) => {
                  const isGroupActive = activeGroup?.key === group.key;
                  const displayName = group.restaurantName || group.otherParticipant?.name || 'Trò chuyện';
                  const orderCount = group.conversations.length;
                  const firstConv = group.conversations[0];

                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => {
                        // If selecting a new group, pick its primary conversation
                        if (!group.conversations.some((c) => c.id === activeId)) {
                          setActiveId(firstConv.id);
                        }
                      }}
                      className={clsx(
                        'w-full p-3.5 text-left transition-colors flex items-start gap-3 hover:bg-canvas-subtle/60',
                        isGroupActive ? 'bg-primary/5 border-l-4 border-primary pl-2.5' : 'bg-surface-card'
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar
                          src={group.otherParticipant?.avatarUrl}
                          name={displayName}
                          size="md"
                          className="border border-hairline shadow-xs"
                        />
                        {group.totalUnread > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white shadow-xs">
                            {group.totalUnread}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="truncate text-body-sm font-bold text-ink">
                            {displayName}
                          </div>
                          {group.latestAt && (
                            <span className="shrink-0 text-[11px] text-body">
                              {formatListTime(group.latestAt)}
                            </span>
                          )}
                        </div>

                        {/* Order tag and snippet */}
                        <div className="flex items-center gap-1.5 text-caption text-body mb-1">
                          <span className="inline-flex items-center gap-1 rounded bg-canvas-soft px-1.5 py-0.5 text-[11px] font-medium text-ink">
                            <Icon name="package" size={11} className="text-body" />
                            {orderCount > 1 ? `${orderCount} đơn hàng` : `#${firstConv.orderCode}`}
                          </span>
                          <span className="text-hairline-strong">•</span>
                          <span className="text-[11px] text-body">
                            {group.otherParticipant?.role === 'merchant'
                              ? 'Quán ăn'
                              : group.otherParticipant?.role === 'admin'
                                ? 'Hỗ trợ'
                                : 'Khách'}
                          </span>
                        </div>

                        <p className={clsx(
                          'truncate text-caption',
                          group.totalUnread > 0 ? 'font-semibold text-ink' : 'text-body'
                        )}>
                          {group.latestMessage || 'Bắt đầu cuộc trò chuyện...'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Main Chat Window */}
          <section className="flex min-w-0 flex-1 flex-col bg-canvas-subtle/20">
            {!active ? (
              <div className="grid flex-1 place-items-center p-8">
                <EmptyState
                  icon="chat"
                  title={conversations.length ? 'Chọn một cuộc trò chuyện' : 'Chưa có tin nhắn nào'}
                  message="Chọn một cuộc trò chuyện từ danh sách bên trái hoặc mở chat từ trang theo dõi đơn hàng để trao đổi trực tiếp."
                />
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="shrink-0 border-b border-hairline bg-surface-card px-4 py-3 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={other?.avatarUrl}
                        name={active.restaurantName || other?.name}
                        size="md"
                        className="border border-hairline"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-body-base font-bold text-ink">
                            {active.restaurantName || other?.name}
                          </h2>
                          <Badge tone={meta.tone} size="sm">
                            {meta.label}
                          </Badge>
                        </div>
                        <div className="truncate text-caption text-body flex items-center gap-1.5">
                          <span>Đang trao đổi về đơn:</span>
                          <span className="font-semibold text-ink">#{active.orderCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* View order link button */}
                    <div className="flex items-center gap-2">
                      {role === 'customer' && active.orderId && (
                        <Button
                          variant="secondary"
                          size="sm"
                          leadingIcon="arrowRight"
                          onClick={() => nav(`/app/track/${active.orderId}`)}
                          className="hidden sm:inline-flex text-caption"
                        >
                          Xem đơn hàng
                        </Button>
                      )}
                      {role === 'merchant' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          leadingIcon="package"
                          onClick={() => nav('/merchant/orders')}
                          className="hidden sm:inline-flex text-caption"
                        >
                          Quản lý đơn
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Multi-order switcher if this partner has multiple conversations */}
                  {activeGroup && activeGroup.conversations.length > 1 && (
                    <div className="mt-2.5 flex items-center gap-2 overflow-x-auto border-t border-hairline pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <span className="text-[11px] font-medium text-body shrink-0">Chuyển đơn ({activeGroup.conversations.length}):</span>
                      {activeGroup.conversations.map((c) => {
                        const isCurrent = activeId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setActiveId(c.id)}
                            className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold transition-all shrink-0',
                              isCurrent
                                ? 'bg-ink text-white shadow-xs'
                                : 'bg-surface-card border border-hairline text-body hover:text-ink hover:bg-canvas-soft'
                            )}
                          >
                            <Icon name="package" size={12} />
                            #{c.orderCode}
                            {c.orderStatus && (
                              <span className={clsx('text-[10px] font-normal opacity-80', isCurrent ? 'text-white/80' : 'text-body')}>
                                · {c.orderStatus === 'delivering' ? 'Đang giao' : c.orderStatus === 'preparing' ? 'Đang nấu' : c.orderStatus === 'delivered' ? 'Đã giao' : c.orderStatus === 'cancelled' ? 'Đã hủy' : 'Đã đặt'}
                              </span>
                            )}
                            {c.unreadCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-error" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Messages Body */}
                <main ref={scroller} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Order Context Banner */}
                  <div className="mx-auto max-w-xl rounded-xl border border-hairline bg-surface-card p-3 shadow-xs text-center">
                    <div className="inline-flex items-center gap-1.5 text-caption font-semibold text-ink">
                      <Icon name="package" size={14} className="text-primary" />
                      Cuộc trò chuyện cho Đơn hàng #{active.orderCode}
                    </div>
                    <p className="mt-0.5 text-[11px] text-body">
                      {active.restaurantName ? `Quán: ${active.restaurantName}` : 'Hỗ trợ khách hàng'} · Mọi tin nhắn được lưu trữ an toàn cùng ngữ cảnh đơn hàng.
                    </p>
                  </div>

                  {loadingMessages && !messages.length ? (
                    <div className="py-12 text-center text-body-sm text-body" role="status">
                      <Icon name="spinner" size={20} className="mx-auto mb-2 animate-spin text-primary" />
                      Đang tải tin nhắn...
                    </div>
                  ) : !messages.length ? (
                    <div className="py-8 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary mb-2">
                        <Icon name="chat" size={22} />
                      </div>
                      <h3 className="text-body-sm font-semibold text-ink">Bắt đầu cuộc trò chuyện</h3>
                      <p className="text-caption text-body max-w-xs mx-auto mt-1">
                        Gửi lời chào hoặc yêu cầu hỗ trợ về món ăn cho {other?.name || 'đối tác'}.
                      </p>

                      {/* Suggestion quick chips */}
                      <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                        {SUGGESTED_MESSAGES.map((msg, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendQuickMessage(msg)}
                            className="rounded-full border border-hairline bg-surface-card px-3 py-1.5 text-caption text-ink shadow-xs hover:border-primary hover:bg-primary/5 transition-all text-left"
                          >
                            💬 {msg}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mx-auto flex max-w-3xl flex-col gap-3">
                      {messages.map((message) => {
                        const mine = Number(message.senderUserId) === Number(user?.id);
                        return (
                          <div
                            key={message.id}
                            className={clsx('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}
                          >
                            {!mine && (
                              <Avatar
                                src={message.senderAvatarUrl || other?.avatarUrl}
                                name={message.senderName}
                                size="sm"
                                className="mb-1 shrink-0 border border-hairline shadow-xs"
                              />
                            )}

                            <div
                              className={clsx(
                                'max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs transition-all',
                                mine
                                  ? 'bg-ink text-white rounded-br-xs'
                                  : 'bg-surface-card border border-hairline text-ink rounded-bl-xs'
                              )}
                            >
                              {!mine && (
                                <div className="mb-1 text-[11px] font-bold text-primary">
                                  {message.senderName}
                                </div>
                              )}
                              <div className="whitespace-pre-wrap break-words text-body-sm leading-relaxed">
                                {message.text}
                              </div>
                              <div
                                className={clsx(
                                  'mt-1 text-[10px] text-right',
                                  mine ? 'text-white/70' : 'text-body'
                                )}
                              >
                                {formatMsgTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </main>

                {/* Input Bar */}
                <div className="shrink-0 border-t border-hairline bg-surface-card p-3 sm:p-4">
                  <form onSubmit={send} className="mx-auto flex max-w-3xl items-center gap-2">
                    <input
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      maxLength={2000}
                      placeholder={`Nhắn tin cho ${active.restaurantName || other?.name || 'đối tác'}...`}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-hairline-strong bg-canvas-subtle/50 px-4 text-body-sm text-ink placeholder:text-body focus:border-primary focus:bg-surface-card focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!text.trim() || sending}
                      aria-label="Gửi tin nhắn"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-xs transition-all hover:bg-primary-active active:scale-95 disabled:cursor-not-allowed disabled:bg-muted-soft disabled:text-canvas"
                    >
                      <Icon name={sending ? 'spinner' : 'send'} size={18} className={sending ? 'animate-spin' : ''} />
                    </button>
                  </form>
                  <div className="mt-1 text-center text-[11px] text-body hidden sm:block">
                    Nhấn <kbd className="rounded bg-canvas-soft px-1 border border-hairline text-ink">Enter</kbd> để gửi tin nhắn
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      {role === 'customer' && <Footer />}
    </div>
  );
}
