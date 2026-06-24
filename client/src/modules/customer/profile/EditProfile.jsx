import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Avatar from '../../../components/Avatar.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { updateMeProfile } from '../../../lib/api.js';
import { uploadFile } from '../../../lib/upload.js';
import ProfileSubHeader from './ProfileSubHeader.jsx';

export default function EditProfile() {
  const nav = useNavigate();
  const { user, currentCustomer, pushToast, updateUser } = useApp();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    const src = currentCustomer ?? user;
    setName(src.name ?? user.fullName);
    setEmail(src.email ?? user.email ?? '');
    setPhone(src.phone ?? user.phone ?? '');
    setAvatarUrl(src.avatar ?? user.avatarUrl ?? '');
  }, [user, currentCustomer]);

  const onAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { url } = await uploadFile(file, 'avatar');
      setAvatarUrl(url);
      pushToast({
        kind: 'success',
        title: 'Đã tải ảnh',
        message: 'Nhấn "Lưu thay đổi" để cập nhật avatar.',
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không tải được ảnh',
        message: err.message ?? 'Vui lòng thử lại.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      pushToast({ kind: 'error', title: 'Thiếu họ tên', message: 'Vui lòng nhập họ và tên.' });
      return;
    }
    if (!trimmedPhone) {
      pushToast({ kind: 'error', title: 'Thiếu số điện thoại', message: 'Vui lòng nhập số điện thoại.' });
      return;
    }

    setSaving(true);
    try {
      const data = await updateMeProfile({
        fullName: trimmedName,
        phone: trimmedPhone,
        avatarUrl: avatarUrl || null,
      });
      updateUser(data.user);
      pushToast({
        kind: 'success',
        title: 'Đã lưu hồ sơ',
        message: 'Thông tin cá nhân đã được cập nhật.',
      });
      nav('/app/profile');
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không lưu được hồ sơ',
        message: err.message ?? 'Vui lòng thử lại sau.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <form
      onSubmit={onSave}
      className="flex flex-col gap-base p-base md:container-page md:py-xl"
    >
      <ProfileSubHeader title="Chỉnh sửa hồ sơ" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onAvatarFile}
      />

      <Card padded className="flex items-center gap-base">
        <div className="relative">
          <Avatar src={avatarUrl} name={name} size="xl" />
          <button
            type="button"
            aria-label="Đổi ảnh đại diện"
            disabled={uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-hairline-strong bg-canvas text-ink shadow-soft hover:bg-canvas-soft disabled:opacity-60"
          >
            <Icon name="camera" size={14} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-title-md text-ink truncate">{name || '—'}</div>
          <div className="text-caption text-body truncate">{email}</div>
          <button
            type="button"
            disabled={uploadingAvatar}
            className="mt-1 text-button text-text-link hover:underline disabled:opacity-60"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingAvatar ? 'Đang tải ảnh…' : 'Tải ảnh mới'}
          </button>
        </div>
      </Card>

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

          <Field label="Email" hint="Email không thể thay đổi trong phạm vi này.">
            <Input
              type="email"
              leadingIcon="mail"
              value={email}
              readOnly
              disabled
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
        </div>
      </Card>

      <div className="flex items-center justify-end gap-xs">
        <Button variant="secondary" type="button" onClick={() => nav('/app/profile')}>
          Hủy
        </Button>
        <Button type="submit" loading={saving}>
          Lưu thay đổi
        </Button>
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
