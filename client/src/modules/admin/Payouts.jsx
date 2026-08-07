import { useCallback, useEffect, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import { fetchAdminPayoutsApi, updateAdminPayoutApi } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';
import { useApp } from '../../context/AppContext.jsx';

const STATUS = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Chờ chuyển khoản', tone: 'live' },
  completed: { label: 'Đã chuyển', tone: 'success' },
  rejected: { label: 'Từ chối', tone: 'error' },
};

export default function AdminPayouts() {
  const { pushToast } = useApp();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminPayoutsApi({ status, q: query, page, limit: 20 });
      setItems(response.data);
      setPagination(response.pagination);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải yêu cầu rút tiền.');
    } finally {
      setLoading(false);
    }
  }, [status, query, page]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (payout, action) => {
    setActing(true);
    try {
      await updateAdminPayoutApi(payout.id, {
        action,
        reason: action === 'reject' ? value.trim() : undefined,
        externalRef: action === 'complete' ? value.trim() : undefined,
      });
      setDialog(null);
      setValue('');
      pushToast({ kind: 'success', title: 'Đã cập nhật payout', message: payout.code + ' đã chuyển trạng thái.' });
      await load();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể cập nhật', message: err.message || 'Vui lòng thử lại.' });
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Tài chính</div>
          <h1 className="text-display-lg text-ink">Duyệt rút tiền</h1>
          <p className="mt-xs text-body-sm text-body">Chỉ hoàn tất sau khi có mã giao dịch ngân hàng.</p>
        </div>
        <Button variant="secondary" leadingIcon="refresh" loading={loading} onClick={load}>Làm mới</Button>
      </div>

      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
        <Tabs
          className="max-w-full"
          items={[
            { value: 'pending', label: 'Chờ duyệt' },
            { value: 'approved', label: 'Chờ chuyển' },
            { value: 'completed', label: 'Đã chuyển' },
            { value: 'rejected', label: 'Từ chối' },
            { value: 'all', label: 'Tất cả' },
          ]}
          value={status}
          onChange={(next) => { setStatus(next); setPage(1); }}
        />
        <Input leadingIcon="search" aria-label="Tìm payout" placeholder="Tìm quán hoặc ngân hàng..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="w-full md:w-72" />
      </div>

      {error && <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">{error}</div>}

      {!loading && !items.length ? (
        <EmptyState icon="wallet" title="Không có yêu cầu phù hợp" message="Thử đổi trạng thái hoặc từ khóa tìm kiếm." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {items.map((payout) => {
              const state = STATUS[payout.status] || { label: payout.status, tone: 'outline' };
              return (
                <li key={payout.id} className="p-base">
                  <div className="flex flex-wrap items-start justify-between gap-sm">
                    <div className="min-w-0">
                      <div className="nums text-body-sm font-semibold text-ink">{payout.code}</div>
                      <div className="text-body-sm text-ink">{payout.userName}</div>
                      <div className="text-caption text-body">{payout.bankName} · {payout.bankAccountMasked} · {payout.bankAccountHolder}</div>
                      <div className="text-caption text-body">{new Date(payout.requestedAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="nums text-title-sm text-ink">{formatVnd(payout.amount)}</div>
                      <Badge tone={state.tone}>{state.label}</Badge>
                    </div>
                  </div>
                  {payout.rejectReason && <div className="mt-sm rounded-md bg-[#fbeaea] p-sm text-caption text-error">Lý do: {payout.rejectReason}</div>}
                  {payout.externalRef && <div className="mt-sm text-caption text-body">Mã ngân hàng: <span className="nums text-ink">{payout.externalRef}</span></div>}
                  <div className="mt-sm flex flex-wrap gap-xs">
                    {payout.status === 'pending' && <>
                      <Button size="sm" leadingIcon="check" onClick={() => changeStatus(payout, 'approve')}>Duyệt</Button>
                      <Button size="sm" variant="secondary" leadingIcon="x" onClick={() => { setDialog({ type: 'reject', payout }); setValue(''); }}>Từ chối</Button>
                    </>}
                    {payout.status === 'approved' && <Button size="sm" leadingIcon="check" onClick={() => { setDialog({ type: 'complete', payout }); setValue(''); }}>Xác nhận đã chuyển</Button>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {pagination.total > pagination.limit && <Pagination total={pagination.total} pageSize={pagination.limit} page={pagination.page} onChange={setPage} />}

      <Modal open={Boolean(dialog)} onClose={() => setDialog(null)} title={dialog?.type === 'reject' ? 'Từ chối yêu cầu' : 'Xác nhận đã chuyển khoản'} size="sm">
        <div className="space-y-sm">
          {dialog?.type === 'reject'
            ? <Textarea label="Lý do" rows={4} value={value} onChange={(event) => setValue(event.target.value)} />
            : <Input label="Mã giao dịch ngân hàng" value={value} onChange={(event) => setValue(event.target.value)} hint="Mã dùng để đối soát và không thể bỏ trống." />}
          <div className="flex justify-end gap-xs">
            <Button variant="secondary" onClick={() => setDialog(null)}>Hủy</Button>
            <Button loading={acting} disabled={value.trim().length < 3} onClick={() => changeStatus(dialog.payout, dialog.type)}>
              {dialog?.type === 'reject' ? 'Xác nhận từ chối' : 'Hoàn tất payout'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
