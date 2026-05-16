import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

const SORTS = [
  { id: 'best', label: 'Phù hợp nhất', icon: 'zap' },
  { id: 'paid', label: 'Lương cao nhất', icon: 'cash' },
  { id: 'near', label: 'Gần nhất', icon: 'pin' },
  { id: 'fast', label: 'Nhanh nhất', icon: 'clock' },
];

export default function DriverJobs() {
  const { driverJobs, acceptDriverJob, driverOnline } = useApp();
  const nav = useNavigate();
  const [sort, setSort] = useState('best');
  // Khi tích hợp API: thay bằng isPending / isLoading từ fetch (có thể gắn với driverOnline).
  const jobsLoading = false;

  const sorted = useMemo(() => {
    const list = [...driverJobs];
    if (sort === 'paid') list.sort((a, b) => b.earnings - a.earnings);
    if (sort === 'near') list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === 'fast') list.sort((a, b) => a.estMin - b.estMin);
    return list;
  }, [driverJobs, sort]);

  if (!driverOnline) {
    return (
      <div className="p-base">
        <EmptyState
          icon="bellOff"
          title="Bạn đang ngoại tuyến"
          message="Trực tuyến từ trang Chủ để bắt đầu nhận công việc."
          action={
            <Link to="/driver">
              <Button>Mở trang Chủ</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sticky sub-header */}
      <div className="sticky top-0 z-10 flex items-center gap-sm border-b border-hairline bg-canvas/95 px-base py-sm backdrop-blur">
        <button
          onClick={() => nav('/driver')}
          className="rounded-md p-1 text-body hover:bg-canvas-soft hover:text-ink"
          aria-label="Quay lại"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <div className="flex-1">
          <div className="text-title-md text-ink leading-tight">Công việc gần đây</div>
          <div className="text-caption text-body">
            <span className="nums">{driverJobs.length}</span> công việc trong khu vực của bạn
          </div>
        </div>
        <Badge tone="live" dot>Trực tiếp</Badge>
      </div>

      {/* Sort chips */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-hairline px-base py-2 no-scrollbar">
        {SORTS.map((s) => {
          const active = sort === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={clsx(
                'inline-flex shrink-0 items-center gap-1 rounded-pill border px-2.5 py-1 text-caption transition-colors',
                active
                  ? 'border-ink bg-primary text-on-primary'
                  : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft',
              )}
            >
              <Icon name={s.icon} size={11} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 p-base">
        {jobsLoading ? (
          <>
            {[0, 1, 2].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon="package"
            title="Hiện không có công việc nào"
            message="Hãy di chuyển — chúng tôi sẽ thông báo cho bạn ngay khi có đơn phù hợp."
          />
        ) : (
          sorted.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              onAccept={() => {
                const active = acceptDriverJob(j.id);
                if (active) nav('/driver/active');
              }}
            />
          ))
        )}

        <Card variant="soft" padded className="mt-2">
          <div className="flex items-center gap-sm">
            <Icon name="alert" size={16} className="text-accent-warning" />
            <span className="text-caption text-body">
              <strong className="text-ink">Mô phỏng tình huống Race-condition:</strong> ~1/4 số lần nhận đơn sẽ hiển thị thông báo "Công việc đã có người nhận" — đây là thiết kế.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/** Layout parity with <JobCard /> (thumb, two-line header, pickup/drop grid, dual CTAs). */
function JobCardSkeleton() {
  return (
    <Card padded={false} className="p-sm">
      <div className="flex items-start gap-sm">
        <Skeleton className="h-12 w-12 shrink-0" rounded="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-[78%] max-w-[200px]" rounded="sm" />
              <Skeleton className="h-3 w-[55%] max-w-[160px]" rounded="sm" />
            </div>
            <div className="shrink-0 space-y-1.5 text-right">
              <Skeleton className="ml-auto h-6 w-16" rounded="sm" />
              <Skeleton className="ml-auto h-3 w-12" rounded="sm" />
            </div>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <Skeleton className="h-3 w-14" rounded="sm" />
            <Skeleton className="h-3 w-14" rounded="sm" />
          </div>
        </div>
      </div>

      <div className="mt-sm grid min-h-[52px] grid-cols-2 gap-2 rounded-md border border-hairline bg-canvas-soft p-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" rounded="sm" />
          <Skeleton className="h-3 w-full" rounded="sm" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" rounded="sm" />
          <Skeleton className="h-3 w-full" rounded="sm" />
        </div>
      </div>

      <div className="mt-sm flex gap-1">
        <Skeleton className="h-9 min-h-9 flex-1" rounded="md" />
        <Skeleton className="h-9 min-h-9 flex-1" rounded="md" />
      </div>
    </Card>
  );
}

function JobCard({ job, onAccept }) {
  // perKm = useful proxy for "is this worth it"
  const perKm = Math.round(job.earnings / job.distanceKm);
  return (
    <Card padded={false} className="p-sm">
      <div className="flex items-start gap-sm">
        <Image src={job.restaurantAvatar} alt={job.restaurantName} className="h-12 w-12 rounded-md" ratio="1" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-body-sm font-semibold text-ink truncate">{job.restaurantName}</div>
              <div className="text-caption text-body truncate">
                → {job.customerName} · <span className="nums">{job.items}</span> món
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="nums text-title-md text-ink leading-none">{formatVnd(job.earnings)}</div>
              <div className="text-caption text-body nums">{formatVnd(perKm)}/km</div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-3 text-caption text-body">
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={11} /> <span className="nums">{job.distanceKm}</span> km
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={11} /> <span className="nums">{job.estMin}</span> phút
            </span>
          </div>
        </div>
      </div>

      <div className="mt-sm grid grid-cols-2 gap-2 rounded-md border border-hairline bg-canvas-soft p-2 text-caption">
        <div>
          <div className="text-caption-uppercase text-body">Điểm lấy hàng</div>
          <div className="text-ink truncate">{job.pickupAddress}</div>
        </div>
        <div>
          <div className="text-caption-uppercase text-body">Điểm giao hàng</div>
          <div className="text-ink truncate">{job.dropoffAddress}</div>
        </div>
      </div>

      <div className="mt-sm flex items-center gap-1">
        <Button variant="secondary" size="sm" className="flex-1">
          Bỏ qua
        </Button>
        <Button size="sm" className="flex-1" onClick={onAccept}>
          Nhận đơn
        </Button>
      </div>
    </Card>
  );
}
