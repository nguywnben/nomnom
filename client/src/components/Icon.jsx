// Tiny inline-SVG icon set. Single-line strokes, 1.6px, current color.
import clsx from 'clsx';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const paths = {
  search: <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" {...stroke} />,
  cart: (
    <g {...stroke}>
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17.5" cy="20" r="1.2" />
    </g>
  ),
  user: (
    <g {...stroke}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </g>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" {...stroke} />,
  close: <path d="M6 6l12 12M18 6L6 18" {...stroke} />,
  chevronRight: <path d="M9 6l6 6-6 6" {...stroke} />,
  chevronLeft: <path d="M15 6l-6 6 6 6" {...stroke} />,
  chevronDown: <path d="M6 9l6 6 6-6" {...stroke} />,
  chevronUp: <path d="M18 15l-6-6-6 6" {...stroke} />,
  plus: <path d="M12 5v14M5 12h14" {...stroke} />,
  minus: <path d="M5 12h14" {...stroke} />,
  star: (
    <path d="M12 3.5l2.6 5.5 5.9.6-4.5 4.1 1.3 5.9L12 16.7l-5.3 2.9 1.3-5.9L3.5 9.6l5.9-.6L12 3.5z" {...stroke} />
  ),
  starFilled: (
    <path
      d="M12 3.5l2.6 5.5 5.9.6-4.5 4.1 1.3 5.9L12 16.7l-5.3 2.9 1.3-5.9L3.5 9.6l5.9-.6L12 3.5z"
      fill="currentColor"
    />
  ),
  clock: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </g>
  ),
  pin: (
    <g {...stroke}>
      <path d="M12 22s7-7.6 7-13a7 7 0 1 0-14 0c0 5.4 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </g>
  ),
  bike: (
    <g {...stroke}>
      <circle cx="6" cy="17" r="3.5" />
      <circle cx="18" cy="17" r="3.5" />
      <path d="M6 17l4-8h5l3 8M10 9l-2-4h2" />
    </g>
  ),
  package: (
    <g {...stroke}>
      <path d="M3 7.5l9-4 9 4-9 4-9-4z" />
      <path d="M3 7.5V17l9 4 9-4V7.5" />
      <path d="M12 11.5V21" />
    </g>
  ),
  check: <path d="M5 12l4 4 10-10" {...stroke} />,
  x: <path d="M6 6l12 12M18 6L6 18" {...stroke} />,
  alert: (
    <g {...stroke}>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v4M12 17h.01" />
    </g>
  ),
  alertCircle: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </g>
  ),
  info: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M12 12v4" />
    </g>
  ),
  wallet: (
    <g {...stroke}>
      <path d="M3 7a2 2 0 0 1 2-2h14v4H5a2 2 0 0 1-2-2z" />
      <path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3" />
      <path d="M16 13h5v3h-5a1.5 1.5 0 1 1 0-3z" />
    </g>
  ),
  chat: (
    <g {...stroke}>
      <path d="M21 12a8 8 0 1 1-3.2-6.4L21 5l-1 3.5A8 8 0 0 1 21 12z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </g>
  ),
  send: <path d="M3 12l18-8-7 18-3-7-8-3z" {...stroke} />,
  bell: (
    <g {...stroke}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </g>
  ),
  bellOff: (
    <g {...stroke}>
      <path d="M6 16V11a6 6 0 0 1 9.2-5M18 11v5l1.5 2H4.5L6 16" />
      <path d="M3 3l18 18M10 20a2 2 0 0 0 4 0" />
    </g>
  ),
  filter: <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" {...stroke} />,
  grid: (
    <g {...stroke}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </g>
  ),
  list: (
    <g {...stroke}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="0.8" />
      <circle cx="4" cy="12" r="0.8" />
      <circle cx="4" cy="18" r="0.8" />
    </g>
  ),
  trending: <path d="M3 17l6-6 4 4 8-8M21 7v6h-6" {...stroke} />,
  store: (
    <g {...stroke}>
      <path d="M4 9l1-5h14l1 5" />
      <path d="M4 9v11h16V9" />
      <path d="M4 9c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3" />
    </g>
  ),
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" {...stroke} />,
  printer: (
    <g {...stroke}>
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </g>
  ),
  grip: (
    <g {...stroke}>
      <circle cx="9" cy="5" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="19" r="1" fill="currentColor" />
      <circle cx="15" cy="5" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="19" r="1" fill="currentColor" />
    </g>
  ),
  eye: (
    <g {...stroke}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  eyeOff: (
    <g {...stroke}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M7.8 7.8C5.8 9.4 4.4 11.5 3.5 14c1.8 3.8 5.2 6 8.5 6 1.5 0 2.9-.4 4.2-1.2" />
      <path d="M14.5 14.5c1.2-.9 2.2-2.1 2.9-3.5M9.9 5.1A10.5 10.5 0 0 1 12 5c4.5 0 8.2 3 9.9 7" />
    </g>
  ),
  cog: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.5-2.4.7a7 7 0 0 0-2.8-1.6L13 2h-2l-.6 2.5a7 7 0 0 0-2.8 1.6l-2.4-.7-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .5.1 1.1.2 1.6l-2 1.5 2 3.5 2.4-.7a7 7 0 0 0 2.8 1.6L11 22h2l.6-2.5a7 7 0 0 0 2.8-1.6l2.4.7 2-3.5-2-1.5c.1-.5.2-1.1.2-1.6z" />
    </g>
  ),
  camera: (
    <g {...stroke}>
      <path d="M4 8h3l2-2h6l2 2h3v11H4V8z" />
      <circle cx="12" cy="13" r="3.5" />
    </g>
  ),
  image: (
    <g {...stroke}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="M3 16l5-5 3.5 3.5 2.5-2.5 4 4" />
    </g>
  ),
  edit: (
    <g {...stroke}>
      <path d="M4 20h4l11-11-4-4L4 16v4z" />
      <path d="M15 5l4 4" />
    </g>
  ),
  trash: (
    <g {...stroke}>
      <path d="M3 6h18M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </g>
  ),
  upload: <path d="M12 5v12M6 11l6-6 6 6M5 21h14" {...stroke} />,
  download: <path d="M12 19V5M6 13l6 6 6-6M5 21h14" {...stroke} />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" {...stroke} />,
  spinner: <path d="M21 12a9 9 0 1 1-9-9" {...stroke} />,
  copy: (
    <g {...stroke}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </g>
  ),
  zap: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...stroke} />,
  ticket: (
    <g {...stroke}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
      <path d="M13 5v2M13 11v2M13 17v2" />
    </g>
  ),
  tag: (
    <g {...stroke}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" />
    </g>
  ),
  percent: (
    <g {...stroke}>
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </g>
  ),
  refresh: (
    <g {...stroke}>
      <path d="M21 12a9 9 0 0 1-15 6.7L3 17M3 12a9 9 0 0 1 15-6.7L21 7" />
      <path d="M21 3v4h-4M3 21v-4h4" />
    </g>
  ),
  apple: <path d="M16.3 12.4a4.7 4.7 0 0 1 2.3-3.9 4.8 4.8 0 0 0-3.8-2.1c-1.6 0-3.1.9-3.9.9-.8 0-2.1-.9-3.4-.9C5 6.5 2.5 8.4 2.5 12.3c0 1.2.2 2.4.6 3.5.5 1.5 2.4 5.2 4.4 5.1 1 0 1.7-.7 3.1-.7s2 .7 3.1.7c2 0 3.7-3.4 4.2-4.9a4.7 4.7 0 0 1-1.6-3.6zM14.4 4.7a4.4 4.4 0 0 0 1-3.3 4.4 4.4 0 0 0-2.8 1.5 4 4 0 0 0-1 3.2 3.6 3.6 0 0 0 2.8-1.4z" fill="currentColor" />,
  google: (
    <g>
      <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.4z" fill="#4285f4" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34a853" />
      <path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1A10 10 0 0 0 3.1 16.5L6.4 14z" fill="#fbbc04" />
      <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2A10 10 0 0 0 3.1 7.5L6.4 10c.8-2.4 3-4.1 5.6-4.1z" fill="#ea4335" />
    </g>
  ),
  facebook: <path d="M22 12a10 10 0 1 0-11.6 9.9V15H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1 0 2.1.2 2.1.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 3h-2.3v6.9A10 10 0 0 0 22 12z" fill="currentColor" />,
  phone: (
    <path
      d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"
      {...stroke}
    />
  ),
  mail: (
    <g {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </g>
  ),
  card: (
    <g {...stroke}>
      <rect x="2.5" y="6" width="19" height="13" rx="2" />
      <path d="M2.5 10h19M6 15h3" />
    </g>
  ),
  cash: (
    <g {...stroke}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 9h.01M18 15h.01" />
    </g>
  ),
  logout: (
    <g {...stroke}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </g>
  ),
};

export default function Icon({ name, size = 20, className }) {
  const child = paths[name];
  if (!child) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={clsx('shrink-0', className)}
      aria-hidden="true"
      focusable="false"
    >
      {child}
    </svg>
  );
}
