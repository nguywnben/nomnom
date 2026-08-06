import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import { fetchAdminConfigApi, updateAdminConfigApi } from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';

const LABELS = {
  default_commission_rate: { label: 'Hoa hồng mặc định', suffix: '%', min: 0, max: 50, step: 0.1 },
  max_search_radius_km: { label: 'Bán kính tìm kiếm', suffix: 'km', min: 1, max: 100, step: 0.1 },
  min_payout_amount: { label: 'Số tiền rút tối thiểu', suffix: 'VND', min: 10000, max: 1000000000, step: 1000 },
  order_auto_cancel_minutes: { label: 'Tự hủy đơn sau', suffix: 'phút', min: 1, max: 120, step: 1 },
};

export default function AdminConfig() {
  const { pushToast } = useApp();
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminConfigApi();
      setItems(response.data);
      setDraft(Object.fromEntries(response.data.map((item) => [item.key, item.value])));
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải cấu hình nền tảng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (item) => {
    setSaving(item.key);
    try {
      const response = await updateAdminConfigApi(item.key, draft[item.key]);
      setItems((current) => current.map((entry) => entry.key === item.key ? response.config : entry));
      setDraft((current) => ({ ...current, [item.key]: response.config.value }));
      const affected = response.affectedRestaurants ? ' Đã cập nhật ' + response.affectedRestaurants + ' quán dùng mức mặc định.' : '';
      pushToast({ kind: 'success', title: 'Đã lưu cấu hình', message: (LABELS[item.key]?.label || item.key) + '.' + affected });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể lưu', message: err.message || 'Giá trị không hợp lệ.' });
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Hệ thống</div>
          <h1 className="text-display-lg text-ink">Cấu hình nền tảng</h1>
          <p className="mt-xs text-body-sm text-body">Các tham số được backend kiểm tra giới hạn trước khi áp dụng.</p>
        </div>
        <Button variant="secondary" leadingIcon="refresh" loading={loading} onClick={load}>Làm mới</Button>
      </div>

      {error && <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">{error}</div>}
      {loading && !items.length && <div className="py-section text-center text-body-sm text-body" role="status">Đang tải cấu hình...</div>}

      <div className="grid gap-base lg:grid-cols-2">
        {items.map((item) => {
          const meta = LABELS[item.key] || { label: item.key, suffix: '', step: 1 };
          const changed = String(draft[item.key]) !== String(item.value);
          return (
            <Card key={item.key} padded>
              <div className="text-title-md text-ink">{meta.label}</div>
              <div className="mt-1 text-caption text-body">{item.description || item.key}</div>
              <div className="mt-sm flex flex-col gap-sm sm:flex-row sm:items-end">
                <Input
                  id={'config-' + item.key}
                  className="flex-1"
                  type="number"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  label={meta.label + ' (' + meta.suffix + ')'}
                  value={draft[item.key] ?? ''}
                  onChange={(event) => setDraft((current) => ({ ...current, [item.key]: event.target.value }))}
                />
                <Button leadingIcon="check" loading={saving === item.key} disabled={!changed} onClick={() => save(item)}>Lưu</Button>
              </div>
              <div className="mt-sm text-caption text-body">Khóa: <code className="text-ink">{item.key}</code></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
