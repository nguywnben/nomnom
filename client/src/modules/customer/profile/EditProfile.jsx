import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Avatar from '../../../components/Avatar.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import ProfileSubHeader from './ProfileSubHeader.jsx';

// UC-G05 — Cập nhật hồ sơ cá nhân (avatar, tên, email, SĐT).
// Demo only — values live in component state and surface as a toast on save.
export default function EditProfile() {
  const nav = useNavigate();
  const { currentCustomer, pushToast, authedRoles, user } = useApp();

  const [name, setName] = useState(currentCustomer?.name ?? '');
  const [email, setEmail] = useState(currentCustomer?.email ?? '');
  const [phone, setPhone] = useState(currentCustomer?.phone ?? '');
  const [bio, setBio] = useState('');

  const onSave = (e) => {
    e.preventDefault();
    pushToast({
      kind: 'success',
      title: 'Đã lưu hồ sơ',
      message: 'Thay đổi của bạn đã được cập nhật.',
    });
    nav('/app/profile');
  };

  if (!user) {
    return (
      <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
        <ProfileSubHeader title="Chỉnh sửa hồ sơ" />
        <Card padded>
          <div className="text-title-md text-ink">Cần đăng nhập</div>
          <p className="mt-1 text-body-sm text-body">
            Đăng nhập để chỉnh sửa hồ sơ cá nhân của bạn.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSave}
      className="flex flex-col gap-base p-base md:container-page md:py-xl"
    >
      <ProfileSubHeader title="Chỉnh sửa hồ sơ" />

      {/* Avatar block */}
      <Card padded className="flex items-center gap-base">
        <div className="relative">
          <Avatar src={currentCustomer.avatar} name={name} size="xl" />
          <button
            type="button"
            aria-label="Đổi ảnh đại diện"
            onClick={() =>
              pushToast({ kind: 'info', title: 'Đổi ảnh đại diện', message: 'Tính năng tải ảnh sẽ sớm có mặt.' })
            }
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-hairline-strong bg-canvas text-ink shadow-soft hover:bg-canvas-soft"
          >
            <Icon name="camera" size={14} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-title-md text-ink truncate">{name}</div>
          <div className="text-caption text-body truncate">{email}</div>
          <button
            type="button"
            className="mt-1 text-button text-text-link hover:underline"
            onClick={() =>
              pushToast({ kind: 'info', title: 'Đổi ảnh đại diện', message: 'Tính năng tải ảnh sẽ sớm có mặt.' })
            }
          >
            Tải ảnh mới
          </button>
        </div>
      </Card>

      {/* Editable fields */}
      <Card padded>
        <div className="flex flex-col gap-sm">
          <Field label="Họ và tên">
            <Input
              leadingIcon="user"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field label="Email" hint="Dùng để nhận biên lai và thông báo đơn hàng.">
            <Input
              type="email"
              leadingIcon="mail"
              placeholder="ban@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="Số điện thoại" hint="Tài xế sẽ liên hệ qua số này khi giao hàng.">
            <Input
              leadingIcon="phone"
              placeholder="+84 ..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Field>

          <Field label="Giới thiệu ngắn (tuỳ chọn)">
            <Input
              leadingIcon="edit"
              placeholder="Vài dòng về bạn…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Bảo mật */}
      <Card padded>
        <div className="text-caption-uppercase text-body mb-sm">Bảo mật</div>
        <button
          type="button"
          onClick={() =>
            pushToast({ kind: 'info', title: 'Đổi mật khẩu', message: 'Email khôi phục đã được gửi.' })
          }
          className="flex w-full items-center gap-sm rounded-md border border-hairline-strong bg-surface-card p-sm text-left hover:bg-canvas-soft"
        >
          <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-strong text-ink">
            <Icon name="shield" size={16} />
          </span>
          <span className="flex-1">
            <span className="block text-body-sm font-semibold text-ink">Đổi mật khẩu</span>
            <span className="text-caption text-body">
              Gửi liên kết đặt lại mật khẩu đến email của bạn.
            </span>
          </span>
          <Icon name="chevronRight" size={14} className="text-body" />
        </button>
      </Card>

      {/* Action bar */}
      <div className="flex items-center justify-end gap-xs">
        <Button variant="secondary" type="button" onClick={() => nav('/app/profile')}>
          Hủy
        </Button>
        <Button type="submit">Lưu thay đổi</Button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-caption-uppercase text-body">{label}</span>
      {children}
      {hint && <span className="text-caption text-body">{hint}</span>}
    </label>
  );
}
