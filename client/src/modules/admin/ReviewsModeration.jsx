import { useCallback, useEffect, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { Select, Textarea } from '../../components/Input.jsx';
import StarRating from '../../components/StarRating.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchAdminReviews, updateAdminReviewHidden } from '../../lib/api.js';
import { downloadCsv } from '../../lib/csv.js';

const PAGE_SIZE = 10;

const HIDE_PRESET_REASONS = [
  'Ngôn từ thô tục, xúc phạm hoặc quấy rối',
  'Spam quảng cáo / Nội dung không liên quan',
  'Tranh chấp giả mạo hoặc sai sự thật',
  'Tiết lộ thông tin cá nhân của người khác',
  'Đánh giá nhầm quán ăn hoặc nhầm đơn hàng',
];

export default function AdminReviewsModeration() {
  const { pushToast } = useApp();
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters State
  const [tab, setTab] = useState('low'); // Default to low (<= 3 stars) to focus on moderation
  const [ratingFilter, setRatingFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Summary State
  const [summary, setSummary] = useState({
    total: 0,
    lowRating: 0,
    hidden: 0,
    published: 0,
  });

  // Modal: Hide State
  const [hideTarget, setHideTarget] = useState(null);
  const [hideReason, setHideReason] = useState('');
  const [hideError, setHideError] = useState('');
  const [hiding, setHiding] = useState(false);

  // Modal: Unhide State
  const [unhideTarget, setUnhideTarget] = useState(null);
  const [unhiding, setUnhiding] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(1);
    }, 250);
    return () => clearTimeout(handle);
  }, [searchText]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReviews({
        tab,
        rating: ratingFilter,
        targetType: targetTypeFilter,
        page,
        limit: PAGE_SIZE,
        q: debouncedSearch,
      });

      const mapped = (data.items || []).map((r) => ({
        id: r.id,
        customerId: r.customer_id,
        customer: r.customer_name || 'Khách ẩn danh',
        customerAvatar: r.customer_avatar,
        restaurantId: r.restaurant_id,
        restaurant: r.restaurant_name || 'Quán ăn',
        menuItemId: r.menu_item_id,
        dishName: r.dish_name || null,
        dishImage: r.dish_image || null,
        orderId: r.order_id,
        orderCode: r.order_code || 'ORD-UNKNOWN',
        rating: r.rating,
        comment: r.comment || '',
        isHidden: Boolean(r.is_hidden),
        at: r.created_at,
      }));

      setReviews(mapped);
      setTotal(data.pagination?.total ?? 0);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi tải đánh giá',
        message: err.message || 'Không thể kết nối đến server.',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pushToast, ratingFilter, tab, targetTypeFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Open Hide Modal
  const openHideModal = (review) => {
    setHideTarget(review);
    setHideReason('');
    setHideError('');
  };

  const closeHideModal = () => {
    setHideTarget(null);
    setHideReason('');
    setHideError('');
  };

  // Confirm Hide
  const confirmHide = async () => {
    if (!hideTarget) return;
    if (!hideReason.trim()) {
      setHideError('Vui lòng chọn hoặc nhập lý do ẩn đánh giá.');
      return;
    }

    setHiding(true);
    setHideError('');
    try {
      await updateAdminReviewHidden(hideTarget.id, true, hideReason.trim());
      pushToast({
        kind: 'info',
        title: 'Đã ẩn đánh giá',
        message: 'Đánh giá này đã bị ẩn khỏi quán và ứng dụng khách hàng.',
      });
      closeHideModal();
      loadReviews();
    } catch (err) {
      setHideError(err.message || 'Không thể ẩn đánh giá.');
    } finally {
      setHiding(false);
    }
  };

  // Open Unhide Modal
  const openUnhideModal = (review) => {
    setUnhideTarget(review);
  };

  const closeUnhideModal = () => {
    setUnhideTarget(null);
  };

  // Confirm Unhide
  const confirmUnhide = async () => {
    if (!unhideTarget) return;
    setUnhiding(true);
    try {
      await updateAdminReviewHidden(unhideTarget.id, false, 'Khôi phục hiển thị đánh giá');
      pushToast({
        kind: 'success',
        title: 'Đã hiện lại đánh giá',
        message: 'Đánh giá đã được hiển thị công khai bình thường.',
      });
      closeUnhideModal();
      loadReviews();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi', message: err.message || 'Không thể hiển thị lại đánh giá.' });
    } finally {
      setUnhiding(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const data = await fetchAdminReviews({
        tab,
        rating: ratingFilter,
        targetType: targetTypeFilter,
        q: debouncedSearch,
        export: true,
      });

      const items = data.items || [];
      if (!items.length) {
        pushToast({ kind: 'info', title: 'Không có dữ liệu', message: 'Không có đánh giá nào để xuất CSV.' });
        return;
      }

      const csvRows = items.map((r) => ({
        'Mã đánh giá': r.id,
        'Thời gian': new Date(r.created_at).toLocaleString('vi-VN'),
        'Khách hàng': r.customer_name || 'Khách ẩn danh',
        'Quán ăn': r.restaurant_name || 'Quán ăn',
        'Đối tượng': r.menu_item_id ? `Món ăn (${r.dish_name || 'Món'})` : 'Quán ăn',
        'Mã đơn': r.order_code || `ORD-${r.order_id}`,
        'Số sao': `${r.rating} sao`,
        'Nội dung nhận xét': r.comment || '(Không có nhận xét)',
        'Trạng thái': r.is_hidden ? 'Đã ẩn' : 'Đang hiển thị',
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCsv(`danh-sach-danh-gia-nomnom-${dateStr}.csv`, csvRows);
      pushToast({ kind: 'success', title: 'Xuất CSV thành công', message: `Đã xuất ${csvRows.length} đánh giá.` });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Xuất CSV thất bại', message: err.message || 'Vui lòng thử lại.' });
    } finally {
      setExporting(false);
    }
  };

  const effectivePage = Math.min(page, Math.max(1, Math.ceil((total || 0) / PAGE_SIZE)));

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Khách hàng & Chất lượng</div>
          <h1 className="text-display-lg text-ink">Kiểm duyệt Đánh giá</h1>
          <p className="mt-xs text-body-sm text-body">
            Theo dõi phản hồi từ khách hàng, kiểm soát chất lượng phục vụ của quán ăn và xử lý đánh giá vi phạm.
          </p>
        </div>

        {/* Global Summary Badges */}
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {summary.total} đánh giá</Badge>
          {summary.lowRating > 0 && (
            <Badge tone="warning" dot>{summary.lowRating} cần xử lý (≤ 3★)</Badge>
          )}
          {summary.hidden > 0 && (
            <Badge tone="error" dot>{summary.hidden} đã ẩn</Badge>
          )}
        </div>
      </div>

      {/* Toolbar & Filters (Nằm ngoài table giống /admin/orders và /admin/accounts) */}
      <div className="space-y-sm">
        {/* Row 1: Tabs + CSV Export Button */}
        <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
          <Tabs
            size="sm"
            className="w-fit max-w-full"
            items={[
              { value: 'low', label: `Cần xử lý ≤ 3★ (${summary.lowRating})` },
              { value: 'hidden', label: `Đã ẩn (${summary.hidden})` },
              { value: 'all', label: `Tất cả (${summary.total})` },
            ]}
            value={tab}
            onChange={(val) => {
              setTab(val);
              setPage(1);
            }}
          />

          <Button
            variant="secondary"
            size="sm"
            leadingIcon="download"
            onClick={handleExportCsv}
            loading={exporting}
            disabled={total === 0 || exporting}
          >
            {exporting ? 'Đang xuất…' : 'Xuất CSV'}
          </Button>
        </div>

        {/* Row 2: Search Input (trái) + Dropdown Bộ lọc (phải) */}
        <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80 shrink-0 h-9">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
            />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm khách, quán, món, mã đơn..."
              aria-label="Tìm kiếm đánh giá"
              className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-xs">
            <Select
              aria-label="Lọc số sao"
              className="w-full sm:w-auto md:w-40"
              fieldClassName="!h-9 !px-sm text-caption"
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Mọi số sao' },
                { value: '5', label: '5 sao ★★★★★' },
                { value: '4', label: '4 sao ★★★★' },
                { value: '3', label: '3 sao ★★★' },
                { value: '2', label: '2 sao ★★' },
                { value: '1', label: '1 sao ★' },
              ]}
            />

            <Select
              aria-label="Lọc loại đánh giá"
              className="w-full sm:w-auto md:w-44"
              fieldClassName="!h-9 !px-sm text-caption"
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Mọi loại đánh giá' },
                { value: 'restaurant', label: 'Đánh giá Quán ăn' },
                { value: 'dish', label: 'Đánh giá Món ăn' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Review List View */}
      {loading ? (
        <Card padded className="text-center text-body py-xxl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
          Đang tải dữ liệu đánh giá...
        </Card>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="starFilled"
          title="Không có đánh giá phù hợp"
          message={searchText ? 'Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.' : 'Chưa có đánh giá nào trong danh mục này.'}
        />
      ) : (
        <div className="space-y-base">
          <ul className="space-y-sm">
            {reviews.map((r) => (
              <Card padded key={r.id} className="transition-shadow hover:shadow-soft-sm">
                <div className="flex items-start gap-base">
                  <Avatar name={r.customer} src={r.customerAvatar} size="md" className="shrink-0 mt-0.5" />
                  
                  <div className="min-w-0 flex-1 space-y-xs">
                    {/* Header: Customer Name + Date + Order Code */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-body-sm font-semibold text-ink">{r.customer}</span>
                        <span className="text-caption text-body ml-2">
                          · {new Date(r.at).toLocaleString('vi-VN')} · Đơn <span className="font-medium text-ink">#{r.orderCode}</span>
                        </span>
                      </div>

                      {/* Status & Rating */}
                      <div className="flex items-center gap-2">
                        <StarRating value={r.rating} />
                        {r.isHidden ? (
                          <Badge tone="error" dot upper={false}>Đã ẩn</Badge>
                        ) : (
                          <Badge tone="success" dot upper={false}>Đang hiển thị</Badge>
                        )}
                      </div>
                    </div>

                    {/* Target Information: Restaurant vs Dish */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-caption text-body flex items-center gap-1 font-medium">
                        <Icon name="store" size={14} className="text-muted" />
                        {r.restaurant}
                      </span>

                      {r.dishName && (
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas-soft px-2 py-0.5 text-caption text-ink font-medium">
                          {r.dishImage && (
                            <img src={r.dishImage} alt={r.dishName} className="h-4 w-4 rounded object-cover" />
                          )}
                          <span>Món: {r.dishName}</span>
                        </div>
                      )}
                    </div>

                    {/* Comment Content */}
                    <div className="pt-1">
                      {r.comment ? (
                        <p className="text-body-sm text-ink leading-relaxed whitespace-pre-wrap bg-surface-card rounded-md border border-hairline/60 p-2.5">
                          "{r.comment}"
                        </p>
                      ) : (
                        <p className="text-body-sm text-muted italic">
                          (Khách hàng không để lại nhận xét văn bản)
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {r.isHidden ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="!text-success hover:!bg-success/10"
                          leadingIcon="check"
                          onClick={() => openUnhideModal(r)}
                        >
                          Hiện lại đánh giá
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="!text-error hover:!bg-error/10"
                          leadingIcon="bellOff"
                          onClick={() => openHideModal(r)}
                        >
                          Ẩn đánh giá
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </ul>

          {/* Pagination */}
          <div className="border-t border-hairline pt-base">
            <Pagination total={total} pageSize={PAGE_SIZE} page={effectivePage} onChange={setPage} />
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN ẨN ĐÁNH GIÁ (KÈM LÝ DO VI PHẠM) */}
      <Modal
        open={Boolean(hideTarget)}
        onClose={closeHideModal}
        title="Xác nhận ẩn đánh giá"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeHideModal} disabled={hiding}>
              Hủy
            </Button>
            <Button
              variant="danger"
              leadingIcon="bellOff"
              onClick={confirmHide}
              loading={hiding}
              disabled={!hideReason.trim() || hiding}
            >
              {hiding ? 'Đang ẩn…' : 'Xác nhận ẩn'}
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          <p className="text-body-sm text-body leading-relaxed">
            Ẩn đánh giá của khách hàng <strong className="text-ink">{hideTarget?.customer}</strong> tại quán <strong className="text-ink">{hideTarget?.restaurant}</strong>:
          </p>

          <div className="rounded-md border border-hairline-strong bg-canvas-soft p-sm text-body-sm text-ink italic">
            "{hideTarget?.comment || '(Không có nhận xét)'}"
          </div>

          <Select
            label="Chọn mẫu lý do vi phạm"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setHideReason(e.target.value);
                if (hideError) setHideError('');
              }
            }}
            options={[
              { value: '', label: '— Chọn mẫu lý do hoặc tự gõ —' },
              ...HIDE_PRESET_REASONS.map((r) => ({ value: r, label: r })),
            ]}
          />

          <Textarea
            rows={3}
            label="Lý do ẩn đánh giá"
            required
            value={hideReason}
            onChange={(e) => {
              setHideReason(e.target.value);
              if (hideError) setHideError('');
            }}
            error={hideError}
            placeholder="Nhập lý do vi phạm chính sách hoặc tiêu chuẩn cộng đồng..."
          />
        </div>
      </Modal>

      {/* MODAL: XÁC NHẬN HIỆN LẠI ĐÁNH GIÁ */}
      <Modal
        open={Boolean(unhideTarget)}
        onClose={closeUnhideModal}
        title="Xác nhận hiện lại đánh giá"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeUnhideModal} disabled={unhiding}>
              Hủy
            </Button>
            <Button
              leadingIcon="check"
              onClick={confirmUnhide}
              loading={unhiding}
              disabled={unhiding}
            >
              {unhiding ? 'Đang hiển thị…' : 'Xác nhận hiện lại'}
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          <p className="text-body-sm text-body leading-relaxed">
            Bạn có chắc chắn muốn khôi phục hiển thị đánh giá của khách hàng <strong className="text-ink">{unhideTarget?.customer}</strong> công khai trên hệ thống không?
          </p>
          <div className="rounded-md border border-primary/20 bg-primary/5 p-sm text-body-sm text-ink italic">
            "{unhideTarget?.comment || '(Không có nhận xét)'}"
          </div>
        </div>
      </Modal>
    </div>
  );
}
