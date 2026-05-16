import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function MerchantPartnerContact() {
  const { pushToast } = useApp();
  const [restaurant, setRestaurant] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!restaurant.trim() || !name.trim() || !email.trim()) {
      pushToast({
        kind: 'error',
        title: 'Thiếu thông tin',
        message: 'Vui lòng điền tên quán, người liên hệ và email.',
      });
      return;
    }
    pushToast({
      kind: 'success',
      title: 'Đã ghi nhận yêu cầu',
      message: 'Đội đối tác sẽ phản hồi qua email trong 1–2 ngày làm việc.',
    });
    setRestaurant('');
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/95 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between gap-base">
          <Link
            to={{ pathname: '/', hash: 'doi-tac' }}
            className="inline-flex items-center gap-1 text-body-sm font-medium text-body hover:text-ink"
          >
            <Icon name="chevronLeft" size={18} />
            Hợp tác
          </Link>
          <Link to="/" className="inline-flex shrink-0" aria-label="NomNom">
            <Logo mono />
          </Link>
        </div>
      </header>

      <main className="container-page py-xxl md:py-section">
        <Badge tone="outline" className="mb-base">
          Dành cho quán ăn
        </Badge>
        <h1 className="text-display-md text-ink md:text-display-lg">Liên hệ hợp tác</h1>
        <p className="mt-sm max-w-2xl text-body-md text-body">
          Cho chúng tôi biết tên quán và cách liên lạc — đội onboarding NomNom sẽ gọi hoặc gửi email để trao đổi phí,
          thiết bị và thời gian lên sóng.
        </p>

        <div className="mt-xxl grid gap-xxl lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-hairline-strong bg-surface-card p-base md:p-xl"
            noValidate
          >
            <div className="grid gap-base sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-caption-uppercase text-body">Tên quán / thương hiệu</span>
                <input
                  type="text"
                  name="restaurant"
                  value={restaurant}
                  onChange={(ev) => setRestaurant(ev.target.value)}
                  autoComplete="organization"
                  className="mt-1.5 w-full rounded-md border border-hairline-strong bg-canvas px-base py-2.5 text-body-md text-ink outline-none ring-0 transition-colors placeholder:text-muted focus:border-ink/30"
                  placeholder="Ví dụ: Phở Hà Nội — Chi nhánh 1"
                />
              </label>
              <label className="block">
                <span className="text-caption-uppercase text-body">Người liên hệ</span>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-md border border-hairline-strong bg-canvas px-base py-2.5 text-body-md text-ink outline-none placeholder:text-muted focus:border-ink/30"
                  placeholder="Họ và tên"
                />
              </label>
              <label className="block">
                <span className="text-caption-uppercase text-body">Số điện thoại</span>
                <input
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={(ev) => setPhone(ev.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  className="mt-1.5 w-full rounded-md border border-hairline-strong bg-canvas px-base py-2.5 text-body-md text-ink outline-none placeholder:text-muted focus:border-ink/30"
                  placeholder="09xx xxx xxx"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-caption-uppercase text-body">Email</span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-md border border-hairline-strong bg-canvas px-base py-2.5 text-body-md text-ink outline-none placeholder:text-muted focus:border-ink/30"
                  placeholder="banhang@quan.com"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-caption-uppercase text-body">Nội dung (tuỳ chọn)</span>
                <textarea
                  name="message"
                  value={message}
                  onChange={(ev) => setMessage(ev.target.value)}
                  rows={4}
                  className="mt-1.5 w-full resize-y rounded-md border border-hairline-strong bg-canvas px-base py-2.5 text-body-md text-ink outline-none placeholder:text-muted focus:border-ink/30"
                  placeholder="Loại hình quán, địa chỉ dự kiến, giờ mở cửa…"
                />
              </label>
            </div>
            <div className="mt-lg flex flex-wrap items-center gap-xs">
              <Button type="submit" trailingIcon="arrowRight">
                Gửi yêu cầu
              </Button>
              <Button as={Link} to="/faq#faq-quan-an" variant="secondary">
                Câu hỏi thường gặp
              </Button>
            </div>
            <p className="mt-base text-caption text-body">
              Gửi biểu mẫu là bản demo giao diện — không gửi dữ liệu ra máy chủ.
            </p>
          </form>

          <aside className="space-y-base rounded-lg border border-hairline-strong bg-canvas-soft p-base md:p-lg">
            <div className="text-caption-uppercase text-ink">Liên hệ trực tiếp</div>
            <a
              href="mailto:doi-tac@nomnom.example?subject=H%E1%BB%A3p%20t%C3%A1c%20qu%C3%A1n%20%C4%83n"
              className="flex items-start gap-3 rounded-md p-sm text-body-sm text-ink transition-colors hover:bg-canvas"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-card border border-hairline-strong">
                <Icon name="mail" size={16} />
              </span>
              <span>
                <span className="font-medium">Email đối tác</span>
                <br />
                <span className="text-text-link">doi-tac@nomnom.example</span>
              </span>
            </a>
            <a
              href="tel:+842812345678"
              className="flex items-start gap-3 rounded-md p-sm text-body-sm text-ink transition-colors hover:bg-canvas"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-card border border-hairline-strong">
                <Icon name="phone" size={16} />
              </span>
              <span>
                <span className="font-medium">Hotline</span>
                <br />
                <span className="text-text-link nums">028 1234 5678</span>
                <span className="text-body"> · 9:00–18:00</span>
              </span>
            </a>
            <Link
              to="/faq#faq-quan-an"
              className="flex items-center gap-2 text-body-sm font-medium text-text-link hover:underline"
            >
              Xem Hỏi & đáp cho quán
              <Icon name="chevronRight" size={16} />
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
