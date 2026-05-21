import { Link } from 'react-router-dom';
import LegalLayout, { LegalSection } from './LegalLayout.jsx';

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Điều khoản sử dụng" updatedAt="21 tháng 5, 2026">
      <LegalSection title="1. Giới thiệu">
        <p>
          Điều khoản sử dụng (“Điều khoản”) quy định quyền và nghĩa vụ giữa bạn và NomNom khi truy cập
          website, ứng dụng và các dịch vụ đặt món giao hàng do NomNom vận hành (“Dịch vụ”).
        </p>
        <p>
          Bằng việc tạo tài khoản, đặt đơn hoặc tiếp tục sử dụng Dịch vụ, bạn xác nhận đã đọc, hiểu và
          đồng ý bị ràng buộc bởi Điều khoản này cùng{' '}
          <Link to="/chinh-sach-bao-mat" className="text-text-link hover:underline">
            Chính sách bảo mật
          </Link>{' '}
          của chúng tôi.
        </p>
      </LegalSection>

      <LegalSection title="2. Đối tượng áp dụng">
        <p>
          Điều khoản áp dụng cho người dùng đặt món (khách hàng). Chủ nhà hàng, tài xế và quản trị viên
          có thể chịu thêm điều khoản riêng khi đăng ký đối tác.
        </p>
        <p>Bạn phải đủ 18 tuổi hoặc có sự đồng ý của người giám hộ hợp pháp để sử dụng Dịch vụ.</p>
      </LegalSection>

      <LegalSection title="3. Tài khoản">
        <ul className="list-disc space-y-1 pl-5">
          <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản.</li>
          <li>Thông tin đăng ký phải chính xác, đầy đủ và được cập nhật khi có thay đổi.</li>
          <li>NomNom có thể tạm khóa hoặc chấm dứt tài khoản nếu phát hiện gian lận, lạm dụng hoặc vi phạm Điều khoản.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Đặt hàng và thanh toán">
        <p>
          Giá hiển thị gồm món ăn, phí giao hàng và các khoản phụ thu (nếu có) trước khi bạn xác nhận
          thanh toán. Đơn hàng chỉ được coi là hoàn tất khi bạn nhận được xác nhận từ hệ thống.
        </p>
        <p>
          NomNom là nền tảng kết nối; món ăn do nhà hàng đối tác cung cấp. Chúng tôi hỗ trợ xử lý khiếu
          nại nhưng không thay thế trách nhiệm chất lượng món ăn của từng quán.
        </p>
      </LegalSection>

      <LegalSection title="5. Giao hàng, hủy đơn và hoàn tiền">
        <p>
          Thời gian giao hàng là ước tính và có thể thay đổi do thời tiết, giao thông hoặc tải đơn của
          quán/tài xế. Bạn có thể hủy đơn trong khung thời gian cho phép trên ứng dụng.
        </p>
        <p>
          Hoàn tiền (nếu có) được xử lý theo chính sách hủy/hoàn của NomNom và phương thức thanh toán
          ban đầu; thời gian ghi có phụ thuộc ngân hàng hoặc ví điện tử.
        </p>
      </LegalSection>

      <LegalSection title="6. Hành vi bị cấm">
        <ul className="list-disc space-y-1 pl-5">
          <li>Giả mạo danh tính, lạm dụng khuyến mãi hoặc gian lận thanh toán.</li>
          <li>Quấy rối tài xế, nhân viên quán hoặc nhân viên hỗ trợ NomNom.</li>
          <li>Can thiệp trái phép vào hệ thống, dữ liệu hoặc trải nghiệm người dùng khác.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Sở hữu trí tuệ">
        <p>
          Nhãn hiệu, giao diện, nội dung do NomNom sáng tạo thuộc quyền sở hữu của NomNom hoặc bên cấp
          phép. Bạn không được sao chép, phân phối lại nếu chưa có sự cho phép bằng văn bản.
        </p>
      </LegalSection>

      <LegalSection title="8. Giới hạn trách nhiệm">
        <p>
          Trong phạm vi pháp luật cho phép, NomNom không chịu trách nhiệm cho thiệt hại gián tiếp phát
          sinh từ sự cố ngoài tầm kiểm soát hợp lý (sự cố bất khả kháng, lỗi mạng của bên thứ ba, v.v.).
        </p>
      </LegalSection>

      <LegalSection title="9. Thay đổi Điều khoản">
        <p>
          Chúng tôi có thể cập nhật Điều khoản theo thời gian. Phiên bản mới có hiệu lực khi đăng tải;
          việc tiếp tục sử dụng Dịch vụ đồng nghĩa bạn chấp nhận các thay đổi quan trọng.
        </p>
      </LegalSection>

      <LegalSection title="10. Liên hệ">
        <p>
          Mọi câu hỏi về Điều khoản:{' '}
          <a href="mailto:legal@nomnom.vn" className="text-text-link hover:underline">
            legal@nomnom.vn
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
