import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import Tabs from '../../../components/Tabs.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { fetchMyVouchersApi, saveVoucherApi } from '../../../lib/api.js';
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
  const { pushToast } = useApp();
  const [code, setCode] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadVouchers = async () => {
    try {
      const data = await fetchMyVouchersApi();
      setVouchers(data || []);
    } catch (err) {
      console.error('Failed to fetch vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleCheckCode = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCheckingCode(true);
    try {
      const res = await saveVoucherApi({ code: trimmed });
      setCode('');
      pushToast({
        kind: 'success',
        title: 'Thành công',
        message: res.message || `Đã lưu mã ${trimmed} vào kho voucher của bạn!`,
      });
      await loadVouchers();
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể lưu mã',
        message: err.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
      });
    } finally {
      setCheckingCode(false);
    }
  };

  const platformVouchers = useMemo(() => vouchers.filter((v) => !v.restaurantId), [vouchers]);
  const merchantVouchers = useMemo(() => vouchers.filter((v) => Boolean(v.restaurantId)), [vouchers]);

  const filteredVouchers = useMemo(() => {
    if (activeTab === 'platform') return platformVouchers;
    if (activeTab === 'merchant') return merchantVouchers;
    return vouchers;
  }, [activeTab, merchantVouchers, platformVouchers, vouchers]);

  const tabItems = [
    { value: 'all', label: `Tất cả (${vouchers.length})` },
    { value: 'platform', label: `Mã toàn sàn (${platformVouchers.length})` },
    { value: 'merchant', label: `Mã quán ăn (${merchantVouchers.length})` },
  ];

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
            placeholder="Ví dụ: NOMNOM15, VIPKHACH50, FREESHIP"
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
          Nhập mã voucher bạn nhận được qua tin nhắn, email hoặc quà tặng độc quyền để lưu vào kho ưu đãi.
        </p>
      </Card>

      {/* Danh sách kho mã giảm giá */}
      <div>
        <div className="mb-sm">
          <div className="text-caption-uppercase text-body">Kho Voucher của bạn ({filteredVouchers.length})</div>
        </div>

        <div className="mb-base">
          <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} />
        </div>

        <div className="flex flex-col gap-sm">
          {loading ? (
            <Card padded>
              <div className="text-body-sm text-body py-8 text-center animate-pulse">
                Đang tải danh sách khuyến mãi...
              </div>
            </Card>
          ) : filteredVouchers.length === 0 ? (
            <Card padded>
              <div className="text-body-sm text-body py-8 text-center">
                {activeTab === 'merchant'
                  ? 'Bạn chưa lưu mã khuyến mãi nào của quán ăn. Hãy khám phá thực đơn quán yêu thích để lưu mã nhé!'
                  : 'Hiện tại chưa có mã khuyến mãi nào trong mục này.'}
              </div>
            </Card>
          ) : (
            filteredVouchers.map((p) => {
              const maxDiscount = p.max_discount ?? p.cap;
              const hasLimit = p.usage_limit && p.usage_limit > 0;
              const usedCount = p.used_count || 0;
              const percentUsed = hasLimit
                ? Math.min(100, Math.round((usedCount / p.usage_limit) * 100))
                : 0;
              const isUsable = p.is_usable !== false;
              const voucherIcon = (p.code?.includes('SHIP') || p.name?.toLowerCase().includes('giao') || p.description?.toLowerCase().includes('vận chuyển') || p.description?.toLowerCase().includes('giao hàng'))
                ? 'bike'
                : p.kind === 'percent'
                  ? 'percent'
                  : 'ticket';

              return (
                <Card
                  key={p.code}
                  padded
                  className={`relative overflow-hidden transition-shadow ${
                    isUsable ? 'hover:shadow-soft' : 'opacity-60 bg-canvas-soft border-hairline'
                  }`}
                >
                  <div className="flex flex-col gap-base sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Icon & Core Details */}
                    <div className="flex items-start gap-sm min-w-0 flex-1">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-hairline-strong bg-canvas-soft text-ink">
                        <Icon name={voucherIcon} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-body-sm font-bold text-ink font-mono tracking-wide">
                            {p.code}
                          </span>
                          <Badge tone={!isUsable ? 'default' : p.kind === 'percent' ? 'preview' : 'success'}>
                            {p.kind === 'percent'
                              ? `Giảm ${p.amount}%${maxDiscount ? ` (tối đa ${formatVnd(maxDiscount)})` : ''}`
                              : `Giảm ${formatVnd(p.amount)}`}
                          </Badge>
                          {p.restaurantId ? (
                            <Badge tone="default">Quán: {p.restaurantName || 'Riêng quán'}</Badge>
                          ) : (
                            <Badge tone="outline">Toàn sàn</Badge>
                          )}
                          {!isUsable && (
                            <Badge tone="error">
                              {p.is_expired ? 'Hết hạn' : p.is_out_of_quota ? 'Hết lượt dùng' : 'Đã đạt giới hạn'}
                            </Badge>
                          )}
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
                                className={`h-full rounded-full ${isUsable ? 'bg-ink' : 'bg-muted'}`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                            <span className="text-caption text-body shrink-0">
                              Đã dùng {percentUsed}%
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1 text-caption text-body">
                            Số lượng không giới hạn
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-xs sm:flex-col sm:items-end shrink-0 border-t border-hairline pt-sm sm:border-t-0 sm:pt-0">
                      <Button
                        size="sm"
                        variant={isUsable ? 'primary' : 'secondary'}
                        disabled={!isUsable}
                        onClick={() => nav(p.restaurantId ? `/app/restaurant/${p.restaurantId}` : '/app')}
                        className="flex-1 sm:flex-none"
                      >
                        {isUsable ? 'Dùng ngay' : 'Hết hiệu lực'}
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
