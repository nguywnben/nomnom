import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import Image from '../components/Image.jsx';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import { useGeolocationLocalityLabel } from '../hooks/useGeolocationLocalityLabel.js';
import { helpers } from '../data/mock.js';

// ---------------------------------------------------------------------------
// Landing page — high-converting food brand splash, NOT a SaaS marketing page.
//
//   1. Top bar — wordmark + in-page nav + CTA vào ứng dụng
//   2. Hero — full-bleed food photo + dark gradient + CTA vào /app
//   3. "How it works" — 3 steps (Choose → Order → Eat), small illustrated icons
//   4. Featured restaurants strip
//   5. Cuisines carousel — round food photos
//   6. Partner with us — restaurant imagery + merchant CTA
//   8. By the numbers — quiet trust strip
//   9. Footer — neo liên hệ + liên kết pháp lý
//
// Tokens: primary CTAs at rounded-md (8px), cards rounded-lg (12px),
// Inter typography, pure black brand, hairline borders.
// ---------------------------------------------------------------------------

const HERO_BG = helpers.unsplash('photo-1504674900247-0877df9cc836', 1800);
const MERCHANT_BG = helpers.unsplash('photo-1517248135467-4c7edcad34c4', 1400);

const HOW_IT_WORKS = [
  {
    icon: 'search',
    title: 'Chọn món',
    desc: 'Khám phá quán ăn và món ăn phù hợp với nhu cầu của bạn.',
  },
  {
    icon: 'cart',
    title: 'Đặt món',
    desc: 'Thanh toán linh hoạt: thẻ, ví điện tử, hoặc tiền mặt. Áp dụng mã giảm giá khi thanh toán.',
  },
  {
    icon: 'bike',
    title: 'Thưởng thức',
    desc: 'Theo dõi trạng thái đơn hàng rõ ràng cho đến khi bạn nhận món.',
  },
];

const MOMENTS = [
  {
    label: 'Buổi trưa',
    title: 'Một lựa chọn gọn gàng giữa ngày bận rộn.',
    imageUrl: helpers.unsplash('photo-1547592180-85f173990554', 1000),
  },
  {
    label: 'Buổi chiều',
    title: 'Một khoảng nghỉ nhỏ cho điều bạn đang thèm.',
    imageUrl: helpers.unsplash('photo-1551024601-bec78aea704b', 1000),
  },
  {
    label: 'Buổi tối',
    title: 'Một bữa ăn để quay về và quây quần.',
    imageUrl: helpers.unsplash('photo-1515003197210-e0cd71810b5f', 1000),
  },
];

const EXPERIENCE_PRINCIPLES = [
  {
    icon: 'search',
    title: 'Dễ tìm',
    description: 'Tìm theo món hoặc quán ăn, với thông tin được trình bày rõ ràng.',
  },
  {
    icon: 'cart',
    title: 'Dễ quyết định',
    description: 'Từ món ăn đến thanh toán, mỗi bước đều có một mục đích cụ thể.',
  },
  {
    icon: 'eye',
    title: 'Dễ theo dõi',
    description: 'Trạng thái đơn hàng luôn sẵn sàng khi bạn cần kiểm tra.',
  },
  {
    icon: 'refresh',
    title: 'Dễ quay lại',
    description: 'Những lựa chọn phù hợp sẽ luôn sẵn để bạn tiếp tục lần sau.',
  },
];

/** Cuộn mượt. Các khối CTA (đối tác / tài xế) căn giữa khung nhìn; "Cách hoạt động" cuộn tự nhiên từ đầu section. */
function scrollToSection(id) {
  const block = id === 'cach-hoat-dong' ? 'start' : 'center';
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block });
}

const LANDING_HEADER_ELEVATE_AFTER_PX = 16;

