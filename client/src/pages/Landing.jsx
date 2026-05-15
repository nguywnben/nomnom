import { Link, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import Image from '../components/Image.jsx';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import { categories, helpers, restaurants } from '../data/mock.js';

// ---------------------------------------------------------------------------
// Landing page — high-converting food brand splash, NOT a SaaS marketing page.
//
//   1. Top bar — wordmark + sign in + Order now CTA
//   2. Hero — full-bleed food photo + dark gradient + delivery address + Order CTA
//   3. "How it works" — 3 steps (Choose → Order → Eat), small illustrated icons
//   4. Featured restaurants strip
//   5. Cuisines carousel — round food photos
//   6. Partner with us — restaurant imagery + merchant CTA
//   7. Ride with us — driver imagery + driver CTA
//   8. By the numbers — quiet trust strip
//   9. Footer — links + role admin entrypoint tucked at the bottom
//
// Tokens: primary CTAs at rounded-md (8px), cards rounded-lg (12px),
// Inter typography, pure black brand, hairline borders.
// ---------------------------------------------------------------------------

const HERO_BG = helpers.unsplash('photo-1504674900247-0877df9cc836', 1800);
const MERCHANT_BG = helpers.unsplash('photo-1517248135467-4c7edcad34c4', 1400);
const DRIVER_BG = helpers.unsplash('photo-1532635241-17e820acc59f', 1400);

const HOW_IT_WORKS = [
  {
    icon: 'search',
    title: 'Chọn món',
    desc: 'Khám phá hơn 2.000 quán ăn gần bạn — được tuyển chọn kỹ lưỡng, không tài trợ.',
  },
  {
    icon: 'cart',
    title: 'Đặt món',
    desc: 'Thanh toán linh hoạt: thẻ, ví điện tử, hoặc tiền mặt. Áp dụng mã giảm giá khi thanh toán.',
  },
  {
    icon: 'bike',
    title: 'Thưởng thức',
    desc: 'Theo dõi tài xế tận cửa. Thời gian giao hàng trung bình là 22 phút.',
  },
];

const STATS = [
  { value: '2,140', label: 'Quán ăn' },
  { value: '22 phút', label: 'Thời gian giao trung bình' },
  { value: '318', label: 'Tài xế hoạt động' },
  { value: '4.9★', label: 'Đánh giá khách hàng' },
];

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="bg-canvas">
      {/* ---- Top bar ------------------------------------------------------ */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo className="!text-on-dark" mono={false} />
          <div className="flex items-center gap-xs">
            <Link to="/app" className="hidden text-nav-link text-on-dark hover:text-on-dark-soft md:inline-flex">
              Dành cho khách hàng
            </Link>
            <Link to="/merchant" className="hidden text-nav-link text-on-dark hover:text-on-dark-soft md:inline-flex">
              Dành cho quán ăn
            </Link>
            <Link to="/driver" className="hidden text-nav-link text-on-dark hover:text-on-dark-soft md:inline-flex">
              Dành cho tài xế
            </Link>
            <Button
              variant="secondary"
              size="sm"
              className="!bg-canvas/15 !border-canvas/30 !text-on-dark backdrop-blur hover:!bg-canvas/20"
              onClick={() => nav('/app')}
            >
              Đăng nhập
            </Button>
            <Button size="sm" onClick={() => nav('/app')}>
              Đặt ngay
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

        <div className="container-page flex min-h-[560px] flex-col justify-center pt-28 pb-xxl text-center text-on-dark md:min-h-[680px] md:pt-32 lg:min-h-[720px]">
          <Badge tone="dark" className="mx-auto mb-base !bg-canvas/15 !text-on-dark backdrop-blur">
            Giao hàng trong 22 phút · Brooklyn
          </Badge>
          <h1 className="mx-auto max-w-3xl text-display-lg md:text-display-xl lg:text-display-mega">
            Đói bụng? Đặt món ngay.
          </h1>
          <p className="mx-auto mt-md max-w-xl text-body-md text-on-dark-soft">
            Thức ăn ngon từ những quán ăn thực thụ, giao nóng tận cửa. Hãy chọn món bạn thèm và chúng tôi sẽ lo phần còn lại.
          </p>

          {/* Inline address + go */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              nav('/app');
            }}
            className="mx-auto mt-lg flex w-full max-w-xl items-stretch gap-1 rounded-lg border border-hairline-strong bg-surface-card p-1 shadow-soft-lg"
          >
            <div className="flex flex-1 items-center gap-2 px-sm">
              <Icon name="pin" size={16} className="text-body" />
              <input
                defaultValue="120 Wythe Ave, Brooklyn"
                placeholder="Nhập địa chỉ giao hàng"
                className="h-11 w-full bg-transparent text-body-md text-ink placeholder:text-muted outline-none"
              />
            </div>
            <Button type="submit" size="lg" className="px-md">
              Tìm quán ăn
            </Button>
          </form>

          {/* Trust line */}
          <div className="mx-auto mt-base flex max-w-2xl flex-wrap items-center justify-center gap-base text-caption text-on-dark-soft">
            <span className="inline-flex items-center gap-1">
              <Icon name="check" size={12} className="text-success" /> Miễn phí giao hàng lần đầu
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="check" size={12} className="text-success" /> Theo dõi trực tiếp
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="check" size={12} className="text-success" /> Hỗ trợ 24/7
            </span>
          </div>

          {/* Quick city pills */}
          <div className="mx-auto mt-lg flex flex-wrap items-center justify-center gap-1.5">
            {['Brooklyn', 'Manhattan', 'Queens', 'The Bronx', 'Jersey City'].map((c) => (
              <button
                key={c}
                onClick={() => nav('/app')}
                className="inline-flex items-center gap-1 rounded-pill border border-canvas/30 bg-canvas/10 px-2.5 py-1 text-caption text-on-dark backdrop-blur hover:bg-canvas/20"
              >
                <Icon name="pin" size={11} />
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="pointer-events-none absolute inset-x-0 bottom-base flex justify-center text-on-dark-soft">
          <Icon name="chevronDown" size={20} className="opacity-70" />
        </div>
      </section>

      {/* ---- How it works ------------------------------------------------ */}
      <section className="container-page py-xxl md:py-section">
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
                <span className="text-display-md text-muted-soft nums">0{i + 1}</span>
              </div>
              <div className="text-title-md text-ink">{step.title}</div>
              <p className="text-body-sm text-body">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Cuisines carousel ------------------------------------------- */}
      <section className="container-page pb-xxl">
        <div className="mb-base flex items-end justify-between">
          <div>
            <div className="text-caption-uppercase text-body">Từ mọi nơi</div>
            <h2 className="text-display-md text-ink">Các món ăn bạn sẽ yêu thích</h2>
          </div>
          <Link to="/app/search" className="text-button text-text-link hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="-mx-base flex gap-base overflow-x-auto px-base pb-1 no-scrollbar md:mx-0 md:px-0">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/app/search?cat=${c.id}`}
              className="group flex w-[100px] shrink-0 flex-col items-center gap-1.5 md:w-[120px]"
            >
              <span className="relative overflow-hidden rounded-pill border border-hairline-strong bg-surface-card transition-shadow group-hover:shadow-soft">
                <Image src={c.image} alt={c.name} ratio="1" className="h-24 w-24 md:h-28 md:w-28" />
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
      <section className="container-page pb-xxl md:pb-section">
        <div className="mb-base flex items-end justify-between">
          <div>
            <div className="text-caption-uppercase text-body">Lựa chọn hàng đầu</div>
            <h2 className="text-display-sm text-ink md:text-display-md">Những quán ăn đáng thử</h2>
          </div>
          <Link to="/app" className="text-button text-text-link hover:underline">
            Mở ứng dụng →
          </Link>
        </div>
        <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-4">
          {restaurants.slice(0, 4).map((r) => (
            <Link
              key={r.id}
              to={`/app/restaurant/${r.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
            >
              <div className="relative">
                <Image
                  src={r.banner}
                  alt={r.name}
                  ratio="16/10"
                  className="transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute -bottom-3 right-base">
                  <Avatar src={r.logo} name={r.name} square size="md" className="ring-2 ring-canvas" />
                </div>
              </div>
              <div className="p-base pt-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-title-md text-ink leading-tight">{r.name}</div>
                  <span className="inline-flex items-center gap-0.5 text-body-sm text-ink">
                    <Icon name="starFilled" size={12} />
                    <span className="nums">{r.rating.toFixed(1)}</span>
                  </span>
                </div>
                <div className="mt-1 text-caption text-body">
                  {r.cuisine} · <span className="nums">{r.eta}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Partner with us --------------------------------------------- */}
      <section className="container-page pb-section">
        <div className="grid overflow-hidden rounded-lg border border-hairline-strong md:grid-cols-2">
          <div className="relative isolate min-h-[360px] overflow-hidden">
            <Image src={MERCHANT_BG} alt="Restaurant kitchen" ratio="4/3" className="absolute inset-0 h-full w-full" />
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
              <Button onClick={() => nav('/merchant')} trailingIcon="arrowRight">
                Mở cổng quản lý
              </Button>
              <Button variant="secondary" onClick={() => nav('/merchant')}>
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Ride with us ------------------------------------------------ */}
      <section className="container-page pb-section">
        <div className="grid overflow-hidden rounded-lg border border-hairline-strong md:grid-cols-2">
          <div className="order-2 flex flex-col justify-center bg-surface-card p-xl md:order-1 md:p-xxl">
            <h3 className="text-display-md text-ink">Lái xe cùng chúng tôi</h3>
            <p className="mt-xs text-body-md text-body">
              Kiếm tiền theo lịch trình, thành phố và tốc độ của bạn. Rút tiền hàng ngày — không cần đợi đến thứ Sáu.
            </p>
            <ul className="mt-base space-y-2 text-body-sm text-ink">
              <PartnerPoint>Trung bình <span className="nums">$18.40</span>/giờ trong giờ cao điểm</PartnerPoint>
              <PartnerPoint>Thanh toán hàng ngày — rút tiền bất cứ lúc nào bạn muốn</PartnerPoint>
              <PartnerPoint>Xe đạp, xe máy, hay ô tô — sự lựa chọn là của bạn</PartnerPoint>
              <PartnerPoint>Điều hướng và trò chuyện với khách hàng trong ứng dụng</PartnerPoint>
            </ul>
            <div className="mt-lg flex flex-wrap items-center gap-xs">
              <Button onClick={() => nav('/driver')} trailingIcon="arrowRight">
                Mở ứng dụng tài xế
              </Button>
              <Button variant="secondary" onClick={() => nav('/driver')}>
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
          <div className="relative isolate order-1 min-h-[360px] overflow-hidden md:order-2">
            <Image src={DRIVER_BG} alt="Delivery rider" ratio="4/3" className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-tl from-ink/40 to-transparent" />
            <div className="absolute right-base top-base">
              <Badge tone="dark" className="!bg-canvas/15 !text-on-dark backdrop-blur">Dành cho tài xế</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* ---- By the numbers ---------------------------------------------- */}
      <section className="border-y border-hairline bg-canvas-soft">
        <div className="container-page grid grid-cols-2 gap-base py-xl md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <div className="text-display-md text-ink nums">{s.value}</div>
              <div className="text-caption-uppercase text-body">{s.label}</div>
            </div>
          ))}
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
          <Button size="lg" onClick={() => nav('/app')} trailingIcon="arrowRight">
            Đặt món ngay
          </Button>
          <Button size="lg" variant="secondary" onClick={() => nav('/app/search')}>
            Khám phá quán ăn
          </Button>
        </div>
        <div className="mt-md inline-flex items-center gap-2 text-caption text-body">
          <Icon name="apple" size={14} /> Có sẵn trên iOS &nbsp;·&nbsp;
          <Icon name="google" size={14} /> Có sẵn trên Android
        </div>
      </section>

      {/* ---- Footer ------------------------------------------------------ */}
      <footer className="border-t border-hairline bg-canvas">
        <div className="container-page py-12">
          <div className="grid grid-cols-2 gap-base md:grid-cols-5">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-xs text-body-sm text-body max-w-xs">
                Đồ ăn thực, giao hàng nhanh. Xây dựng bằng sự tận tâm.
              </p>
            </div>
            <FooterGroup title="Thưởng thức" links={['Quán ăn', 'Danh mục', 'Khuyến mãi', 'Thẻ quà tặng']} />
            <FooterGroup title="Đối tác" links={['Trở thành quán ăn', 'Lái xe cùng NomNom', 'Tiếp thị liên kết']} />
            <FooterGroup title="Công ty" links={['Giới thiệu', 'Báo chí', 'Tuyển dụng', 'Blog']} />
            <FooterGroup title="Hỗ trợ" links={['Trung tâm trợ giúp', 'Liên hệ', 'Đồ thất lạc', 'Trạng thái']} />
          </div>
          <div className="mt-12 flex flex-col gap-xs border-t border-hairline pt-base md:flex-row md:items-center md:justify-between">
            <div className="text-body-sm text-body">
              © {new Date().getFullYear()} NomNom. Bản thử nghiệm — chỉ có frontend.
            </div>
            <div className="flex items-center gap-base text-body-sm">
              <Link to="#" className="text-body hover:text-ink">Điều khoản</Link>
              <Link to="#" className="text-body hover:text-ink">Bảo mật</Link>
              <Link to="#" className="text-body hover:text-ink">Cookie</Link>
              <Link to="/admin" className="text-body hover:text-ink">Quản trị</Link>
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
        {links.map((l) => (
          <li key={l}>
            <Link to="#" className="text-body-sm text-body hover:text-ink">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
