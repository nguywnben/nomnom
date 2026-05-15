import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Image from '../../components/Image.jsx';
import MockMap from '../../components/MockMap.jsx';
import SwipeToConfirm from '../../components/SwipeToConfirm.jsx';
import { useApp } from '../../context/AppContext.jsx';

// ---------------------------------------------------------------------------
// Active Delivery — native driver-app pattern.
//   • Mock map takes ~70% of the frame (h-[70%])
//   • Floating bottom sheet (rounded-xl, shadow-soft-lg) holds the
//     current task + a big "Swipe to …" primary button.
//   • Top-left back arrow + top-right chat/call action overlay the map.
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 'to-merchant', label: 'Đang đến nhà hàng', cta: 'Vuốt — đã đến nhà hàng', icon: 'store' },
  { id: 'at-merchant', label: 'Đang lấy đơn hàng', cta: 'Vuốt — đã lấy đơn', icon: 'package' },
  { id: 'to-customer', label: 'Đang giao cho khách hàng', cta: 'Vuốt — đã đến nơi khách hàng', icon: 'bike' },
  { id: 'delivered', label: 'Đã giao', cta: 'Hoàn tất', icon: 'check' },
];

export default function ActiveDelivery() {
  const nav = useNavigate();
  const { activeDriverJob, advanceDriverStep, setChatOpen, setActiveChatId, pushToast } = useApp();
  const [proofFile, setProofFile] = useState(null);
  const [swipeKey, setSwipeKey] = useState(0);
  const fileRef = useRef(null);

  if (!activeDriverJob) {
    return (
      <div className="p-base">
        <EmptyState
          icon="package"
          title="Không có công việc nào"
          message="Nhận một công việc từ danh sách để bắt đầu giao."
          action={<Button onClick={() => nav('/driver/jobs')}>Tìm công việc</Button>}
        />
      </div>
    );
  }

  const stepIdx = Math.max(STEPS.findIndex((s) => s.id === activeDriverJob.step), 0);
  const isLastBeforeDone = stepIdx === STEPS.length - 2; // to-customer
  const progress = Math.min(1, (stepIdx + 1) / STEPS.length);

  const stops = [
    { id: 'd', kind: 'driver', x: 15 + progress * 35, y: 78 - progress * 30, label: 'Bạn' },
    {
      id: 'm',
      kind: 'merchant',
      x: 50,
      y: 50,
      label: activeDriverJob.restaurantName.split(' ')[0],
    },
    { id: 'c', kind: 'customer', x: 85, y: 22, label: 'Điểm giao' },
  ];

  const advance = () => {
    if (isLastBeforeDone && !proofFile) {
      pushToast({
        kind: 'error',
        title: 'Cần có bằng chứng giao hàng',
        message: 'Chụp một bức ảnh nhanh trước khi hoàn tất giao hàng.',
      });
      setSwipeKey((k) => k + 1);
      return;
    }
    advanceDriverStep(proofFile);
    setSwipeKey((k) => k + 1);
    setProofFile(null);
  };

  // Resolve "who is the next stop" + ETA copy for the bottom sheet
  const isPickup = stepIdx < 2;
  const stopLabel = isPickup ? 'Điểm lấy hàng' : 'Điểm giao hàng';
  const stopAddress = isPickup ? activeDriverJob.pickupAddress : activeDriverJob.dropoffAddress;
  const stopName = isPickup ? activeDriverJob.restaurantName : activeDriverJob.customerName;

  return (
    <div className="relative flex h-full flex-col">
      {/* MAP — 70% height */}
      <div className="relative h-[62%] shrink-0">
        <MockMap stops={stops} progress={progress} className="!aspect-auto h-full" />

        {/* Map chrome */}
        <button
          onClick={() => nav('/driver')}
          className="absolute left-base top-base grid h-10 w-10 place-items-center rounded-md border border-hairline-strong bg-surface-card text-ink shadow-soft"
          aria-label="Về trang chủ"
        >
          <Icon name="chevronLeft" size={18} />
        </button>

        <div className="absolute right-base top-base flex flex-col gap-2">
          <button
            onClick={() => pushToast({ kind: 'info', title: 'Đang gọi khách hàng…' })}
            className="grid h-10 w-10 place-items-center rounded-md border border-hairline-strong bg-surface-card text-ink shadow-soft"
            aria-label="Gọi khách hàng"
          >
            <Icon name="phone" size={18} />
          </button>
          <button
            onClick={() => {
              setActiveChatId(isPickup ? 'chat-merchant' : 'chat-driver');
              setChatOpen(true);
            }}
            className="grid h-10 w-10 place-items-center rounded-md border border-hairline-strong bg-surface-card text-ink shadow-soft"
            aria-label="Nhắn tin"
          >
            <Icon name="chat" size={18} />
          </button>
        </div>

        {/* Step pill — bottom-center of map area, overlaps the sheet */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center">
          <Badge tone="dark" className="!bg-primary !text-on-primary">
            Bước {stepIdx + 1}/{STEPS.length} · {STEPS[stepIdx].label}
          </Badge>
        </div>
      </div>

      {/* BOTTOM SHEET — ~38% height with overflow scroll */}
      <div className="relative -mt-3 flex flex-1 min-h-0 flex-col rounded-t-xl border-t border-hairline-strong bg-surface-card shadow-soft-lg">
        {/* Grab handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-pill bg-hairline-strong" />
        </div>

        <div className="flex flex-1 min-h-0 flex-col gap-sm overflow-y-auto px-base pb-3 pt-2">
          {/* Stop card */}
          <div className="flex items-start gap-sm rounded-md border border-hairline bg-canvas-soft p-sm">
            <Image
              src={isPickup ? activeDriverJob.restaurantAvatar : undefined}
              alt={stopName}
              className="h-12 w-12 rounded-md"
              ratio="1"
              fallbackSeed={stopName}
            />
            <div className="min-w-0 flex-1">
              <div className="text-caption-uppercase text-body">{stopLabel}</div>
              <div className="text-body-sm font-semibold text-ink truncate">{stopName}</div>
              <div className="text-caption text-body truncate">{stopAddress}</div>
            </div>
            <div className="text-right">
              <div className="text-caption-uppercase text-body">Thu nhập</div>
              <div className="nums text-title-sm text-ink">+${activeDriverJob.earnings.toFixed(2)}</div>
            </div>
          </div>

          {/* Proof of delivery — only when delivering to customer */}
          {isLastBeforeDone && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-caption-uppercase text-body">Bằng chứng giao hàng</span>
                <Badge tone="warning">Bắt buộc</Badge>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setProofFile(URL.createObjectURL(f));
                }}
              />
              {proofFile ? (
                <div className="relative overflow-hidden rounded-md border border-hairline-strong">
                  <img src={proofFile} alt="Proof" className="h-24 w-full object-cover" />
                  <button
                    onClick={() => setProofFile(null)}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-pill bg-canvas/90 text-ink"
                    aria-label="Xóa ảnh"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-hairline-strong bg-canvas-soft py-2 text-body-sm text-body hover:bg-canvas"
                >
                  <Icon name="camera" size={14} />
                  Chụp ảnh
                </button>
              )}
            </div>
          )}

          {/* Swipe — the action */}
          <SwipeToConfirm
            key={swipeKey}
            label={STEPS[stepIdx].cta}
            doneLabel="Đã xác nhận"
            icon={STEPS[stepIdx].icon}
            onConfirm={advance}
            disabled={stepIdx >= STEPS.length - 1}
          />
        </div>
      </div>
    </div>
  );
}
