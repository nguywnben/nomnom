import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Icon from '../../components/Icon.jsx';
import { IconButton } from '../../components/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';

// ---------------------------------------------------------------------------
// Dedicated chat screen — real-time messaging UI.
//   • Header: avatar + name + role badge + online indicator
//   • Body: message history with day separators + grouped bubbles
//   • Footer: bottom-fixed composer with send icon button
//
// Tokens: rounded-md on inputs, rounded-lg on bubbles (12px), rounded-pill
// on badges, primary CTA pure black, Inter type, hairline borders.
// ---------------------------------------------------------------------------

const ROLE_META = {
  driver: { label: 'Tài xế của bạn', tone: 'success' },
  merchant: { label: 'Quán ăn', tone: 'default' },
  admin: { label: 'Hỗ trợ', tone: 'outline' },
};

const QUICK_REPLIES_BY_ROLE = {
  driver: ['Bạn đang ở đâu?', 'Mã cửa là 1234', 'Để ở cửa nhé, cảm ơn'],
  merchant: ['Tôi có thể đổi món không?', 'Không hành nhé', 'Thêm khăn giấy'],
  admin: ['Tôi cần hoàn tiền', 'Tài xế đi sai đường', 'Thiếu món hàng'],
};

export default function ChatScreen() {
  const { id } = useParams();
  const { chats, sendChat } = useApp();
  const chat = chats.find((c) => c.id === id) || chats[0];
  const [text, setText] = useState('');
  const scroller = useRef(null);
  const composerRef = useRef(null);

  useEffect(() => {
    if (!scroller.current) return;
    scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages?.length]);

  if (!chat) return null;

  const otherParticipant = chat.participants.find((p) => p.id !== 'me');
  const meta = ROLE_META[otherParticipant?.role] ?? ROLE_META.merchant;
  const replies = QUICK_REPLIES_BY_ROLE[otherParticipant?.role] ?? [];

  const onSend = (value) => {
    if (!value.trim()) return;
    sendChat(chat.id, value);
    setText('');
    composerRef.current?.focus();
  };

  // Build day-grouped message list
  const groups = groupByDay(chat.messages);

  return (
    // Strict h-screen + overflow-hidden so the page never bounces on iOS.
    // Header / body / footer are siblings with the body taking flex-1.
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      {/* HEADER */}
      <header className="shrink-0 border-b border-hairline bg-canvas/95 backdrop-blur">
        <div className="pt-safe" />
        <div className="container-page flex h-14 items-center gap-sm md:h-16">
          <Link
            to="/app"
            className="grid h-11 w-11 -ml-2 place-items-center rounded-md text-ink hover:bg-canvas-soft"
            aria-label="Quay lại"
          >
            <Icon name="chevronLeft" size={18} />
          </Link>
          <Avatar src={otherParticipant?.avatar} name={otherParticipant?.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-title-md text-ink truncate">{otherParticipant?.name}</span>
              <Badge tone={meta.tone} dot>
                {meta.label}
              </Badge>
            </div>
            <div className="text-caption text-body inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-pill bg-success pulse-dot" />
              Đang hoạt động · {chat.subtitle}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconButton icon="phone" label="Gọi" variant="secondary" />
            <IconButton icon="cog" label="Cài đặt" variant="secondary" />
          </div>
        </div>
      </header>

      {/* MESSAGES — scrollable body */}
      <main ref={scroller} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="container-page flex flex-col gap-base py-base">
          {groups.length === 0 && (
            <div className="grid place-items-center py-xxl text-center">
              <span className="grid h-12 w-12 place-items-center rounded-pill bg-surface-strong text-body">
                <Icon name="chat" size={18} />
              </span>
              <div className="mt-sm text-title-md text-ink">Gửi lời chào</div>
              <div className="text-body-sm text-body">Bắt đầu cuộc trò chuyện với trả lời nhanh bên dưới.</div>
            </div>
          )}
          {groups.map((g, gi) => (
            <Fragment key={gi}>
              <DaySeparator label={g.label} />
              <MessageGroup messages={g.messages} participants={chat.participants} />
            </Fragment>
          ))}
        </div>
      </main>

      {/* COMPOSER — fixed footer */}
      <footer className="shrink-0 border-t border-hairline bg-surface-card">
        <div className="container-page">
          {/* Quick replies */}
          {replies.length > 0 && (
            <div className="-mx-base flex items-center gap-1 overflow-x-auto px-base pt-sm scrollbar-hide">
              {replies.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSend(r)}
                  className="h-9 shrink-0 rounded-pill border border-hairline-strong bg-surface-card px-3 text-caption text-ink hover:bg-canvas-soft"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSend(text);
            }}
            className="flex items-center gap-xs py-sm"
          >
            <input
              ref={composerRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Nhắn tin cho ${otherParticipant?.name?.split(' ')[0] ?? ''}…`}
              // text-base = 16px → prevents iOS Safari from auto-zooming on focus
              className="h-12 flex-1 rounded-md border border-hairline-strong bg-surface-card px-base text-base text-ink placeholder:text-muted outline-none focus:border-ink focus:border-2"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary text-on-primary hover:bg-primary-active disabled:bg-muted-soft"
              aria-label="Gửi"
            >
              <Icon name="send" size={18} />
            </button>
          </form>
          <div className="pb-safe" />
        </div>
      </footer>
    </div>
  );
}

function MessageGroup({ messages, participants }) {
  return (
    <div className="flex flex-col gap-1.5">
      {messages.map((m, i) => {
        const mine = m.senderId === 'me';
        const sender = participants.find((p) => p.id === m.senderId);
        const prev = messages[i - 1];
        const isStartOfBurst = !prev || prev.senderId !== m.senderId;
        const isEndOfBurst = i === messages.length - 1 || messages[i + 1]?.senderId !== m.senderId;
        return (
          <div
            key={m.id}
            className={clsx('flex items-end gap-2', mine ? 'flex-row-reverse' : 'flex-row')}
          >
            {!mine && (
              <div className="w-8 shrink-0">
                {isEndOfBurst && <Avatar src={sender?.avatar} name={sender?.name} size="sm" />}
              </div>
            )}
            <div className="flex max-w-[75%] flex-col">
              {!mine && isStartOfBurst && (
                <span className="ml-2 mb-0.5 text-caption text-body">{sender?.name}</span>
              )}
              <div
                className={clsx(
                  'px-sm py-2 text-body-sm leading-snug',
                  mine
                    ? 'bg-primary text-on-primary'
                    : 'bg-canvas-soft border border-hairline-strong text-ink',
                  // Stack-aware corner rounding
                  bubbleRounding({ mine, isStartOfBurst, isEndOfBurst }),
                )}
              >
                {m.text}
              </div>
              {isEndOfBurst && (
                <span
                  className={clsx(
                    'mt-0.5 text-caption text-body',
                    mine ? 'text-right pr-1' : 'pl-2',
                  )}
                >
                  {formatTime(m.at)}
                  {mine && (
                    <Icon name="check" size={10} className="ml-1 inline text-success" />
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function bubbleRounding({ mine, isStartOfBurst, isEndOfBurst }) {
  if (mine) {
    if (isStartOfBurst && isEndOfBurst) return 'rounded-lg rounded-br-sm';
    if (isStartOfBurst) return 'rounded-lg rounded-br-sm';
    if (isEndOfBurst) return 'rounded-l-lg rounded-tr-lg rounded-br-sm';
    return 'rounded-l-lg rounded-r-sm';
  }
  if (isStartOfBurst && isEndOfBurst) return 'rounded-lg rounded-bl-sm';
  if (isStartOfBurst) return 'rounded-lg rounded-bl-sm';
  if (isEndOfBurst) return 'rounded-r-lg rounded-tl-lg rounded-bl-sm';
  return 'rounded-r-lg rounded-l-sm';
}

function DaySeparator({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-hairline" />
      <span className="text-caption-uppercase text-body">{label}</span>
      <div className="h-px flex-1 bg-hairline" />
    </div>
  );
}

function groupByDay(messages) {
  const buckets = new Map();
  for (const m of messages) {
    const d = new Date(m.at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!buckets.has(key)) buckets.set(key, { label: dayLabel(d), messages: [] });
    buckets.get(key).messages.push(m);
  }
  return Array.from(buckets.values());
}

function dayLabel(d) {
  const now = new Date();
  const oneDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / oneDay);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(at) {
  const d = new Date(at);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
