import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { fetchMyVouchersApi } from '../../../lib/api.js';
import { formatVnd } from '../../../lib/formatVnd.js';
import ProfileSubHeader from './ProfileSubHeader.jsx';

function formatDate(dateStr) {
  if (!dateStr) return 'Vô thời hạn';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export default function Promotions() {
  const nav = useNavigate();
  const { pushToast, applyPromo } = useApp();
  const [code, setCode] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyVouchersApi()
      .then((data) => {
        setVouchers(data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch vouchers:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCheckCode = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCheckingCode(true);
    try {
      const ok = await applyPromo(trimmed);
      if (ok) {
        setCode('');
        pushToast({
          kind: 'success',
          title: 'Mã hợp lệ',
          message: `Mã ${trimmed} đã sẵn sàng cho đơn hàng tiếp theo của bạn!`,
        });
      }
    } finally {
      setCheckingCode(false);
    }
  };

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Khuyến mãi & voucher" />

      {/* Nhập mã quà tặng / voucher bí mật */}
      <Card padded>
        <div className="text-caption-uppercase text-body mb-2">Nhập mã ưu đãi</div>
        <div className="flex items-stretch gap-xs">
          <Input
            className="flex-1"
            leadingIcon="zap"
            placeholder="Ví dụ: NOMNOM15, FREESHIP"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCheckCode();
              }
            }}
          />
          <Button
            onClick={handleCheckCode}
            disabled={!code.trim() || checkingCode}
            loading={checkingCode}
          >
            Lưu mã
          </Button>
        </div>
        <p className="mt-2 text-caption text-body">
          Nhập mã voucher bạn nhận được qua Email, SMS hoặc sự kiện để lưu vào kho ưu đãi.
        </p>
      </Card>

      {/* Danh sách kho mã giảm giá */}
      <div>
        <div className="flex items-center justify-between mb-sm">
          <div className="text-caption-uppercase text-body">Kho Voucher của bạn ({vouchers.length})</div>
          <span className="text-caption text-body">Cập nhật liên tục</span>
        </div>

        <div className="flex flex-col gap-sm">
          {loading ? (
            <Card padded>
              <div className="text-body-sm text-body py-8 text-center animate-pulse">
                Đang tải danh sách khuyến mãi...
              </div>
            </Card>
          ) : vouchers.length === 0 ? (
            <Card padded>
              <div className="text-body-sm text-body py-8 text-center">
                Hiện tại chưa có mã khuyến mãi nào. Hãy quay lại sau nhé!
              </div>
            </Card>
          ) : (
            vouchers.map((p) => {
              const maxDiscount = p.max_discount ?? p.cap;
              const hasLimit = p.usage_limit && p.usage_limit > 0;
              const usedCount = p.used_count || 0;
              const percentUsed = hasLimit
                ? Math.min(100, Math.round((usedCount / p.usage_limit) * 100))
                : 0;

              return (
                <Card key={p.code} padded className="relative overflow-hidden hover:shadow-soft transition-shadow">
                  <div className="flex flex-col gap-base sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Icon & Core Details */}
                    <div className="flex items-start gap-sm min-w-0 flex-1">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Icon name="zap" size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-title-sm font-bold text-ink font-mono tracking-wide">
                            {p.code}
                          </span>
                          <Badge tone={p.kind === 'percent' ? 'preview' : 'success'}>
                            {p.kind === 'percent'
                              ? `Giảm ${p.amount}%${maxDiscount ? ` (tối đa ${formatVnd(maxDiscount)})` : ''}`
                              : `Giảm ${formatVnd(p.amount)}`}
                          </Badge>
                        </div>

                        <div className="mt-1 text-body-sm font-semibold text-ink">
                          {p.name && p.name !== p.code ? p.name : p.description || 'Ưu đãi đặt món NomNom'}
                        </div>

                        {/* Conditions & Expiry */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-body">
                          <span>
                            {p.min_order > 0
                              ? `Đơn tối thiểu: ${formatVnd(p.min_order)}`
                              : 'Áp dụng cho mọi đơn hàng'}
                          </span>
                          <span>•</span>
                          <span>HSD: {formatDate(p.valid_to)}</span>
                        </div>

                        {/* Usage Progress Bar */}
                        {hasLimit ? (
                          <div className="mt-2 flex items-center gap-2 max-w-xs">
                            <div className="flex-1 h-1.5 rounded-full bg-surface-strong overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                            <span className="text-caption text-body shrink-0">
                              Đã dùng {percentUsed}%
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1 text-caption text-success font-medium">
                            ✓ Số lượng không giới hạn
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-xs sm:flex-col sm:items-end shrink-0 border-t border-hairline pt-sm sm:border-t-0 sm:pt-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => nav('/app')}
                        className="flex-1 sm:flex-none"
                      >
                        Dùng ngay
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(p.code);
                          pushToast({
                            kind: 'info',
                            title: 'Đã sao chép mã',
                            message: `Đã lưu mã ${p.code} vào bộ nhớ tạm.`,
                            duration: 1800,
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-caption text-body hover:text-ink hover:bg-canvas-soft rounded transition-colors"
                      >
                        <Icon name="copy" size={12} /> Sao chép mã
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
