import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('nomnom_demo_banner_dismissed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dismissed) {
      root.style.setProperty('--demo-banner-height', '0px');
    } else {
      root.style.setProperty('--demo-banner-height', '36px');
    }
    return () => {
      root.style.setProperty('--demo-banner-height', '0px');
    };
  }, [dismissed]);

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('nomnom_demo_banner_dismissed', '1');
    } catch {
      // Ignore storage errors
    }
    setDismissed(true);
  };

  return (
    <div className="bg-canvas-subtle border-b border-hairline h-9 px-base text-caption text-ink flex items-center justify-between gap-sm sticky top-0 z-[60] backdrop-blur-md bg-opacity-95 shadow-xs">
      <div className="flex items-center gap-xs mx-auto text-center font-medium truncate">
        <span className="inline-flex items-center justify-center bg-primary text-on-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
          Demo
        </span>
        <span className="truncate">
          Môi trường trải nghiệm NomNom: Bạn có thể tự do đặt món và thử mọi tính năng. Dữ liệu mẫu được bảo vệ và tự động làm mới hàng ngày.
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-ink-muted hover:text-ink p-1 rounded-md transition-colors shrink-0"
        aria-label="Đóng thông báo"
        title="Đóng thông báo"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
