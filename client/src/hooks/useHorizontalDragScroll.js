import { useCallback, useRef } from 'react';

/**
 * Kéo ngang bằng chuột (desktop). Touch vẫn dùng scroll native của trình duyệt.
 */
export function useHorizontalDragScroll() {
  const ref = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = ref.current;
    if (!el) return;

    drag.current = {
      active: true,
      startX: e.pageX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };

    const onMove = (ev) => {
      if (!drag.current.active) return;
      const dx = ev.pageX - drag.current.startX;
      if (Math.abs(dx) > 4) drag.current.moved = true;
      el.scrollLeft = drag.current.scrollLeft - dx;
    };

    const onUp = () => {
      drag.current.active = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  /** Chặn click vào Link nếu vừa kéo (tránh mở trang nhầm). */
  const onClickCapture = useCallback((e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  return { ref, onMouseDown, onClickCapture };
}
