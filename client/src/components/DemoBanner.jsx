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
    <>
      <div className="fixed top-0 inset-x-0 z-[60] h-9 bg-white border-b border-hairline px-base text-caption text-ink flex items-center justify-between gap-sm shadow-xs select-none">
        <div className="flex items-center gap-xs mx-auto text-center font-medium truncate">
          <span className="inline-flex items-center justify-center bg-primary text-on-primary text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
            Demo
          </span>
          <span className="truncate text-ink text-[12px]">
            Môi trường trải nghiệm NomNom: Bạn có thể tự do đặt món và thử mọi tính năng. Dữ liệu mẫu được bảo vệ và tự động làm mới hàng ngày.
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted hover:text-ink p-1 rounded transition-colors shrink-0"
          aria-label="Đóng thông báo"
          title="Đóng thông báo"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
      <div className="h-9 shrink-0 pointer-events-none" aria-hidden="true" />
    </>
  );
}
