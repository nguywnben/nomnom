import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/** Web breakpoint: below this width we show full mobile driver UI. */
const DRIVER_DESKTOP_BLOCK_MIN_PX = 1024;
const mqDesktop = `(min-width: ${DRIVER_DESKTOP_BLOCK_MIN_PX}px)`;

/**
 * Driver shell layout:
 * - Native (Capacitor): always full mobile driver UI.
 * - Web < 1024px: full mobile driver UI.
 * - Web ≥ 1024px: desktop blocking page (not the in-app chrome).
 */
export function useDriverLayoutMode() {
  const isNative = Capacitor.isNativePlatform();

  const [isDesktopWebViewport, setIsDesktopWebViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(mqDesktop).matches : false,
  );

  useEffect(() => {
    if (isNative) return;
    const mq = window.matchMedia(mqDesktop);
    const onChange = () => setIsDesktopWebViewport(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [isNative]);

  const showDesktopBlock = !isNative && isDesktopWebViewport;

  return { showDesktopBlock };
}
