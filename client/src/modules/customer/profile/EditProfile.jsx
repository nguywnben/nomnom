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
  const { currentCustomer, permittedRoles, pushToast, updateUser } = useApp();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!currentCustomer) return;
    setName(currentCustomer.name);
    setEmail(currentCustomer.email);
    setPhone(currentCustomer.phone ?? '');
    setAvatarUrl(currentCustomer.avatar ?? '');
  }, [currentCustomer]);

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
    setErrors({});
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    const newErrors = {};
    if (!trimmedName) {
      newErrors.name = 'Họ và tên không được để trống.';
    }
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!trimmedPhone) {
      newErrors.phone = 'Số điện thoại không được để trống.';
    } else if (!phoneRegex.test(trimmedPhone)) {
      newErrors.phone = 'Vui lòng nhập đúng định dạng số điện thoại.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      pushToast({
        kind: 'error',
        title: 'Lỗi nhập liệu',
        message: 'Vui lòng sửa các lỗi nhập liệu trước khi lưu.',
      });
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
      if (err.status === 409) {
        setErrors({ phone: err.message ?? 'Số điện thoại này đã được sử dụng.' });
      }
      pushToast({
        kind: 'error',
        title: 'Không lưu được hồ sơ',
        message: err.message ?? 'Vui lòng thử lại sau.',
      });
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
            Đăng nhập với tài khoản khách hàng để chỉnh sửa hồ sơ cá nhân.
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
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              required
              error={errors.name}
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
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              required
              error={errors.phone}
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
