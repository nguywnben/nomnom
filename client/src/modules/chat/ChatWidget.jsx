import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Icon from '../../components/Icon.jsx';
import { fetchChatConversationsApi } from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';

export default function ChatWidget() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchChatConversationsApi();
      setConversations(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải trò chuyện.');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [load, user]);

  if (!user) return null;
  const unread = conversations.reduce((total, item) => total + item.unreadCount, 0);

  const openConversation = (id) => {
    setOpen(false);
    navigate('/chat/' + id);
  };

  return <>
    <button
      type="button"
      onClick={() => setOpen((current) => !current)}
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3 z-30 inline-flex h-11 items-center gap-2 rounded-pill bg-primary px-3 text-button text-on-primary shadow-soft-md md:bottom-6 md:right-6"
      aria-label="Mở trò chuyện"
      aria-expanded={open}
    >
      <Icon name="chat" size={16} />
      <span className="hidden md:inline">Trò chuyện</span>
      {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-on-primary px-1 text-caption text-ink nums">{unread}</span>}
    </button>

    {open && (
      <section className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] right-3 z-30 flex max-h-[min(520px,70dvh)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card shadow-soft-lg md:bottom-20 md:right-6" aria-label="Danh sách trò chuyện">
        <header className="flex items-center gap-sm border-b border-hairline px-base py-sm">
          <Icon name="chat" size={16} />
          <div className="min-w-0 flex-1">
            <div className="text-title-sm text-ink">Trò chuyện theo đơn</div>
            <div className="text-caption text-body">{unread ? unread + ' tin chưa đọc' : 'Không có tin chưa đọc'}</div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-canvas-soft" aria-label="Đóng"><Icon name="close" size={16} /></button>
        </header>

        {error && <div className="border-b border-error bg-[#fbeaea] p-sm text-caption text-error">{error}</div>}
        <ul className="min-h-0 flex-1 overflow-y-auto divide-y divide-hairline">
          {!conversations.length && <li className="p-base text-center text-body-sm text-body">Mở chat từ một đơn hàng để bắt đầu.</li>}
          {conversations.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => openConversation(item.id)} className="flex w-full items-center gap-sm p-base text-left hover:bg-canvas-soft">
                <Avatar src={item.otherParticipant.avatarUrl} name={item.otherParticipant.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-sm font-semibold text-ink">{item.otherParticipant.name}</div>
                  <div className="truncate text-caption text-body">{item.orderCode} · {item.lastMessage || 'Chưa có tin nhắn'}</div>
                </div>
                {item.unreadCount > 0 && <Badge tone="live">{item.unreadCount}</Badge>}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => openConversation('inbox')} className={clsx('h-11 border-t border-hairline text-button text-text-link hover:bg-canvas-soft')}>Mở hộp thư</button>
      </section>
    )}
  </>;
}
