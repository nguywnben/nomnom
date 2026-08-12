import { useCallback, useEffect, useRef } from 'react';

/**
 * Kéo ngang bằng chuột (desktop). Touch vẫn dùng scroll native của trình duyệt.
 */
export function useHorizontalDragScroll() {
  const ref = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const removeListeners = useRef(() => {});

  const finishDrag = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    removeListeners.current();
    removeListeners.current = () => {};
  }, []);

  useEffect(() => {
    const cancelDrag = () => finishDrag();
    window.addEventListener('blur', cancelDrag);
    document.addEventListener('visibilitychange', cancelDrag);
    return () => {
      window.removeEventListener('blur', cancelDrag);
      document.removeEventListener('visibilitychange', cancelDrag);
      finishDrag();
    };
  }, [finishDrag]);

  const onMouseDown = useCallback((event) => {
    if (event.button !== 0) return;
    const el = ref.current;
    if (!el) return;

    finishDrag();
    drag.current = {
      active: true,
      startX: event.pageX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };

    const onMove = (moveEvent) => {
      if (!drag.current.active) return;
      const dx = moveEvent.pageX - drag.current.startX;
      if (Math.abs(dx) > 4) {
        drag.current.moved = true;
        moveEvent.preventDefault();
      }
      el.scrollLeft = drag.current.scrollLeft - dx;
    };
    const onMouseOut = (outEvent) => {
      if (!outEvent.relatedTarget) finishDrag();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', finishDrag, { once: true });
    window.addEventListener('mouseout', onMouseOut);
    removeListeners.current = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', finishDrag);
      window.removeEventListener('mouseout', onMouseOut);
    };
  }, [finishDrag]);

  /** Chặn click vào Link nếu vừa kéo (tránh mở trang nhầm). */
  const onClickCapture = useCallback((e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  return {
    ref,
    onMouseDown,
    onClickCapture,
  };
}
