import { Link } from 'react-router-dom';
import LegalLayout, { LegalSection } from './LegalLayout.jsx';

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Chính sách bảo mật" updatedAt="31 tháng 8, 2026">
      <LegalSection title="1. Cam kết của NomNom">
        <p>
          NomNom tôn trọng quyền riêng tư của bạn. Chính sách này giải thích dữ liệu chúng tôi thu thập
          khi bạn đặt món, quản lý tài khoản hoặc hợp tác với NomNom — và cách chúng tôi bảo vệ thông tin
          đó.
        </p>
      </LegalSection>

      <LegalSection title="2. Dữ liệu chúng tôi thu thập">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink">Tài khoản:</strong> họ tên, email, số điện thoại, ảnh đại diện
            (nếu bạn tải lên).
          </li>
          <li>
            <strong className="text-ink">Đơn hàng:</strong> món đã chọn, địa chỉ giao, ghi chú đơn, lịch
            sử đặt món và phương thức thanh toán (không lưu đầy đủ số thẻ qua cổng thanh toán).
          </li>
          <li>
            <strong className="text-ink">Địa chỉ giao hàng:</strong> tên, số điện thoại, địa chỉ chi tiết
            bạn lưu trong sổ địa chỉ.
          </li>
          <li>
            <strong className="text-ink">Vị trí:</strong> chỉ khi bạn cho phép trình duyệt — để gợi ý
            quán gần bạn và ước tính thời gian giao.
          </li>
          <li>
            <strong className="text-ink">Phiên đăng nhập:</strong> token bảo mật lưu trên thiết bị (bộ nhớ
            trình duyệt) để bạn không phải đăng nhập lại mỗi lần mở app.
          </li>
          <li>
            <strong className="text-ink">Giỏ hàng (chưa đăng nhập):</strong> lưu cục bộ trên thiết bị cho
            đến khi bạn đăng nhập và đồng bộ lên tài khoản.
          </li>
          <li>
            <strong className="text-ink">Đối tác:</strong> hồ sơ quán, giấy tờ kinh doanh, thông tin KYC
            và tài khoản ngân hàng khi bạn đăng ký quán ăn.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Chúng tôi dùng dữ liệu để làm gì?">
        <ul className="list-disc space-y-1 pl-5">
          <li>Xử lý đơn hàng, giao hàng và hỗ trợ khi có sự cố.</li>
          <li>Xác thực đăng ký, đăng nhập và phòng chống gian lận (mã OTP qua email).</li>
          <li>Gửi thông báo trạng thái đơn và cập nhật quan trọng về tài khoản.</li>
          <li>Cải thiện trải nghiệm — ví dụ gợi ý quán, tối ưu thời gian giao.</li>
          <li>Xét duyệt hồ sơ nhà hàng đối tác theo quy trình nội bộ.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Chia sẻ với ai?">
        <p>Chúng tôi chỉ chia sẻ dữ liệu cần thiết để hoàn thành đơn hoặc vận hành dịch vụ:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nhà hàng đối tác — thông tin cần để chuẩn bị và tổ chức giao món.</li>
          <li>Nhà cung cấp dịch vụ — lưu trữ ảnh, gửi email xác thực, xử lý thanh toán (khi có).</li>
          <li>Cơ quan nhà nước — khi có yêu cầu hợp pháp.</li>
        </ul>
        <p>NomNom không bán dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo của họ.</p>
      </LegalSection>

      <LegalSection title="5. Cookie và bộ nhớ cục bộ">
        <p>
          Website dùng cookie và bộ nhớ cục bộ để duy trì phiên đăng nhập, lưu giỏ hàng (khi chưa đăng
          nhập) và ghi nhớ tùy chọn cơ bản. Bạn có thể xóa dữ liệu trình duyệt bất cứ lúc nào; một số
          tính năng có thể cần đăng nhập lại.
        </p>
      </LegalSection>

      <LegalSection title="6. Bảo mật">
        <p>
          Chúng tôi mã hóa kết nối (HTTPS), băm mật khẩu và phân quyền truy cập nội bộ. Không có hệ
          thống nào an toàn tuyệt đối — nếu xảy ra sự cố nghiêm trọng, chúng tôi sẽ thông báo theo quy
          định pháp luật.
        </p>
      </LegalSection>

      <LegalSection title="7. Lưu trữ bao lâu?">
        <p>
          Dữ liệu được giữ trong thời gian cần cho mục đích đã nêu hoặc theo yêu cầu pháp luật (hóa đơn,
          tranh chấp). Bạn có thể yêu cầu xóa tài khoản qua hỗ trợ; một số bản ghi có thể được giữ ở
          dạng ẩn danh hoặc theo nghĩa vụ lưu trữ.
        </p>
      </LegalSection>

      <LegalSection title="8. Quyền của bạn">
        <ul className="list-disc space-y-1 pl-5">
          <li>Xem và chỉnh sửa hồ sơ trong ứng dụng.</li>
          <li>Đổi mật khẩu và đăng xuất mọi thiết bị trong phần cài đặt.</li>
          <li>Yêu cầu xóa tài khoản hoặc hạn chế xử lý dữ liệu qua email hỗ trợ.</li>
          <li>Khiếu nại đến cơ quan bảo vệ dữ liệu có thẩm quyền nếu cho rằng quyền bị vi phạm.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Trẻ em">
        <p>
          Dịch vụ không hướng tới người dưới 18 tuổi. Chúng tôi không cố ý thu thập dữ liệu trẻ em.
        </p>
      </LegalSection>

      <LegalSection title="10. Cập nhật chính sách">
        <p>
          Chính sách có thể được sửa đổi. Ngày cập nhật hiển thị ở đầu trang. Thay đổi quan trọng có thể
          được thông báo qua email hoặc thông báo trong app. Xem thêm{' '}
          <Link to="/terms-of-service" className="text-text-link hover:underline">
            Điều khoản sử dụng
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
