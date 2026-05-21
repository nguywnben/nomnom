import { useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Trang sửa `platform_config` (key / value / data_type).
const SEED = [
  { key: 'default_commission_rate', value: '15', dataType: 'decimal', description: 'Hoa hồng nền tảng (%) mặc định cho nhà hàng', unit: '%' },
  { key: 'default_driver_share', value: '80', dataType: 'decimal', description: '% phí giao hàng tài xế nhận được', unit: '%' },
  { key: 'min_payout_amount', value: '100000', dataType: 'int', description: 'Số tiền tối thiểu mỗi lần rút', unit: 'VND' },
  { key: 'order_auto_cancel_minutes', value: '5', dataType: 'int', description: 'Số phút huỷ tự động nếu nhà hàng không xác nhận', unit: 'phút' },
  { key: 'max_search_radius_km', value: '8', dataType: 'decimal', description: 'Bán kính tìm kiếm tối đa', unit: 'km' },
];

const TYPE_TONE = {
  string: 'default',
  int: 'live',
  decimal: 'live',
  boolean: 'preview',
  json: 'preview',
};

export default function AdminConfig() {
  const { pushToast } = useApp();
  const [items, setItems] = useState(SEED);
  const [edit, setEdit] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const start = (k, v) => setEdit((cur) => ({ ...cur, [k]: v }));
  const save = (k) => {
    setSavingKey(k);
    setTimeout(() => {
      setItems((cur) => cur.map((c) => (c.key === k ? { ...c, value: edit[k] } : c)));
      setEdit((cur) => {
        const { [k]: _, ...rest } = cur;
        return rest;
      });
      setSavingKey(null);
      pushToast({ kind: 'success', title: 'Đã lưu cấu hình', message: `Khoá ${k} đã được cập nhật.` });
    }, 400);
  };
  const cancel = (k) =>
    setEdit((cur) => {
      const { [k]: _, ...rest } = cur;
      return rest;
    });

  return (
    <div className="space-y-base">
      <div>
        <div className="text-caption-uppercase text-body">Cấu hình</div>
        <h1 className="text-display-lg text-ink">Tham số nền tảng</h1>
        <p className="mt-xs text-body-sm text-body">
          Các giá trị này nằm trong bảng <code>platform_config</code> và ảnh hưởng toàn hệ thống. Thận trọng khi chỉnh sửa.
        </p>
      </div>

      <Card padded={false} className="overflow-hidden">
        <ul className="divide-y divide-hairline">
          {items.map((c) => {
            const editing = c.key in edit;
            return (
              <li key={c.key} className="p-base">
                <div className="flex flex-wrap items-start justify-between gap-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-body-sm font-semibold text-ink">{c.key}</code>
                      <Badge tone={TYPE_TONE[c.dataType]}>{c.dataType}</Badge>
                    </div>
                    <div className="mt-1 text-body-sm text-body">{c.description}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {editing ? (
                      <>
                        <Input
                          className="w-40"
                          value={edit[c.key]}
                          onChange={(e) => start(c.key, e.target.value)}
                          aria-label={c.key}
                        />
                        <Button size="sm" leadingIcon="check" loading={savingKey === c.key} onClick={() => save(c.key)}>
                          Lưu
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => cancel(c.key)}>
                          Hủy
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="nums text-body-sm font-semibold text-ink">
                          {c.value} {c.unit}
                        </span>
                        <Button size="sm" variant="secondary" leadingIcon="edit" onClick={() => start(c.key, c.value)}>
                          Sửa
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="rounded-md border border-hairline-strong bg-canvas-soft p-base text-caption text-body">
        <Icon name="alert" size={12} className="mr-1 inline" />
        Mọi thay đổi đều được ghi log vào trường <code>updated_by_admin_id</code> + <code>updated_at</code>. Cần phê duyệt cấp cao trước khi đẩy lên môi trường production.
      </div>
    </div>
  );
}
