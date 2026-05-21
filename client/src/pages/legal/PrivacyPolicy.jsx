import { Link } from 'react-router-dom';
import LegalLayout, { LegalSection } from './LegalLayout.jsx';

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Chính sách bảo mật" updatedAt="21 tháng 5, 2026">
      <LegalSection title="1. Cam kết của NomNom">
        <p>
          NomNom tôn trọng quyền riêng tư của bạn. Chính sách này mô tả loại dữ liệu chúng tôi thu thập,
          mục đích sử dụng, thời gian lưu trữ và quyền của bạn khi dùng dịch vụ đặt món giao hàng.
        </p>
      </LegalSection>

      <LegalSection title="2. Dữ liệu chúng tôi thu thập">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink">Thông tin tài khoản:</strong> họ tên, email, số điện thoại, ảnh
            đại diện (nếu có).
          </li>
          <li>
            <strong className="text-ink">Đơn hàng & thanh toán:</strong> lịch sử đặt món, địa chỉ giao,
            phương thức thanh toán (không lưu đầy đủ số thẻ nếu qua cổng thanh toán).
          </li>
          <li>
            <strong className="text-ink">Vị trí:</strong> khi bạn cho phép, để gợi ý quán và ước tính thời
            gian giao.
          </li>
          <li>
            <strong className="text-ink">Thiết bị & nhật ký:</strong> loại trình duyệt, IP, thời gian truy
            cập — phục vụ bảo mật và cải thiện dịch vụ.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Mục đích sử dụng">
        <ul className="list-disc space-y-1 pl-5">
          <li>Xử lý đơn hàng, giao hàng và hỗ trợ khách hàng.</li>
          <li>Xác thực đăng nhập, phòng chống gian lận.</li>
          <li>Gửi thông báo trạng thái đơn, khuyến mãi (nếu bạn đồng ý nhận marketing).</li>
          <li>Phân tích ẩn danh để cải thiện trải nghiệm ứng dụng.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Chia sẻ với bên thứ ba">
        <p>Chúng tôi có thể chia sẻ dữ liệu cần thiết với:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nhà hàng đối tác và tài xế — để thực hiện đơn hàng.</li>
          <li>Cổng thanh toán, SMS/email — để xác minh và thông báo.</li>
          <li>Cơ quan nhà nước — khi có yêu cầu hợp pháp.</li>
        </ul>
        <p>NomNom không bán dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo của họ.</p>
      </LegalSection>

      <LegalSection title="5. Cookie và công nghệ tương tự">
        <p>
          Website/ứng dụng dùng cookie và bộ nhớ cục bộ (ví dụ lưu phiên đăng nhập). Bạn có thể xóa cookie
          trên trình duyệt; một số tính năng có thể không hoạt động đầy đủ sau khi xóa.
        </p>
      </LegalSection>

      <LegalSection title="6. Bảo mật">
        <p>
          Chúng tôi áp dụng biện pháp kỹ thuật và tổ chức phù hợp (mã hóa truyền tải, phân quyền truy cập,
          mật khẩu băm, v.v.). Không có hệ thống nào an toàn tuyệt đối; nếu xảy ra sự cố, chúng tôi sẽ
          thông báo theo quy định pháp luật khi cần.
        </p>
      </LegalSection>

      <LegalSection title="7. Thời gian lưu trữ">
        <p>
          Dữ liệu được lưu trong thời gian cần thiết cho mục đích đã nêu hoặc theo yêu cầu pháp luật (ví
          dụ hóa đơn, tranh chấp). Bạn có thể yêu cầu xóa tài khoản; một số dữ liệu có thể được giữ lại
          ở dạng ẩn danh hoặc theo nghĩa vụ lưu trữ.
        </p>
      </LegalSection>

      <LegalSection title="8. Quyền của bạn">
        <ul className="list-disc space-y-1 pl-5">
          <li>Truy cập, chỉnh sửa hồ sơ trong ứng dụng.</li>
          <li>Rút consent marketing bất cứ lúc nào.</li>
          <li>Yêu cầu xóa tài khoản hoặc hạn chế xử lý dữ liệu qua hỗ trợ.</li>
          <li>Khiếu nại đến cơ quan bảo vệ dữ liệu có thẩm quyền nếu cho rằng quyền bị vi phạm.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Trẻ em">
        <p>Dịch vụ không hướng tới người dưới 18 tuổi. Chúng tôi không cố ý thu thập dữ liệu trẻ em.</p>
      </LegalSection>

      <LegalSection title="10. Cập nhật chính sách">
        <p>
          Chính sách có thể được sửa đổi. Ngày cập nhật hiển thị ở đầu trang. Thay đổi quan trọng có thể
          được thông báo qua email hoặc thông báo trong app. Xem thêm{' '}
          <Link to="/dieu-khoan-su-dung" className="text-text-link hover:underline">
            Điều khoản sử dụng
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
