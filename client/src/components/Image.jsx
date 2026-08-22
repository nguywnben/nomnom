import { useState } from 'react';
import clsx from 'clsx';

// Image with deterministic placeholder fallback if remote fails.
export default function Image({ src, alt, className, fallbackSeed, ratio = '4/3' }) {
  const [errored, setErrored] = useState(false);
  const seed = String(fallbackSeed || alt || 'food').replace(/\s+/g, '').toLowerCase();
  const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = (hash * 37) % 360;
  const unsplash = src?.includes('images.unsplash.com') && !/[?&]w=/.test(src)
    ? {
        srcSet: [320, 640, 1024]
          .map((w) => `${src}${src.includes('?') ? '&' : '?'}w=${w}&q=70 ${w}w`)
          .join(', '),
        sizes: '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
      }
    : null;
  return (
    <div className={clsx('overflow-hidden bg-surface-strong', className)} style={{ aspectRatio: ratio }}>
      {src && !errored ? (
        <img
          src={src}
          srcSet={unsplash?.srcSet}
          sizes={unsplash?.sizes}
          alt={alt}
          draggable={false}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center text-caption-uppercase font-semibold text-on-dark"
          style={{
            background: `linear-gradient(135deg, hsl(${hue}, 35%, 35%) 0%, hsl(${(hue + 60) % 360}, 30%, 20%) 100%)`,
          }}
        >
          {alt?.split(' ').slice(0, 2).join(' ')}
        </div>
      )}
    </div>
  );
}
