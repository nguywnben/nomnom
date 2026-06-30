import { Link } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';

// footer-light — DESIGN.md: bg canvas / text body / type body-sm / 64x48 padding
const groups = [
  {
    title: 'Thưởng thức',
    links: ['Quán ăn', 'Danh mục', 'Khuyến mãi', 'Thẻ quà tặng'],
  },
  {
    title: 'Đối tác',
    links: ['Trở thành quán ăn', 'Lái xe cùng NomNom', 'Tiếp thị liên kết'],
  },
  {
    title: 'Công ty',
    links: ['Giới thiệu', 'Báo chí', 'Tuyển dụng', 'Bền vững'],
  },
  {
    title: 'Hỗ trợ',
    links: ['Trung tâm trợ giúp', 'Liên hệ', 'Đồ thất lạc', 'Trạng thái'],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-base md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-xs text-body-sm text-body max-w-xs">
              Giao đồ ăn nhanh, rõ ràng — NomNom đồng hành mỗi ngày cùng bạn.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <div className="text-caption-uppercase text-ink mb-2">{g.title}</div>
              <ul className="space-y-1.5">
                {g.links.map((l) => (
                  <li key={l}>
                    <Link to="#" className="text-body-sm text-body hover:text-ink">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-xs border-t border-hairline pt-base md:flex-row md:items-center md:justify-between">
          <div className="text-body-sm text-body">
            © {new Date().getFullYear()} NomNom
          </div>
          <div className="flex items-center gap-base text-body-sm">
            <Link to="/terms-of-service" className="text-body hover:text-ink">
              Điều khoản
            </Link>
            <Link to="/privacy-policy" className="text-body hover:text-ink">
              Bảo mật
            </Link>
            <Link to="#" className="text-body hover:text-ink">Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
