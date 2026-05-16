import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Cuộn cửa sổ lên đầu khi đổi route; nếu URL có #fragment thì cuộn tới phần tử đó (sau khi paint). */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
