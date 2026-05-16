import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Icon from '../../components/Icon.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Floating chat widget — opens to a 360px panel with channels list + thread.
// Mirrors a Socket.IO-style room — but everything is local + simulated.
export default function ChatWidget() {
  const {
    chats,
    sendChat,
    chatOpen,
    setChatOpen,
    activeChatId,
    setActiveChatId,
  } = useApp();
  const active = chats.find((c) => c.id === activeChatId);
  const [text, setText] = useState('');
  const scroller = useRef(null);

  useEffect(() => {
    if (!chatOpen || !scroller.current) return;
    scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [active?.messages?.length, chatOpen]);

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={clsx(
          'fixed z-30 inline-flex items-center rounded-pill bg-primary text-on-primary shadow-soft-md transition-transform hover:bg-primary-active hover:scale-[1.02]',
          // Trên mobile: đặt cao hơn thanh nav (h-16) + safe-area để không che nội dung (vd. Hồ sơ)
          'bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3 h-10 gap-1.5 px-3 text-caption md:bottom-6 md:right-6 md:h-12 md:gap-2 md:px-4 md:text-button',
        )}
        aria-label="Mở chat"
      >
        <Icon name="chat" size={14} className="md:hidden" />
        <Icon name="chat" size={16} className="hidden md:block" />
        <span className="hidden md:inline">Chat</span>
        <span
          className={clsx(
            'grid h-5 min-w-5 place-items-center rounded-pill bg-on-primary px-1 text-caption text-ink nums',
            'max-md:h-4 max-md:min-w-4 max-md:text-[10px]',
          )}
        >
          {chats.reduce((s, c) => s + c.messages.length, 0)}
        </span>
      </button>

      {chatOpen && (
        <div
          className={clsx(
            'fixed z-30 flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card shadow-soft-lg fade-in',
            'bottom-[calc(5rem+3.25rem+env(safe-area-inset-bottom,0px))] right-3 h-[min(520px,calc(100dvh-9rem))] w-[min(420px,calc(100vw-1.5rem))]',
            'md:bottom-20 md:right-6 md:h-[560px] md:w-[420px] md:max-w-[92vw]',
          )}
        >
          <header className="flex items-center gap-sm border-b border-hairline px-base py-sm">
            <Icon name="chat" size={16} />
            <div className="flex-1 min-w-0">
              <div className="text-title-sm text-ink">Cuộc trò chuyện</div>
              <div className="text-caption text-body">Mô phỏng phòng Socket.IO</div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded-md p-1 text-body hover:bg-canvas-soft hover:text-ink"
              aria-label="Đóng"
            >
              <Icon name="close" size={16} />
            </button>
          </header>

          <div className="flex flex-1 min-h-0">
            {/* List */}
            <ul className="w-[140px] shrink-0 overflow-y-auto border-r border-hairline">
              {chats.map((c) => {
                const other = c.participants.find((p) => p.id !== 'me');
                const last = c.messages[c.messages.length - 1];
                const sel = c.id === activeChatId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveChatId(c.id)}
                      className={clsx(
                        'flex w-full items-center gap-2 px-sm py-2 text-left transition-colors',
                        sel ? 'bg-canvas-soft' : 'hover:bg-canvas-soft',
                      )}
                    >
                      <Avatar src={other?.avatar} name={other?.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-caption font-semibold text-ink truncate">{c.title}</div>
                        <div className="text-caption text-body truncate">{last?.text}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Active thread */}
            {active && (
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="border-b border-hairline px-base py-sm">
                  <div className="text-title-sm text-ink">{active.title}</div>
                  <div className="flex items-center gap-2">
                    <Badge tone="live" dot>Trực tuyến</Badge>
                    <span className="text-caption text-body">{active.subtitle}</span>
                  </div>
                </div>

                <div ref={scroller} className="flex-1 overflow-y-auto px-sm py-sm">
                  <MessageList messages={active.messages} participants={active.participants} />
                </div>

                <Composer
                  onSend={(t) => {
                    sendChat(active.id, t);
                    setText('');
                  }}
                  value={text}
                  onChange={setText}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function MessageList({ messages, participants }) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => {
        const mine = m.senderId === 'me';
        const sender = participants.find((p) => p.id === m.senderId);
        return (
          <div
            key={m.id}
            className={clsx('flex items-end gap-2', mine ? 'flex-row-reverse' : '')}
          >
            <Avatar src={sender?.avatar} name={sender?.name} size="xs" />
            <div
              className={clsx(
                'max-w-[70%] rounded-lg px-sm py-2 text-body-sm leading-snug',
                mine
                  ? 'bg-primary text-on-primary rounded-br-sm'
                  : 'bg-canvas-soft border border-hairline-strong text-ink rounded-bl-sm',
              )}
            >
              {m.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Composer({ value, onChange, onSend }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSend(value);
      }}
      className="flex items-center gap-xs border-t border-hairline px-sm py-sm"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập tin nhắn…"
        className="h-10 flex-1 rounded-md border border-hairline-strong bg-surface-card px-sm text-body-sm text-ink placeholder:text-muted outline-none focus:border-ink focus:border-2"
      />
      <button
        type="submit"
        className="grid h-10 w-10 place-items-center rounded-md bg-primary text-on-primary hover:bg-primary-active disabled:bg-muted-soft"
        disabled={!value.trim()}
        aria-label="Gửi"
      >
        <Icon name="send" size={16} />
      </button>
    </form>
  );
}
