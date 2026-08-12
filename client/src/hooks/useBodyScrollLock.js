import { useEffect } from 'react';

let lockCount = 0;
let savedStyles = null;

function lockBodyScroll() {
  if (lockCount === 0) {
    const body = document.body;
    savedStyles = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };

    // Older browsers without scrollbar-gutter need explicit compensation.
    if (!CSS.supports('scrollbar-gutter: stable')) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
        body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      }
    }

    body.style.overflow = 'hidden';
  }

  lockCount += 1;

  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount !== 0 || !savedStyles) return;

    document.body.style.overflow = savedStyles.overflow;
    document.body.style.paddingRight = savedStyles.paddingRight;
    savedStyles = null;
  };
}

export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    return lockBodyScroll();
  }, [locked]);
}
