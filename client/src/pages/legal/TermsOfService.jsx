import { Link } from 'react-router-dom';
import LegalLayout, { LegalSection } from './LegalLayout.jsx';

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Điều khoản sử dụng" updatedAt="31 tháng 8, 2026">
      <LegalSection title="1. NomNom là gì?">
        <p>
          NomNom là nền tảng đặt món giao hàng, kết nối bạn với các nhà hàng đối tác.
          Khi dùng website hoặc ứng dụng NomNom (“Dịch vụ”), bạn đồng ý với các điều khoản dưới đây và{' '}
          <Link to="/privacy-policy" className="text-text-link hover:underline">
            Chính sách bảo mật
          </Link>{' '}
          của chúng tôi.
        </p>
        <p>
          NomNom không tự nấu món. Mỗi đơn hàng do nhà hàng đối tác chuẩn bị và tự tổ chức giao hàng
          hoặc thuê đơn vị vận chuyển bên ngoài. Chúng tôi hỗ trợ theo dõi đơn và xử lý khiếu nại.
        </p>
      </LegalSection>

      <LegalSection title="2. Ai được dùng NomNom?">
        <p>
          Dịch vụ dành cho người từ 18 tuổi trở lên (hoặc có sự đồng ý của người giám hộ hợp pháp).
          Khách hàng đăng ký bằng email và mật khẩu. Chủ nhà hàng có luồng đăng ký riêng và được
          NomNom xét duyệt trước khi vận hành.
        </p>
      </LegalSection>

      <LegalSection title="3. Tài khoản của bạn">
        <ul className="list-disc space-y-1 pl-5">
          <li>Bạn chịu trách nhiệm bảo mật email, mật khẩu và mọi hoạt động trên tài khoản.</li>
          <li>Thông tin đăng ký cần chính xác để giao hàng và liên hệ khi có sự cố đơn.</li>
          <li>
            NomNom có thể tạm khóa hoặc chấm dứt tài khoản nếu phát hiện gian lận, lạm dụng khuyến mãi
            hoặc vi phạm điều khoản.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Đặt món và thanh toán">
        <p>
          Giá hiển thị trước khi bạn xác nhận gồm món ăn, phí giao hàng và các khoản phụ thu (nếu có).
          Đơn chỉ được coi là hoàn tất khi hệ thống gửi xác nhận — ví dụ mã đơn trên màn hình thành
          công.
        </p>
        <p>
          NomNom hỗ trợ thanh toán khi nhận hàng (COD) và VNPay. Giao dịch online chỉ được xác nhận
          khi cổng thanh toán trả kết quả hợp lệ.
        </p>
        <p>
          Bạn có thể đặt món khi chưa đăng nhập (giỏ lưu trên thiết bị); để hoàn tất đơn cần đăng nhập
          hoặc tạo tài khoản khách hàng.
        </p>
      </LegalSection>

      <LegalSection title="5. Giao hàng, hủy đơn và hoàn tiền">
        <p>
          Thời gian giao là ước tính — có thể thay đổi theo thời tiết, giao thông, tải đơn của quán
          hoặc đơn vị vận chuyển bên ngoài. Bạn theo dõi trạng thái đơn trong ứng dụng.
        </p>
        <p>
          Hủy đơn và hoàn tiền (nếu áp dụng) theo chính sách từng thời điểm và phương thức thanh toán
          ban đầu. Liên hệ hỗ trợ qua email hoặc mục liên hệ trên trang chủ nếu đơn có vấn đề.
        </p>
      </LegalSection>

      <LegalSection title="6. Điều không được phép">
        <ul className="list-disc space-y-1 pl-5">
          <li>Giả mạo danh tính, lạm dụng mã giảm giá hoặc gian lận thanh toán.</li>
          <li>Quấy rối nhân viên giao hàng, nhân viên quán hoặc đội hỗ trợ NomNom.</li>
          <li>Can thiệp trái phép vào hệ thống, dữ liệu hoặc trải nghiệm người dùng khác.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Nội dung và thương hiệu">
        <p>
          Giao diện, logo và nội dung do NomNom tạo ra thuộc quyền sở hữu của NomNom hoặc bên cấp phép.
          Hình ảnh món và thông tin quán do đối tác cung cấp; bạn không được sao chép hoặc tái sử dụng
          nếu chưa được phép.
        </p>
      </LegalSection>

      <LegalSection title="8. Giới hạn trách nhiệm">
        <p>
          Trong phạm vi pháp luật cho phép, NomNom không chịu trách nhiệm cho thiệt hại gián tiếp do sự
          cố ngoài tầm kiểm soát hợp lý — bao gồm thiên tai, sự cố mạng của bên thứ ba hoặc lỗi từ
          thiết bị của bạn.
        </p>
      </LegalSection>

      <LegalSection title="9. Thay đổi điều khoản">
        <p>
          Chúng tôi có thể cập nhật điều khoản theo thời gian. Phiên bản mới có hiệu lực khi đăng tải;
          tiếp tục dùng Dịch vụ đồng nghĩa bạn chấp nhận các thay đổi quan trọng.
        </p>
      </LegalSection>

      <LegalSection title="10. Liên hệ">
        <p>
          Mọi câu hỏi về điều khoản:{' '}
          <a href="mailto:legal@nomnom.vn" className="text-text-link hover:underline">
            legal@nomnom.vn
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
