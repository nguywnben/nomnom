import { useState } from 'react';

import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { promoCodes } from '../../../data/mock.js';
import { formatVnd } from '../../../lib/formatVnd.js';
import ProfileSubHeader from './ProfileSubHeader.jsx';

// Khuyến mãi & voucher — sử dụng chung dataset promoCodes từ mock,
// hiển thị cùng 2 banner ưu đãi sắp diễn ra để trang sống động hơn.
const HIGHLIGHTS = [
  {
    id: 'promo-banner-1',
    title: 'Tuần lễ ẩm thực Việt',
    subtitle: 'Giảm tới 50.000 ₫ cho phở, bún, bánh mì.',
    until: '20/05',
    tone: 'dark',
  },
  {
    id: 'promo-banner-2',
    title: 'Miễn phí giao hàng cuối tuần',
    subtitle: 'Áp dụng cho đơn từ 150.000 ₫.',
    until: '18/05',
    tone: 'soft',
  },
];

export default function Promotions() {
  const { applyPromo, appliedPromo, pushToast } = useApp();
  const [code, setCode] = useState('');

  const onApply = (c) => {
    const ok = applyPromo(c);
    if (ok) setCode('');
  };

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Khuyến mãi & voucher" />

      {/* Apply box */}
      <Card padded>
        <div className="text-caption-uppercase text-body mb-2">Nhập mã khuyến mãi</div>
        <div className="flex items-stretch gap-xs">
          <Input
            className="flex-1"
            leadingIcon="zap"
            placeholder="Ví dụ: NOMNOM15"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <Button onClick={() => code && onApply(code)} disabled={!code.trim()}>
            Áp dụng
          </Button>
        </div>
        {appliedPromo && (
          <div className="mt-sm flex items-center gap-2 rounded-md border border-success/30 bg-[#e6f4ea] px-sm py-2 text-caption text-success">
            <Icon name="check" size={14} />
            Đang áp dụng <strong className="font-semibold">{appliedPromo.code}</strong> — {appliedPromo.label}
          </div>
        )}
      </Card>

      {/* Highlights */}
      <div className="grid gap-sm md:grid-cols-2">
        {HIGHLIGHTS.map((h) => (
          <Card
            key={h.id}
            padded
            variant={h.tone === 'dark' ? 'dark' : 'soft'}
            className="flex items-start gap-sm"
          >
            <span
              className={
                'grid h-10 w-10 shrink-0 place-items-center rounded-md ' +
                (h.tone === 'dark' ? 'bg-surface-dark-elevated text-on-dark' : 'bg-surface-card text-ink')
              }
            >
              <Icon name="zap" size={16} />
            </span>
            <div className="min-w-0">
              <div className={h.tone === 'dark' ? 'text-title-md text-on-dark' : 'text-title-md text-ink'}>
                {h.title}
              </div>
              <p className={h.tone === 'dark' ? 'text-body-sm text-on-dark-soft' : 'text-body-sm text-body'}>
                {h.subtitle}
              </p>
              <div
                className={
                  'mt-1 text-caption ' +
                  (h.tone === 'dark' ? 'text-on-dark-soft' : 'text-body')
                }
              >
                Kết thúc {h.until}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Available coupons */}
      <div>
        <div className="text-caption-uppercase text-body mb-sm">Mã có thể áp dụng</div>
        <div className="flex flex-col gap-sm">
          {promoCodes.map((p) => {
            const active = appliedPromo?.code === p.code;
            return (
              <Card key={p.code} padded>
                <div className="flex items-start gap-sm">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-strong text-ink">
                    <Icon name="zap" size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body-sm font-semibold text-ink font-mono">{p.code}</span>
                      <Badge tone={p.kind === 'percent' ? 'preview' : 'default'}>
                        {p.kind === 'percent'
                          ? `Giảm ${p.amount}%${p.cap ? ` (tối đa ${formatVnd(p.cap)})` : ''}`
                          : `Giảm ${formatVnd(p.amount)}`}
                      </Badge>
                      {active && <Badge tone="success" dot>Đang áp dụng</Badge>}
                    </div>
                    <p className="mt-1 text-caption text-body">{p.label}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-xs">
                    <Button
                      size="sm"
                      variant={active ? 'secondary' : 'primary'}
                      onClick={() => (active ? null : onApply(p.code))}
                      disabled={active}
                    >
                      {active ? 'Đã áp dụng' : 'Áp dụng'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(p.code);
                        pushToast({ kind: 'info', title: 'Đã sao chép', message: p.code, duration: 1800 });
                      }}
                      className="inline-flex items-center gap-1 text-caption text-body hover:text-ink"
                    >
                      <Icon name="copy" size={12} /> Sao chép
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
