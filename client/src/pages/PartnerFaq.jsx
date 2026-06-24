import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';

const CUSTOMER_FAQ = [
  {
    q: 'Tôi có cần tài khoản để đặt món không?',
    a: 'Bạn có thể xem quán, tìm kiếm và thêm món vào giỏ khi chưa đăng nhập. Để thanh toán và hoàn tất đơn, hãy đăng ký hoặc đăng nhập tài khoản khách hàng bằng email.',
  },
  {
    q: 'NomNom hỗ trợ thanh toán thế nào?',
    a: 'Hiện tại bạn có thể thanh toán khi nhận hàng (COD). Tổng tiền — gồm món và phí giao — được hiển thị rõ trước khi bạn xác nhận đơn.',
  },
  {
    q: 'Giỏ hàng của tôi có mất khi đóng trình duyệt không?',
    a: 'Chưa đăng nhập: giỏ lưu trên thiết bị của bạn. Đã đăng nhập: giỏ đồng bộ với tài khoản — reload trang vẫn còn món.',
  },
  {
    q: 'Làm sao theo dõi đơn sau khi đặt?',
    a: 'Sau khi đặt thành công, bạn nhận mã đơn và có thể xem lịch sử đơn trong mục Đơn hàng trên ứng dụng.',
  },
];

const MERCHANT_FAQ = [
  {
    q: 'Làm sao để đăng ký quán trên NomNom?',
    a: 'Đăng nhập tài khoản khách hàng, vào Đăng ký nhà hàng và hoàn tất 5 bước: thông tin quán, địa chỉ, giấy tờ, ngân hàng và xác nhận. Hồ sơ sẽ được NomNom xét duyệt trước khi quán xuất hiện trên app.',
  },
  {
    q: 'Có phí đăng ký hoặc hợp đồng dài hạn không?',
    a: 'Không phí thiết lập. Bạn hợp tác theo chính sách đã công bố; không bắt buộc cam kết nhiều năm.',
  },
  {
    q: 'Hoa hồng và thanh toán được tính thế nào?',
    a: 'Phí nền tảng ghi nhận theo từng đơn. Doanh thu được đối soát và chuyển khoản định kỳ; chi tiết xem trong khu vực quản lý quán sau khi được duyệt.',
  },
  {
    q: 'Quán cần chuẩn bị gì để vận hành?',
    a: 'Thiết bị nhận đơn (máy tính bảng hoặc điện thoại), quy trình đóng gói ổn định và thông tin ngân hàng để nhận thanh toán. Đội NomNom hướng dẫn trong ngày đầu sau khi duyệt.',
  },
];

const DRIVER_FAQ = [
  {
    q: 'Điều kiện để trở thành tài xế NomNom?',
    a: 'Đủ tuổi theo quy định, có giấy tờ định danh và bằng lái phù hợp phương tiện (nếu có). Hoàn tất hồ sơ KYC trong ứng dụng — NomNom sẽ xét duyệt trước khi bạn nhận đơn.',
  },
  {
    q: 'Thu nhập và rút tiền ra sao?',
    a: 'Thu nhập gồm phí giao và phụ phí theo từng đơn hoàn thành. Số dư có thể rút theo lịch đã công bố trong khu vực tài xế.',
  },
  {
    q: 'Tôi có được chọn giờ làm việc không?',
    a: 'Có. Bạn chủ động bật/tắt trạng thái nhận việc theo lịch của mình. Một số khung giờ cao điểm có thể có ưu đãi thêm.',
  },
  {
    q: 'Phương tiện nào được chấp nhận?',
    a: 'Xe máy, xe đạp hoặc ô tô tùy khu vực và loại hàng. Chi tiết cập nhật trong màn hình đăng ký tài xế.',
  },
];

function FaqBlock({ question, answer }) {
  return (
    <details className="group rounded-lg border border-hairline-strong bg-surface-card open:shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-base p-base text-left text-title-md text-ink marker:content-none [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <Icon
          name="chevronDown"
          size={18}
          className="shrink-0 text-muted-soft transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-hairline px-base pb-base pt-sm text-body-sm text-body">{answer}</div>
    </details>
  );
}

