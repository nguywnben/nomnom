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
    <div className="bg-[#121316] border-b border-[#27272a] h-9 px-base text-caption text-[#e4e4e7] flex items-center justify-between gap-sm sticky top-0 z-[60] shadow-sm select-none">
      <div className="flex items-center gap-xs mx-auto text-center font-medium truncate">
        <span className="inline-flex items-center justify-center bg-amber-400 text-black text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 shadow-xs">
          Demo
        </span>
        <span className="truncate text-[#d4d4d8] text-[12px]">
          Môi trường trải nghiệm NomNom: Bạn có thể tự do đặt món và thử mọi tính năng. Dữ liệu mẫu được bảo vệ và tự động làm mới hàng ngày.
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-[#a1a1aa] hover:text-white p-1 rounded transition-colors shrink-0"
        aria-label="Đóng thông báo"
        title="Đóng thông báo"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
