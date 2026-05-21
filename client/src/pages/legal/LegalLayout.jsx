import { Link } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="mb-sm text-title-md text-ink">{title}</h2>
      <div className="space-y-sm text-body-md leading-relaxed text-body">{children}</div>
    </section>
  );
}

export default function LegalLayout({ title, updatedAt, backTo = '/register', backLabel = 'Quay lại', children }) {
  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/95 backdrop-blur-sm">
        <div className="container-page flex h-14 items-center justify-between gap-sm">
          <Link to="/app" aria-label="NomNom">
            <Logo size="sm" />
          </Link>
          <Link to={backTo} className="text-button text-text-link hover:underline">
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="container-page mx-auto max-w-3xl px-base py-xl md:px-0">
        <h1 className="text-display-md text-ink md:text-display-lg">{title}</h1>
        {updatedAt && <p className="mt-xs text-caption text-body">Cập nhật lần cuối: {updatedAt}</p>}
        <article className="mt-lg flex flex-col gap-lg">{children}</article>

        <p className="mt-xl border-t border-hairline pt-base text-caption text-body">
          Có thắc mắc? Liên hệ{' '}
          <a href="mailto:legal@nomnom.vn" className="text-text-link hover:underline">
            legal@nomnom.vn
          </a>
          .
        </p>
      </main>
    </div>
  );
}