function FaqSection({ id, title, subtitle, items }) {
  return (
    <section id={id} className="scroll-mt-20 md:scroll-mt-24">
      <h2 className="text-display-sm text-ink">{title}</h2>
      <p className="mt-xs max-w-xl text-body-sm text-body">{subtitle}</p>
      <div className="mt-base flex flex-col gap-sm">
        {items.map((item) => (
          <FaqBlock key={item.q} question={item.q} answer={item.a} />
        ))}
      </div>
    </section>
  );
}

export default function PartnerFaq() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/95 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between gap-base">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-body-sm font-medium text-body hover:text-ink"
            aria-label="Về trang chủ NomNom"
          >
            <Icon name="chevronLeft" size={18} />
            Trang chủ
          </Link>
          <Link to="/" className="inline-flex shrink-0" aria-label="NomNom">
            <Logo mono />
          </Link>
        </div>
      </header>

      <main className="container-page py-xxl md:py-section">
        <p className="text-caption-uppercase text-body">Hỏi &amp; đáp</p>
        <h1 className="mt-1 text-display-md text-ink md:text-display-lg">Mọi điều bạn cần biết về NomNom</h1>
        <p className="mt-sm max-w-2xl text-body-md text-body">
          Đồ ăn thực, giao hàng nhanh — từ đặt món đến hợp tác quán và tài xế. Chưa thấy câu trả lời? Liên
          hệ đội NomNom qua mục cuối trang chủ.
        </p>

        <div className="mt-base flex flex-wrap gap-sm">
          <Button as={Link} to="/app" size="sm" trailingIcon="arrowRight">
            Đặt món ngay
          </Button>
          <Button as={Link} to="/merchant/onboarding" variant="secondary" size="sm">
            Đăng ký quán
          </Button>
          <Button as={Link} to="/driver/onboarding" variant="secondary" size="sm">
            Đăng ký tài xế
          </Button>
        </div>

        <div className="mt-xxl flex flex-col gap-xxl">
          <FaqSection
            id="faq-khach-hang"
            title="Khách hàng"
            subtitle="Tìm quán, đặt món và thanh toán trên NomNom."
            items={CUSTOMER_FAQ}
          />
          <FaqSection
            id="faq-quan-an"
            title="Quán ăn &amp; nhà hàng"
            subtitle="Onboarding, phí và vận hành hàng ngày."
            items={MERCHANT_FAQ}
          />
          <FaqSection
            id="faq-tai-xe"
            title="Tài xế giao hàng"
            subtitle="Thu nhập, lịch làm việc và phương tiện."
            items={DRIVER_FAQ}
          />
        </div>

        <div className="mt-xxl rounded-lg border border-hairline bg-canvas-soft p-base md:p-lg">
          <p className="text-caption-uppercase text-body">Pháp lý</p>
          <p className="mt-1 text-title-md text-ink">Điều khoản và quyền riêng tư</p>
          <p className="mt-xs text-body-sm text-body">
            Khi tạo tài khoản hoặc sử dụng NomNom, bạn đồng ý với điều khoản và chính sách bảo mật của
            chúng tôi.
          </p>
          <div className="mt-base flex flex-wrap gap-sm">
            <Button as={Link} to="/terms-of-service" variant="secondary" size="sm">
              Điều khoản sử dụng
            </Button>
            <Button as={Link} to="/privacy-policy" variant="secondary" size="sm">
              Chính sách bảo mật
            </Button>
          </div>
        </div>

        <p className="mt-xxl text-center text-body-sm text-body">
          <Link to={{ pathname: '/', hash: 'lien-he' }} className="font-medium text-text-link hover:underline">
            Liên hệ đội NomNom
          </Link>
          {' · '}
          <Link to="/" className="font-medium text-text-link hover:underline">
            Về trang chủ
          </Link>
        </p>
      </main>
    </div>
  );
}
