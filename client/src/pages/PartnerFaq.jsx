import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';

const MERCHANT_FAQ = [
  {
    q: 'Có phí đăng ký hoặc cam kết hợp đồng dài hạn không?',
    a: 'Không phí thiết lập. Bạn có thể dừng hợp tác theo chính sách đã thông báo; không bắt buộc ký hợp đồng nhiều năm.',
  },
  {
    q: 'Hoa hồng và thanh toán được tính thế nào?',
    a: 'Phí nền tảng theo từng đơn đã ghi nhận trong báo cáo. Doanh thu được đối soát và chuyển khoản định kỳ; chi tiết xem trong bảng điều khiển đối tác.',
  },
  {
    q: 'Quán cần chuẩn bị gì về mặt bằng và thiết bị?',
    a: 'Máy tính bảng hoặc màn hình để nhận đơn, máy in biên lai (tùy khu vực) và quy trình đóng gói ổn định. Đội onboarding hướng dẫn trong ngày đầu tiên.',
  },
  {
    q: 'Ai hỗ trợ khi có sự cố đơn hoặc khiếu nại?',
    a: 'Kênh hỗ trợ đối tác hoạt động trong giờ kinh doanh chính; có hotline ưu tiên cho quán đang mở cửa.',
  },
];

const DRIVER_FAQ = [
  {
    q: 'Điều kiện tham gia và giấy tờ cần có?',
    a: 'Đủ tuổi theo quy định, giấy phép lái xe phù hợp phương tiện (nếu có), và hồ sơ định danh theo hướng dẫn trong ứng dụng tài xế.',
  },
  {
    q: 'Thu nhập và rút tiền ra sao?',
    a: 'Thu nhập gồm phí giao và phụ phí theo từng đơn. Số dư có thể rút theo lịch đã công bố; không bắt buộc chờ tới cuối tuần.',
  },
  {
    q: 'Có được chọn khu vực và giờ online không?',
    a: 'Bạn chủ động bật/tắt nhận việc theo lịch của mình. Một số ưu đãi giờ cao điểm có thể gợi ý khu vực để tăng đơn.',
  },
  {
    q: 'Phương tiện nào được chấp nhận?',
    a: 'Xe đạp, xe máy hoặc ô tô tùy điều kiện thành phố và loại hàng. Chi tiết cập nhật trong màn hình đăng ký tài xế.',
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
        <p className="text-caption-uppercase text-body">Hỏi & đáp</p>
        <h1 className="mt-1 text-display-md text-ink md:text-display-lg">Dành cho đối tác NomNom</h1>
        <p className="mt-sm max-w-2xl text-body-md text-body">
          Giải đáp nhanh về hợp tác quán ăn và chương trình tài xế. Cần hỗ trợ riêng, hãy liên hệ qua mục cuối trang
          chủ.
        </p>

        <section id="faq-quan-an" className="mt-xxl scroll-mt-20 md:scroll-mt-24">
          <h2 className="text-display-sm text-ink">Quán ăn &amp; nhà hàng</h2>
          <p className="mt-xs max-w-xl text-body-sm text-body">Onboarding, phí và vận hành hàng ngày.</p>
          <div className="mt-base flex flex-col gap-sm">
            {MERCHANT_FAQ.map((item) => (
              <FaqBlock key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </section>

        <section id="faq-tai-xe" className="mt-xxl scroll-mt-20 md:scroll-mt-24">
          <h2 className="text-display-sm text-ink">Tài xế giao hàng</h2>
          <p className="mt-xs max-w-xl text-body-sm text-body">Thu nhập, lịch làm việc và phương tiện.</p>
          <div className="mt-base flex flex-col gap-sm">
            {DRIVER_FAQ.map((item) => (
              <FaqBlock key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </section>

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
