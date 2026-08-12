import { useState, useRef } from 'react';
import clsx from 'clsx';
import { uploadFile } from '../lib/upload.js';
import { useApp } from '../context/AppContext.jsx';
import Icon from './Icon.jsx';

/**
 * ImageUploader component for general image uploads.
 * 
 * @param {Object} props
 * @param {string} props.value - Current image URL.
 * @param {Function} props.onUploaded - Callback called when a file has uploaded successfully: (url) => void.
 * @param {string} props.folder - Target folder on Cloudinary (avatar | restaurant | menu | cuisine | driver-kyc | review). Default is 'avatar'.
 * @param {string} props.shape - Shape of the preview box ('circle' | 'rect'). Default is 'rect'.
 * @param {string} props.className - Extra wrapper CSS class.
 * @param {string} props.aspectRatio - Aspect ratio for the uploader card (e.g. 'square', 'video', 'aspect-video', default is 'square').
 */
export default function ImageUploader({
  value,
  onUploaded,
  folder = 'avatar',
  shape = 'rect',
  className,
  aspectRatio = 'square',
}) {
  const { pushToast } = useApp();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUpload(file);
  };

  const processUpload = async (file) => {
    // Client-side validations
    if (!allowedTypes.includes(file.type)) {
      pushToast({
        kind: 'error',
        title: 'Định dạng file không hỗ trợ',
        message: 'Chỉ hỗ trợ file ảnh jpg, png và webp.',
        duration: 3500,
      });
      return;
    }

    if (file.size > maxSizeBytes) {
      pushToast({
        kind: 'error',
        title: 'File quá dung lượng',
        message: 'Vui lòng chọn ảnh nhỏ hơn 5MB.',
        duration: 3500,
      });
      return;
    }

    setUploading(true);
    try {
      const response = await uploadFile(file, folder);
      if (response && response.url) {
        if (onUploaded) {
          onUploaded(response.url);
        }
        pushToast({
          kind: 'success',
          title: 'Tải ảnh lên thành công',
          duration: 2000,
        });
      } else {
        throw new Error('Không nhận được URL ảnh từ server.');
      }
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      pushToast({
        kind: 'error',
        title: 'Tải ảnh lên thất bại',
        message: error.message || 'Đã có lỗi xảy ra trong quá trình upload.',
        duration: 4000,
      });
    } finally {
      setUploading(false);
      // Reset input value to allow uploading the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerSelectFile = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUpload(file);
    }
  };

  const isCircle = shape === 'circle';

  return (
    <div className={clsx('relative flex flex-col items-center gap-xs', className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        disabled={uploading}
      />

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerSelectFile}
        className={clsx(
          'group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed transition-all duration-200 ease-in-out',
          isCircle ? 'rounded-full' : 'rounded-md',
          uploading
            ? 'border-muted-soft bg-surface-strong cursor-not-allowed'
            : 'border-hairline-strong bg-surface-card hover:border-ink hover:bg-canvas-soft',
          // Aspect Ratio classes
          aspectRatio === 'square' && 'aspect-square w-32 h-32 md:w-36 md:h-36',
          aspectRatio === 'video' && 'aspect-video w-full max-w-sm h-auto',
          aspectRatio === 'any' && 'w-full h-40',
        )}
      >
        {/* Preview image */}
        {value && !uploading && (
          <img
            src={value}
            alt="Upload preview"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-75"
          />
        )}

        {/* Hover overlay description */}
        {value && !uploading && (
          <div className={clsx(
            'absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100',
            isCircle ? 'rounded-full' : 'rounded-md',
          )}>
            <div className="flex flex-col items-center text-white gap-xs">
              <Icon name="camera" size={18} />
              <span className="text-caption font-medium">Thay đổi</span>
            </div>
          </div>
        )}

        {/* Empty state (No image preview) */}
        {(!value || uploading) && (
          <div className="flex flex-col items-center justify-center p-sm text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-xs">
                <Icon name="spinner" size={24} className="animate-spin text-primary" />
                <span className="text-caption text-body animate-pulse">Đang tải...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-xs text-body hover:text-ink">
                <Icon name="upload" size={20} className="text-muted" />
                <span className="text-caption font-semibold">Chọn ảnh</span>
                <span className="text-[10px] text-muted-soft">JPG, PNG, WEBP tối đa 5MB</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
