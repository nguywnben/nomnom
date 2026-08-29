import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import Modal from '../../../components/Modal.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { changePasswordApi, logoutAllApi } from '../../../lib/api.js';
import ProfileSubHeader from './ProfileSubHeader.jsx';

export default function Settings() {
  const nav = useNavigate();
  const { pushToast, logout, user, permittedRoles } = useApp();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const closePassword = () => {
    setPasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ thông tin mật khẩu.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu mới cần có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    try {
      await changePasswordApi({ currentPassword, newPassword });
      closePassword();
      pushToast({ kind: 'success', title: 'Đã đổi mật khẩu', message: 'Mật khẩu mới có hiệu lực ngay.' });
    } catch (error) {
      setPasswordError(error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setChangingPassword(false);
    }
  };

  const logoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllApi();
      await logout({ silent: true });
      pushToast({ kind: 'success', title: 'Đã đăng xuất mọi thiết bị', message: 'Bạn có thể đăng nhập lại khi cần.' });
    } catch (error) {
      pushToast({ kind: 'error', title: 'Không thể đăng xuất mọi thiết bị', message: error.message || 'Vui lòng thử lại.' });
    } finally {
      setLoggingOutAll(false);
      setLogoutAllOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Cài đặt" />

      <Card padded>
        <div className="text-caption-uppercase text-body">Tài khoản</div>
        <div className="mt-sm flex items-center gap-sm">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-strong text-ink"><Icon name="user" size={16} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-body-sm font-semibold text-ink">{user?.fullName}</div>
            <div className="truncate text-caption text-body">{user?.email}</div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => nav('/app/profile/edit')}>Chỉnh sửa</Button>
        </div>
      </Card>

      <Card padded>
        <div className="text-caption-uppercase text-body">Bảo mật</div>
        <div className="mt-sm flex flex-col divide-y divide-hairline">
          <ActionRow icon="shield" label="Đổi mật khẩu" hint="Cập nhật mật khẩu để bảo vệ tài khoản." onClick={() => setPasswordOpen(true)} />
          {permittedRoles.customer && <ActionRow icon="bell" label="Thông báo" hint="Xem các cập nhật đơn hàng và tài khoản." onClick={() => nav('/app/notifications')} />}
        </div>
      </Card>

      <Card padded>
        <div className="text-caption-uppercase text-body">Hỗ trợ & pháp lý</div>
        <div className="mt-sm flex flex-col divide-y divide-hairline">
          <ActionRow icon="chat" label="Hỗ trợ" hint="Trò chuyện với đội ngũ NomNom." onClick={() => nav('/chat/inbox')} />
          <Link to="/terms-of-service" className="flex items-center gap-sm py-3 hover:bg-canvas-soft">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-strong text-ink"><Icon name="package" size={16} /></span>
            <span className="min-w-0 flex-1"><span className="block text-body-sm font-semibold text-ink">Điều khoản sử dụng</span><span className="block text-caption text-body">Quy định khi sử dụng NomNom.</span></span>
            <Icon name="chevronRight" size={14} className="text-body" />
          </Link>
          <Link to="/privacy-policy" className="flex items-center gap-sm py-3 hover:bg-canvas-soft">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-strong text-ink"><Icon name="shield" size={16} /></span>
            <span className="min-w-0 flex-1"><span className="block text-body-sm font-semibold text-ink">Chính sách bảo mật</span><span className="block text-caption text-body">Cách NomNom xử lý dữ liệu cá nhân.</span></span>
            <Icon name="chevronRight" size={14} className="text-body" />
          </Link>
          <div className="flex items-center gap-sm py-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-strong text-ink"><Icon name="info" size={16} /></span>
            <span className="min-w-0 flex-1"><span className="block text-body-sm font-semibold text-ink">Phiên bản</span><span className="block text-caption text-body">NomNom v1.0.0</span></span>
          </div>
        </div>
      </Card>

      <Card padded>
        <div className="text-caption-uppercase text-body">Phiên đăng nhập</div>
        <p className="mt-sm text-body-sm text-body">Đăng xuất khỏi mọi thiết bị khi bạn nghi ngờ tài khoản đang được sử dụng ở nơi khác.</p>
        <Button variant="secondary" className="mt-base" onClick={() => setLogoutAllOpen(true)}>Đăng xuất mọi thiết bị</Button>
      </Card>

      <Button
        variant="secondary"
        className="!border-[#dc2626] !bg-white !font-normal !text-[#dc2626] hover:!bg-[#fef2f2] active:!bg-[#fee2e2]"
        onClick={() => setLogoutConfirmOpen(true)}
      >
        Đăng xuất
      </Button>

      <Modal open={passwordOpen} onClose={closePassword} title="Đổi mật khẩu" footer={<><Button variant="secondary" onClick={closePassword}>Hủy</Button><Button form="change-password" type="submit" disabled={changingPassword}>{changingPassword ? 'Đang lưu...' : 'Đổi mật khẩu'}</Button></>}>
        <form id="change-password" onSubmit={changePassword} className="flex flex-col gap-sm">
          <Input type="password" placeholder="Mật khẩu hiện tại" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
          <Input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
          <Input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
          {passwordError && <p role="alert" className="text-caption text-error">{passwordError}</p>}
        </form>
      </Modal>

      <Modal open={logoutAllOpen} onClose={() => setLogoutAllOpen(false)} title="Đăng xuất mọi thiết bị" footer={<><Button variant="secondary" onClick={() => setLogoutAllOpen(false)} disabled={loggingOutAll}>Hủy</Button><Button variant="critical" onClick={logoutAll} disabled={loggingOutAll}>{loggingOutAll ? 'Đang đăng xuất...' : 'Xác nhận'}</Button></>}>
        <p className="text-body-sm text-body">Phiên hiện tại và các thiết bị khác sẽ cần đăng nhập lại để tiếp tục sử dụng NomNom.</p>
      </Modal>

      <Modal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Xác nhận đăng xuất"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLogoutConfirmOpen(false)}>
              Ở lại
            </Button>
            <Button
              variant="critical"
              onClick={async () => {
                setLogoutConfirmOpen(false);
                await logout();
              }}
            >
              Đăng xuất
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn có chắc chắn muốn đăng xuất khỏi tài khoản NomNom không?
        </p>
      </Modal>
    </div>
  );
}

function ActionRow({ icon, label, hint, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-sm py-3 text-left hover:bg-canvas-soft">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-strong text-ink"><Icon name={icon} size={16} /></span>
      <span className="min-w-0 flex-1"><span className="block text-body-sm font-semibold text-ink">{label}</span><span className="block text-caption text-body">{hint}</span></span>
      <Icon name="chevronRight" size={14} className="text-body" />
    </button>
  );
}