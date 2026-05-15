import clsx from 'clsx';
import logoImg from '../assets/logo.png';

// NomNom wordmark — editorial Inter 600 + the small monogram dot.
// Pure black, monochrome; matches DESIGN.md "single brand voltage".
export default function Logo({ className, size = 'md', mono = true }) {
  const sz = size === 'lg' ? 'text-display-md' : size === 'sm' ? 'text-title-sm' : 'text-title-md';
  return (
    <span className={clsx('inline-flex items-center gap-2 font-semibold', sz, className)}>
      <img src={logoImg} alt="NomNom" className="h-6 w-6 rounded-sm object-contain" />
      <span className={mono ? 'text-ink' : 'text-on-dark'}>
        nomnom<span className="text-text-link">.</span>
      </span>
    </span>
  );
}
