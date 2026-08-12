import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import {
  fetchChatConversationsApi,
  fetchChatMessagesApi,
  markChatReadApi,
  sendChatMessageApi,
} from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';

const ROLE = {
  customer: { label: 'Khách hàng', tone: 'outline' },
  merchant: { label: 'Quán ăn', tone: 'default' },
  admin: { label: 'Hỗ trợ', tone: 'live' },
};

export default function ChatScreen() {
  const { id } = useParams();
  const { user, role, pushToast } = useApp();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(id === 'inbox' ? null : Number(id));
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scroller = useRef(null);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const response = await fetchChatConversationsApi();
      setConversations(response.data);
      setActiveId((current) => {
        if (current && response.data.some((item) => item.id === current)) return current;
        return response.data[0]?.id || null;
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách trò chuyện.');
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    if (!conversationId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const response = await fetchChatMessagesApi(conversationId);
      setActive(response.conversation);
      setMessages(response.data);
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
    loadMessages(activeId);
    const timer = window.setInterval(() => loadMessages(activeId, true), 3000);
    return () => window.clearInterval(timer);
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async (event) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || !activeId) return;
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

  const backTo = role === 'merchant' ? '/merchant' : role === 'admin' ? '/admin' : '/app';
  const other = active?.otherParticipant;
  const meta = ROLE[other?.role] || ROLE.customer;

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-canvas">
      <header className="shrink-0 border-b border-hairline bg-canvas">
        <div className="container-page flex h-16 items-center gap-sm">
          <Link to={backTo} className="grid h-11 w-11 -ml-2 place-items-center rounded-md text-ink hover:bg-canvas-soft" aria-label="Quay lại">
            <Icon name="chevronLeft" size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-title-md text-ink">Trò chuyện theo đơn hàng</div>
            <div className="text-caption text-body">Mỗi cuộc trò chuyện chỉ dành cho các bên liên quan.</div>
          </div>
        </div>
      </header>

      {error && <div className="shrink-0 border-b border-error bg-[#fbeaea] px-base py-sm text-body-sm text-error" role="alert">{error}</div>}

      <div className="flex min-h-0 flex-1">
        <aside className="w-[112px] shrink-0 overflow-y-auto border-r border-hairline bg-surface-card sm:w-72">
          <div className="hidden border-b border-hairline px-base py-sm text-title-sm text-ink sm:block">Hộp thư</div>
          {loadingList && !conversations.length && <div className="p-sm text-caption text-body" role="status">Đang tải...</div>}
          <ul className="divide-y divide-hairline">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={clsx('w-full p-sm text-left hover:bg-canvas-soft sm:p-base', activeId === conversation.id && 'bg-canvas-soft')}
                >
                  <div className="flex items-start gap-2">
                    <Avatar src={conversation.otherParticipant.avatarUrl} name={conversation.otherParticipant.name} size="sm" />
                    <div className="hidden min-w-0 flex-1 sm:block">
                      <div className="truncate text-body-sm font-semibold text-ink">{conversation.otherParticipant.name}</div>
                      <div className="truncate text-caption text-body">{conversation.orderCode} · {conversation.restaurantName}</div>
                      <div className="truncate text-caption text-body">{conversation.lastMessage || 'Chưa có tin nhắn'}</div>
                    </div>
                    {conversation.unreadCount > 0 && <Badge tone="live">{conversation.unreadCount}</Badge>}
                  </div>
                  <div className="mt-1 truncate text-[10px] text-body sm:hidden">{conversation.orderCode}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {!active ? (
            <div className="grid flex-1 place-items-center p-base">
              <EmptyState icon="chat" title={conversations.length ? 'Chọn một cuộc trò chuyện' : 'Chưa có cuộc trò chuyện'} message="Mở chat từ một đơn hàng để liên hệ quán hoặc bộ phận hỗ trợ." />
            </div>
          ) : <>
            <div className="flex shrink-0 items-center gap-sm border-b border-hairline px-base py-sm">
              <Avatar src={other?.avatarUrl} name={other?.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-title-sm text-ink">{other?.name}</div>
                <div className="truncate text-caption text-body">{active.orderCode} · {active.restaurantName}</div>
              </div>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>

            <main ref={scroller} className="flex-1 overflow-y-auto p-base">
              {loadingMessages && !messages.length ? (
                <div className="py-section text-center text-body-sm text-body" role="status">Đang tải tin nhắn...</div>
              ) : !messages.length ? (
                <EmptyState icon="chat" title="Bắt đầu cuộc trò chuyện" message="Tin nhắn sẽ được lưu cùng ngữ cảnh đơn hàng này." />
              ) : (
                <div className="mx-auto flex max-w-3xl flex-col gap-sm">
                  {messages.map((message) => {
                    const mine = Number(message.senderUserId) === Number(user?.id);
                    return <div key={message.id} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={clsx('max-w-[80%] rounded-lg px-sm py-2', mine ? 'bg-primary text-on-primary rounded-br-sm' : 'border border-hairline-strong bg-canvas-soft text-ink rounded-bl-sm')}>
                        {!mine && <div className="mb-1 text-caption font-semibold">{message.senderName}</div>}
                        <div className="whitespace-pre-wrap break-words text-body-sm">{message.text}</div>
                        <div className={clsx('mt-1 text-[10px]', mine ? 'text-on-dark-soft' : 'text-body')}>{new Date(message.createdAt).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>;
                  })}
                </div>
              )}
            </main>

            <form onSubmit={send} className="flex shrink-0 items-center gap-xs border-t border-hairline bg-surface-card p-sm">
              <input value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} placeholder={'Nhắn tin cho ' + (other?.name || '') + '...'} className="h-12 min-w-0 flex-1 rounded-md border border-hairline-strong bg-surface-card px-base text-base text-ink outline-none" />
              <button type="submit" disabled={!text.trim() || sending} className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary text-on-primary disabled:bg-muted-soft" aria-label="Gửi">
                <Icon name={sending ? 'spinner' : 'send'} size={18} className={sending ? 'animate-spin' : ''} />
              </button>
            </form>
          </>}
        </section>
      </div>
    </div>
  );
}
