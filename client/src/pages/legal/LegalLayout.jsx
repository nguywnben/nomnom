import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';

export function LegalSection({ title, children }) {
  return (
    <section className="rounded-lg border border-hairline bg-surface-card p-base md:p-lg">
      <h2 className="text-title-md text-ink">{title}</h2>
      <div className="mt-sm space-y-sm text-body-md leading-relaxed text-body">{children}</div>
    </section>
  );
}

export default function LegalLayout({
  eyebrow = 'Pháp lý',
  title,
  updatedAt,
  backTo = '/',
  backLabel = 'Trang chủ',
  children,
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/95 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between gap-base">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-body-sm font-medium text-body hover:text-ink"
          >
            <Icon name="chevronLeft" size={18} />
            {backLabel}
          </Link>
          <Link to="/" className="inline-flex shrink-0" aria-label="NomNom">
            <Logo mono />
          </Link>
        </div>
      </header>

      <main className="container-page py-xxl md:py-section">
        <p className="text-caption-uppercase text-body">{eyebrow}</p>
        <h1 className="mt-1 text-display-md text-ink md:text-display-lg">{title}</h1>
        {updatedAt ? (
          <p className="mt-sm max-w-2xl text-body-sm text-body">Cập nhật lần cuối: {updatedAt}</p>
        ) : null}

        <article className="mt-xxl flex max-w-3xl flex-col gap-base">{children}</article>

        <p className="mt-xxl max-w-2xl text-body-sm text-body">
          Có thắc mắc? Gửi email{' '}
          <a href="mailto:legal@nomnom.vn" className="font-medium text-text-link hover:underline">
            legal@nomnom.vn
          </a>{' '}
          hoặc xem{' '}
          <Link to="/faq" className="font-medium text-text-link hover:underline">
            FAQ đối tác
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
