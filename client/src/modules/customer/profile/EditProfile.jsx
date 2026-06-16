import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Avatar from '../../../components/Avatar.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { updateMeApi, uploadImageApi } from '../../../lib/api.js';
import ProfileSubHeader from './ProfileSubHeader.jsx';

export default function EditProfile() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);
  const { currentCustomer, pushToast, permittedRoles, updateUser } = useApp();

  const [name, setName] = useState(currentCustomer?.name ?? '');
  const [phone, setPhone] = useState(currentCustomer?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(currentCustomer?.avatar ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(currentCustomer?.name ?? '');
    setPhone(currentCustomer?.phone ?? '');
    setAvatarUrl(currentCustomer?.avatar ?? '');
  }, [currentCustomer?.name, currentCustomer?.phone, currentCustomer?.avatar]);

  const onPickAvatar = () => {
    fileInputRef.current?.click();
  };

  const onAvatarSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setError('');
      const data = await uploadImageApi(file, 'avatars');
      setAvatarUrl(data.url);
      pushToast({ kind: 'success', title: 'Đã tải ảnh đại diện', message: 'Ảnh mới đã sẵn sàng để lưu.' });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const data = await updateMeApi({
        fullName: name.trim(),
        phone: phone.trim() || null,
        avatarUrl: avatarUrl || null,
      });
      updateUser(data.user);
      pushToast({ kind: 'success', title: 'Đã lưu hồ sơ', message: 'Thay đổi của bạn đã được cập nhật.' });
      nav('/app/profile');
    } catch (err) {
      setError(err.message);
      pushToast({ kind: 'error', title: 'Không thể lưu hồ sơ', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!permittedRoles.customer) {
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
    <form onSubmit={onSave} className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Chỉnh sửa hồ sơ" />

      <Card padded className="flex items-center gap-base">
        <div className="relative">
          <Avatar src={avatarUrl} name={name} size="xl" />
          <button
            type="button"
            aria-label="Đổi ảnh đại diện"
            onClick={onPickAvatar}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-hairline-strong bg-canvas text-ink shadow-soft hover:bg-canvas-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name={uploadingAvatar ? 'spinner' : 'camera'} size={14} className={uploadingAvatar ? 'animate-spin' : ''} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onAvatarSelected}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-title-md text-ink truncate">{name}</div>
          <div className="text-caption text-body truncate">{currentCustomer?.email ?? ''}</div>
          <button
            type="button"
            className="mt-1 text-button text-text-link hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onPickAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? 'Đang tải ảnh...' : 'Tải ảnh mới'}
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

          <Field label="Email">
            <div className="flex h-12 items-center rounded-md border border-hairline-strong bg-surface-card px-base text-body text-muted">
              {currentCustomer?.email || '—'}
            </div>
          </Field>

          <Field label="Số điện thoại" hint="Dùng để liên hệ khi giao hàng.">
            <Input
              leadingIcon="phone"
              placeholder="+84 ..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
        </div>
        {error && <p className="mt-sm text-caption text-error">{error}</p>}
      </Card>

      <div className="flex items-center justify-end gap-xs">
        <Button variant="secondary" type="button" onClick={() => nav('/app/profile')}>
          Hủy
        </Button>
        <Button type="submit" loading={saving} disabled={saving || uploadingAvatar}>
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
