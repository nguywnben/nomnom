import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Icon from './Icon.jsx';

// "Swipe to deliver" pill — drag-the-thumb confirmation pattern used by
// every food-delivery driver app. Crosses 70% of the track to fire onConfirm.
//
// Tokens:
//   • Track  -> rounded-pill, h-14, bg-surface-strong, border hairline-strong
//   • Thumb  -> rounded-pill, square, bg-primary, on-primary fg
//   • Label  -> text-button (Inter 500 / 14)
//
// Works with both pointer (mouse) and touch.
export default function SwipeToConfirm({
  label = 'Trượt để xác nhận',
  doneLabel = 'Hoàn tất',
  onConfirm,
  icon = 'arrowRight',
  disabled = false,
  className,
}) {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [confirmed, setConfirmed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startProgress = useRef(0);

  // The thumb travels the track width minus its own size.
  const THUMB_PX = 48;

  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (e) => {
      if (!trackRef.current) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const dx = clientX - startX.current;
      const trackWidth = trackRef.current.clientWidth - THUMB_PX;
      const next = Math.max(0, Math.min(1, startProgress.current + dx / Math.max(1, trackWidth)));
      setProgress(next);
    };
    const onUp = () => {
      setDragging(false);
      setProgress((cur) => {
        if (cur >= 0.7) {
          setConfirmed(true);
          onConfirm?.();
          return 1;
        }
        return 0;
      });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, onConfirm]);

  const start = (e) => {
    if (disabled || confirmed) return;
    setDragging(true);
    startX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    startProgress.current = progress;
  };

  return (
    <div
      ref={trackRef}
      className={clsx(
        'relative h-14 w-full select-none overflow-hidden rounded-pill border bg-surface-strong',
        disabled
          ? 'border-hairline cursor-not-allowed opacity-60'
          : 'border-hairline-strong',
        className,
      )}
    >
      {/* Filled trail */}
      <div
        className="absolute inset-y-0 left-0 rounded-pill bg-primary transition-[width] duration-150"
        style={{ width: `calc(${progress * 100}% + ${THUMB_PX / 2}px)` }}
        aria-hidden="true"
      />

      {/* Label */}
      <span
        className={clsx(
          'pointer-events-none absolute inset-0 flex items-center justify-center text-button transition-colors',
          progress > 0.5 ? 'text-on-primary' : 'text-ink',
        )}
      >
        {confirmed ? doneLabel : label}
      </span>

      {/* Thumb */}
      <button
        type="button"
        disabled={disabled || confirmed}
        onPointerDown={start}
        className={clsx(
          'absolute top-1 grid h-12 w-12 place-items-center rounded-pill bg-primary text-on-primary shadow-soft-md',
          'touch-none cursor-grab active:cursor-grabbing',
          disabled && 'cursor-not-allowed',
        )}
        style={{
          left: `calc(4px + ${progress} * (100% - ${THUMB_PX + 4}px))`,
          transition: dragging ? 'none' : 'left 200ms ease-out',
        }}
        aria-label={label}
      >
        <Icon name={confirmed ? 'check' : icon} size={20} />
      </button>
    </div>
  );
}