export default function Landing() {
  const [headerElevated, setHeaderElevated] = useState(false);
  const heroLocalityLine = useGeolocationLocalityLabel();
  const categories = [];
  const featuredRestaurants = [];

  useEffect(() => {
    const onScroll = () => {
      setHeaderElevated(window.scrollY > LANDING_HEADER_ELEVATE_AFTER_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-canvas">
      {/* ---- Top bar ------------------------------------------------------ */}
      <header
        className={clsx(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ease-out',
          headerElevated
            ? 'border-b border-hairline bg-canvas/90 backdrop-blur'
            : 'border-b border-transparent bg-transparent shadow-none',
        )}
      >
        <div className="container-page flex h-16 items-center justify-between">
          <Link
            to="/"
            aria-label="NomNom home"
            className="inline-flex shrink-0 items-center"
          >
            <Logo mono={headerElevated} />
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-xs md:gap-sm">
            <a
              href="#cach-hoat-dong"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('cach-hoat-dong');
              }}
              className={clsx(
                'hidden text-nav-link transition-colors duration-300 ease-out md:inline-flex',
                headerElevated ? 'text-body hover:text-ink' : 'text-on-dark hover:text-on-dark-soft',
              )}
            >
              Cách hoạt động
            </a>
            <a
              href="#doi-tac"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('doi-tac');
              }}
              className={clsx(
                'hidden text-nav-link transition-colors duration-300 ease-out md:inline-flex',
                headerElevated ? 'text-body hover:text-ink' : 'text-on-dark hover:text-on-dark-soft',
              )}
            >
              Hợp tác
            </a>
            <Button
              as={Link}
              to="/app"
              size="sm"
              variant={headerElevated ? 'primary' : 'secondary'}
              trailingIcon="arrowRight"
              className={clsx(
                !headerElevated &&
                  '!bg-canvas/15 !border-canvas/30 !text-on-dark transition-[background-color,border-color,color] duration-300 ease-out hover:!bg-canvas/20',
              )}
            >
              Vào ứng dụng
            </Button>
          </div>
        </div>
      </header>

      {/* ---- HERO -------------------------------------------------------- */}
      <section className="relative isolate min-h-[560px] overflow-hidden md:min-h-[680px] lg:min-h-[720px]">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/40 to-ink/75" />

        <div className="hidden" aria-hidden="true">
          <Badge tone="dark" className="mx-auto mb-base !bg-canvas/15 !text-on-dark backdrop-blur">
            Giao nhanh, đặt món thuận tiện · {heroLocalityLine}
          </Badge>
          <h1 className="mx-auto max-w-3xl text-display-lg md:text-display-xl lg:text-display-mega">
            Đói bụng? Đặt món ngay.
          </h1>
          <p className="mx-auto mt-md max-w-xl text-body-md text-on-dark-soft">
            Thức ăn ngon từ những quán ăn thực thụ, giao nóng tận cửa. Hãy chọn món bạn thèm và chúng tôi sẽ lo phần còn lại.
          </p>

          {/* CTA vào ứng dụng — đặt món, nhập địa chỉ trong /app */}
          <div id="dat-hang-legacy" className="mx-auto mt-lg flex justify-center">
            <Button
              as={Link}
              to="/app"
              size="lg"
              variant="secondary"
              trailingIcon="arrowRight"
              className={clsx(
                'w-full min-w-[min(100%,17.5rem)] sm:w-auto',
                '!border-canvas/35 !bg-canvas/15 !text-on-dark backdrop-blur-md',
                'shadow-lg shadow-ink/25 transition-[background-color,border-color,box-shadow]',
                'hover:!border-canvas/45 hover:!bg-canvas/25 hover:shadow-xl',
                'active:!bg-canvas/30',
              )}
            >
              Vào ứng dụng đặt món
            </Button>
          </div>
        </div>

        <div id="dat-hang" className="container-page flex min-h-[560px] flex-col items-center justify-end pb-xxl pt-28 text-center text-on-dark md:min-h-[680px] md:justify-center md:pb-12 md:pt-32 lg:min-h-[720px]">
          <div className="max-w-2xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.88px] leading-[1.4] text-on-dark-soft">NomNom cho những bữa ăn thường ngày</div>
            <h1 className="mt-sm text-display-lg text-on-dark md:text-display-xl lg:text-display-mega">
              Ăn ngon theo cách nhẹ nhàng hơn.
            </h1>
            <p className="mx-auto mt-md w-full max-w-xl text-title-md text-on-dark-soft">
              Khám phá món ăn, đặt đơn và theo dõi hành trình của bữa ăn trong một không gian rõ ràng, thân thuộc.
            </p>
            <div className="mt-lg flex justify-center">
              <Button
                as={Link}
                to="/app"
                size="lg"
                variant="secondary"
                trailingIcon="arrowRight"
                className="!border-canvas/35 !bg-canvas/15 !text-on-dark backdrop-blur-md shadow-lg shadow-ink/25 transition-[background-color,border-color,box-shadow] hover:!border-canvas/45 hover:!bg-canvas/25 hover:shadow-xl active:!bg-canvas/30"
              >
                Khám phá NomNom
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="pointer-events-none absolute inset-x-0 bottom-base flex justify-center text-on-dark-soft">
          <Icon name="chevronDown" size={20} className="opacity-70" />
        </div>
      </section>

      {/* ---- How it works ------------------------------------------------ */}
      <section
        id="cach-hoat-dong"
        className="container-page scroll-mt-[0.75rem] py-xxl md:py-section"
      >
        <div className="mb-xl text-center md:mb-xxl">
          <div className="text-caption-uppercase text-body">Cách NomNom hoạt động</div>
          <h2 className="text-display-md text-ink md:text-display-lg">Bữa tối chỉ với 3 chạm.</h2>
        </div>
        <div className="grid gap-base md:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col gap-sm rounded-lg border border-hairline-strong bg-surface-card p-lg"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-on-primary">
                  <Icon name={step.icon} size={18} />
                </span>
                <span className="text-display-md text-body nums">0{i + 1}</span>
              </div>
              <div className="text-title-md text-ink">{step.title}</div>
              <p className="text-body-sm text-body">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Cuisines carousel ------------------------------------------- */}
      <section className="hidden" aria-hidden="true">
        <div className="mb-base flex items-end justify-between">
          <div>
            <div className="text-caption-uppercase text-body">Từ mọi nơi</div>
            <h2 className="text-display-md text-ink">Các món ăn bạn sẽ yêu thích</h2>
          </div>
          <a
            href="#dat-hang"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('dat-hang');
            }}
            className="text-button text-text-link hover:underline"
          >
            Xem tất cả →
          </a>
        </div>
        <div className="-mx-base flex gap-base overflow-x-auto px-base pb-1 no-scrollbar md:mx-0 md:px-0">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/app/search"
              className="group flex w-[100px] shrink-0 flex-col items-center gap-1.5 md:w-[120px]"
            >
              <span className="relative overflow-hidden rounded-pill border border-hairline-strong bg-surface-card transition-shadow group-hover:shadow-soft">
                <Image src={c.imageUrl} alt={c.name} ratio="1" className="h-24 w-24 md:h-28 md:w-28" />
              </span>
              <span className="text-caption font-medium text-ink">
                <span aria-hidden="true">{c.emoji} </span>
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Featured restaurants ---------------------------------------- */}
      <section className="hidden" aria-hidden="true">
        <div className="mb-base flex items-end justify-between">
          <div>
            <div className="text-caption-uppercase text-body">Lựa chọn hàng đầu</div>
            <h2 className="text-display-sm text-ink md:text-display-md">Những quán ăn đáng thử</h2>
          </div>
          <a
            href="#dat-hang"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('dat-hang');
            }}
            className="text-button text-text-link hover:underline"
          >
            Đặt món →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-base lg:grid-cols-4">
          {featuredRestaurants.map((r) => (
            <Link
              key={r.id}
              to={`/app/restaurant/${r.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
            >
              <div className="relative">
                <Image
                  src={r.bannerUrl}
                  alt={r.name}
                  ratio="16/10"
                  className="w-full"
                />
                <div className="absolute -bottom-3 right-base">
                  <Avatar src={r.logoUrl} name={r.name} square size="md" className="ring-2 ring-canvas" />
                </div>
              </div>
              <div className="p-base pt-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-title-md text-ink leading-tight">{r.name}</div>
                  <span className="inline-flex items-center gap-0.5 text-body-sm text-ink">
                    <Icon name="starFilled" size={12} />
                    <span className="nums">{Number(r.ratingAvg ?? 0).toFixed(1)}</span>
                  </span>
                </div>
                <div className="mt-1 text-caption text-body">
                  {r.tagline || 'Quán ăn đối tác'} · <span className="nums">{r.avgPrepTimeMin ? `${r.avgPrepTimeMin} phút` : 'Đang cập nhật'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-xxl md:pb-section">
        <div className="mb-lg max-w-xl md:mb-xl">
          <div className="text-caption-uppercase text-body">Theo nhịp của bạn</div>
          <h2 className="mt-1 text-display-md text-ink">Có những bữa ăn chỉ cần đến đúng lúc.</h2>
          <p className="mt-xs text-body-md text-body">
            NomNom ở đây cho những khoảnh khắc thường ngày, khi bạn muốn dành ít thời gian hơn cho thao tác và nhiều thời gian hơn cho bữa ăn.
          </p>
        </div>
        <div className="grid gap-base md:grid-cols-3">
          {MOMENTS.map((moment) => (
            <div key={moment.label} className="overflow-hidden rounded-lg border border-hairline-strong bg-surface-card">
              <Image src={moment.imageUrl} alt={moment.title} ratio="4/3" className="w-full" />
              <div className="p-base">
                <div className="text-caption-uppercase text-body">{moment.label}</div>
                <div className="mt-1 text-title-md text-ink">{moment.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="container-page pb-xxl md:pb-section">
          <div className="max-w-xl">
            <div className="text-caption-uppercase text-body">Trải nghiệm NomNom</div>
            <h2 className="mt-1 text-display-md text-ink">Những điều quan trọng được đặt đúng chỗ.</h2>
          </div>
          <div className="mt-xl grid md:grid-cols-2">
            {EXPERIENCE_PRINCIPLES.map((principle, index) => (
              <div
                key={principle.title}
                className={clsx(
                  'flex gap-sm border-b border-hairline-strong p-base last:border-b-0',
                  index >= 2 && 'md:border-b-0',
                  index % 2 === 1 && 'md:border-l md:border-hairline-strong',
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-card text-ink">
                  <Icon name={principle.icon} size={17} />
                </span>
                <div>
                  <div className="text-title-sm text-ink">{principle.title}</div>
                  <p className="mt-1 text-body-sm text-body">{principle.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Partner with us --------------------------------------------- */}
      <section id="doi-tac" className="container-page">
        <div className="grid overflow-hidden rounded-lg border border-hairline-strong md:grid-cols-2">
          <div className="relative isolate aspect-video w-full overflow-hidden md:aspect-auto md:min-h-[360px]">
            <Image src={MERCHANT_BG} alt="Restaurant kitchen" ratio="16/9" className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-tr from-ink/40 to-transparent" />
            <div className="absolute left-base top-base">
              <Badge tone="dark" className="!bg-canvas/15 !text-on-dark backdrop-blur">Dành cho quán ăn</Badge>
            </div>
          </div>
          <div className="flex flex-col justify-center bg-surface-card p-xl md:p-xxl">
            <h3 className="text-display-md text-ink">Hợp tác với chúng tôi</h3>
            <p className="mt-xs text-body-md text-body">
              Tiếp cận nhiều thực khách hơn, quản lý đơn hàng từ một máy tính bảng và nhận thanh toán hàng tuần. Đăng ký chỉ mất 10 phút.
            </p>
            <ul className="mt-base space-y-2 text-body-sm text-ink">
              <PartnerPoint>Hoa hồng 0% trong 30 ngày đầu</PartnerPoint>
              <PartnerPoint>Bảng theo dõi đơn hàng trực tiếp + tự động in biên lai</PartnerPoint>
              <PartnerPoint>Chủ động kiểm soát khuyến mãi, tiếp cận khách hàng tiềm năng</PartnerPoint>
              <PartnerPoint>Thanh toán hàng ngày vào tài khoản ngân hàng</PartnerPoint>
            </ul>
            <div className="mt-lg flex flex-wrap items-center gap-xs">
              <Button as={Link} to="/merchant/onboarding" trailingIcon="arrowRight">
                Đăng ký quán ăn
              </Button>
              <Button as={Link} to="/faq#faq-quan-an" variant="secondary">
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Final CTA --------------------------------------------------- */}
      <section className="container-page py-xxl text-center md:py-section">
        <h2 className="mx-auto max-w-2xl text-display-md text-ink md:text-display-lg">
          Bữa ăn tiếp theo chỉ cách bạn 2 chạm.
        </h2>
        <p className="mx-auto mt-xs max-w-lg text-body-md text-body">
          Miễn phí giao hàng lần đầu — không cần mã.
        </p>
        <div className="mt-base flex flex-wrap items-center justify-center gap-xs">
          <Button size="lg" onClick={() => scrollToSection('dat-hang')} trailingIcon="arrowRight">
            Đặt món ngay
          </Button>
          <Button size="lg" variant="secondary" onClick={() => scrollToSection('dat-hang')}>
            Khám phá quán ăn
          </Button>
        </div>
      </section>

      {/* ---- Footer ------------------------------------------------------ */}
      <footer id="lien-he" className="border-t border-hairline bg-canvas">
        <div className="container-page py-12">
          <div className="grid grid-cols-2 gap-base md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-xs text-body-sm text-body max-w-xs">
                Đồ ăn thực, giao hàng nhanh. Xây dựng bằng sự tận tâm.
              </p>
            </div>
            <FooterGroup
              title="Thưởng thức"
              links={[
                { label: 'Quán ăn', to: '/app' },
                { label: 'Tìm kiếm', to: '/app/search' },
                { label: 'Khuyến mãi & voucher', to: '/app/profile/promotions' },
              ]}
            />
            <FooterGroup
              title="Đối tác"
              links={[
                { label: 'Đăng ký quán ăn', to: '/merchant/onboarding' },
                { label: 'FAQ đối tác', to: '/faq' },
              ]}
            />
            <FooterGroup
              title="Hỗ trợ"
              links={[
                { label: 'Câu hỏi thường gặp', to: '/faq' },
                { label: 'Điều khoản sử dụng', to: '/terms-of-service' },
                { label: 'Chính sách bảo mật', to: '/privacy-policy' },
              ]}
            />
          </div>
          <div className="mt-12 flex flex-col gap-xs border-t border-hairline pt-base md:flex-row md:items-center md:justify-between">
            <div className="text-body-sm text-body">© {new Date().getFullYear()} NomNom</div>
            <div className="flex items-center gap-base text-body-sm">
              <Link to="/terms-of-service" className="text-body hover:text-ink">
                Điều khoản
              </Link>
              <Link to="/privacy-policy" className="text-body hover:text-ink">
                Bảo mật
              </Link>
              <Link to="/privacy-policy" className="text-body hover:text-ink">Cookie</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PartnerPoint({ children }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-pill bg-success/10 text-success">
        <Icon name="check" size={10} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function FooterGroup({ title, links }) {
  return (
    <div>
      <div className="text-caption-uppercase text-ink mb-2">{title}</div>
      <ul className="space-y-1.5">
        {links.map((l) => {
          const label = typeof l === 'string' ? l : l.label;
          const to = typeof l === 'string' ? '#' : l.to;
          return (
            <li key={label}>
              <Link to={to} className="text-body-sm text-body hover:text-ink">
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
