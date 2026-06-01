import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import Image from './Image.jsx';
import { uploadFile } from '../lib/upload.js';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

export default function ImageUploader({
  value,
  onUploaded,
  folder = 'avatar',
  label = 'Chọn ảnh',
  note = 'JPG, PNG, WEBP · tối đa 5MB',
  className,
  previewRatio = '1/1',
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(value ?? '');

  useEffect(() => {
    setPreviewUrl(value ?? '');
  }, [value]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Chỉ hỗ trợ jpg, png và webp.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh phải nhỏ hơn hoặc bằng 5MB.');
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setError('');
    setPreviewUrl(tempUrl);
    setUploading(true);

    try {
      const result = await uploadFile(file, folder);
      setPreviewUrl(result.url);
      onUploaded?.(result.url, result);
    } catch (uploadError) {
      setPreviewUrl(value ?? '');
      setError(uploadError.message || 'Upload thất bại.');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(tempUrl);
    }
  }

  return (
    <div className={clsx('flex flex-col gap-sm', className)}>
      <div className="flex items-start gap-sm">
        <div className="w-24 shrink-0 overflow-hidden rounded-md border border-hairline-strong bg-surface-card md:w-28">
          <Image
            src={previewUrl}
            alt="Ảnh tải lên"
            ratio={previewRatio}
            className="w-full"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-xs pt-1">
          <div className="flex flex-wrap items-center gap-xs">
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Đang tải...' : label}
            </Button>
            {note && <span className="text-caption text-body">{note}</span>}
          </div>

          {error ? (
            <div className="flex items-center gap-1 text-caption text-error">
              <Icon name="alert" size={14} />
              <span>{error}</span>
            </div>
          ) : (
            <span className="text-caption text-body">
              Upload ảnh cho {folder.replace('-', ' ')}.
            </span>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}