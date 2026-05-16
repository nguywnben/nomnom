import { useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input, { Select } from '../../components/Input.jsx';
import { promoCodes as initial } from '../../data/mock.js';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

export default function MerchantPromotions() {
  const { pushToast } = useApp();
  // Lazy init so randomness happens once outside render.
  const [codes, setCodes] = useState(() =>
    initial.map((c, i) => ({
      ...c,
      status: 'active',
      uses: [42, 18, 67][i] ?? 24,
    })),
  );
  const [draft, setDraft] = useState({ code: '', kind: 'percent', amount: 15, cap: 250000 });

  const create = (e) => {
    e.preventDefault();
    if (!draft.code) return;
    const next = {
      code: draft.code.toUpperCase(),
      label:
        draft.kind === 'percent'
          ? `Giảm ${draft.amount}%, tối đa ${formatVnd(draft.cap)}.`
          : `Giảm ${formatVnd(draft.amount)}.`,
      kind: draft.kind,
      amount: Number(draft.amount),
      cap: Number(draft.cap),
      status: 'active',
      uses: 0,
    };
    setCodes((c) => [next, ...c]);
    pushToast({ kind: 'success', title: 'Đã tạo khuyến mãi', message: next.code });
    setDraft({ code: '', kind: 'percent', amount: 15, cap: 250000 });
  };

  const togglePromo = (code) =>
    setCodes((c) =>
      c.map((x) => (x.code === code ? { ...x, status: x.status === 'active' ? 'paused' : 'active' } : x)),
    );

  return (
    <div className="space-y-base">
      <div>
        <div className="text-caption-uppercase text-body">Tăng trưởng</div>
        <h1 className="text-display-lg text-ink">Khuyến mãi</h1>
      </div>

      <div className="grid gap-base lg:grid-cols-[1fr_360px]">
        <div>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {codes.map((c) => (
              <Card key={c.code} padded={false} className="p-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-body-sm text-ink">{c.code}</span>
                      <IconButton
                        icon="copy"
                        size="sm"
                        label="Sao chép"
                        onClick={() => {
                          navigator.clipboard?.writeText(c.code);
                          pushToast({ kind: 'success', title: 'Đã sao chép', message: c.code, duration: 1500 });
                        }}
                      />
                    </div>
                    <div className="text-caption text-body mt-0.5">{c.label}</div>
                  </div>
                  <Badge tone={c.status === 'active' ? 'success' : 'outline'} dot>
                    {c.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </Badge>
                </div>
                <div className="mt-sm flex items-center justify-between border-t border-hairline pt-sm">
                  <span className="text-caption text-body">
                    <span className="nums text-ink">{c.uses}</span> lượt dùng
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => togglePromo(c.code)}>
                    {c.status === 'active' ? 'Tạm dừng' : 'Tiếp tục'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card padded={false} className="hidden md:block">
            <table className="w-full">
              <thead className="bg-canvas-soft text-caption-uppercase text-body">
                <tr>
                  <th className="px-base py-2 text-left">Mã</th>
                  <th className="px-base py-2 text-left">Ưu đãi</th>
                  <th className="px-base py-2 text-left">Lượt dùng</th>
                  <th className="px-base py-2 text-left">Trạng thái</th>
                  <th className="px-base py-2 text-right pr-base">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {codes.map((c) => (
                  <tr key={c.code} className="hover:bg-canvas-soft">
                    <td className="px-base py-sm">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono text-body-sm text-ink">{c.code}</span>
                        <IconButton
                          icon="copy"
                          size="sm"
                          label="Sao chép"
                          onClick={() => {
                            navigator.clipboard?.writeText(c.code);
                            pushToast({ kind: 'success', title: 'Đã sao chép', message: c.code, duration: 1500 });
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-base py-sm text-body-sm text-ink">{c.label}</td>
                    <td className="px-base py-sm nums text-body-sm text-ink">{c.uses}</td>
                    <td className="px-base py-sm">
                      <Badge tone={c.status === 'active' ? 'success' : 'outline'} dot>
                        {c.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </td>
                    <td className="px-base py-sm text-right pr-base">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="secondary" size="sm" onClick={() => togglePromo(c.code)}>
                          {c.status === 'active' ? 'Tạm dừng' : 'Tiếp tục'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Create new */}
        <Card padded>
          <div className="text-title-md text-ink mb-base">Tạo mã giảm giá</div>
          <form onSubmit={create} className="space-y-sm">
            <Input
              placeholder="Mã · ví dụ LATE10"
              aria-label="Mã khuyến mãi"
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
            />
            <Select
              aria-label="Loại khuyến mãi"
              value={draft.kind}
              onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value }))}
              options={[
                { value: 'percent', label: 'Giảm theo phần trăm' },
                { value: 'flat', label: 'Giảm một khoản tiền' },
              ]}
            />
            <Input
              type="number"
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
              placeholder={draft.kind === 'percent' ? 'Phần trăm giảm' : 'Số tiền giảm (VNĐ)'}
              aria-label={draft.kind === 'percent' ? 'Phần trăm giảm' : 'Số tiền giảm'}
            />
            {draft.kind === 'percent' && (
              <Input
                type="number"
                value={draft.cap}
                onChange={(e) => setDraft((d) => ({ ...d, cap: e.target.value }))}
                placeholder="Giới hạn tối đa (VNĐ)"
                aria-label="Giới hạn giảm giá tối đa"
              />
            )}
            <Button type="submit" leadingIcon="zap" className="w-full">
              Tạo khuyến mãi
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
