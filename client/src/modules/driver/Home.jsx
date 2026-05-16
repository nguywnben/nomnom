import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Switch from '../../components/Switch.jsx';
import Image from '../../components/Image.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { driverDailyEarnings } from '../../data/mock.js';
import { formatVnd } from '../../lib/formatVnd.js';

// ---------------------------------------------------------------------------
// Driver Home — the main feed of the driver app.
//   • Big Online/Offline toggle (prominent, card-sized)
//   • Today's earnings + completed-trip stat
//   • Active job CTA (if any)
//   • Nearby jobs preview list (3) with "See all"
//   • Heatmap-zone tip card
// ---------------------------------------------------------------------------
export default function DriverHome() {
  const nav = useNavigate();
  const { driverOnline, setDriverOnline, driverJobs, activeDriverJob, acceptDriverJob } = useApp();

  const today = driverDailyEarnings[driverDailyEarnings.length - 1].earnings;
  const week = driverDailyEarnings.reduce((s, d) => s + d.earnings, 0);
  const preview = driverJobs.slice(0, 3);

  return (
    <div className="flex flex-col gap-base p-base">
      {/* Online toggle */}
      <Card padded className={driverOnline ? '' : '!border-error'}>
        <div className="flex items-center justify-between gap-base">
          <div className="min-w-0">
            <div className="text-caption-uppercase text-body">Trạng thái sẵn sàng</div>
            <div className="text-title-md text-ink">
              {driverOnline ? "Bạn đang trực tuyến" : "Bạn đang ngoại tuyến"}
            </div>
            <div className="text-caption text-body">
              {driverOnline ? 'Đang nhận công việc trong khu vực của bạn' : 'Chuyển đổi để bắt đầu nhận công việc'}
            </div>
          </div>
          <Switch checked={driverOnline} onChange={setDriverOnline} size="lg" />
        </div>
      </Card>

      {/* Earnings stat row */}
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Thu nhập hôm nay" value={formatVnd(today)} icon="cash" />
        <StatTile label="Tuần này" value={formatVnd(week)} icon="trending" />
      </div>

      {/* Active job */}
      {activeDriverJob ? (
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center gap-sm bg-canvas-soft px-sm py-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-on-primary">
              <Icon name="bike" size={14} />
            </span>
            <span className="text-caption-uppercase text-body">Giao hàng đang thực hiện</span>
            <Badge tone="live" dot className="ml-auto">Trực tiếp</Badge>
          </div>
          <div className="p-sm">
            <div className="text-title-sm text-ink">{activeDriverJob.restaurantName}</div>
            <div className="text-caption text-body">→ {activeDriverJob.customerName}</div>
            <Button
              className="mt-sm w-full"
              onClick={() => nav('/driver/active')}
              trailingIcon="arrowRight"
            >
              Tiếp tục giao hàng
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Nearby jobs preview */}
      {driverOnline && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-title-sm text-ink">Công việc gần đây</div>
            <Link to="/driver/jobs" className="text-button text-text-link hover:underline">
              Xem tất cả ({driverJobs.length})
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {preview.map((j) => (
              <Card key={j.id} padded={false} className="p-sm">
                <div className="flex items-start gap-sm">
                  <Image
                    src={j.restaurantAvatar}
                    alt={j.restaurantName}
                    className="h-10 w-10 rounded-md"
                    ratio="1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm font-semibold text-ink truncate">
                        {j.restaurantName}
                      </span>
                      <span className="nums text-title-sm text-ink">{formatVnd(j.earnings)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-caption text-body">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="pin" size={11} /> <span className="nums">{j.distanceKm}</span> km
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="clock" size={11} /> <span className="nums">{j.estMin}</span> phút
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => {
                    const active = acceptDriverJob(j.id);
                    if (active) nav('/driver/active');
                  }}
                >
                  Nhận đơn
                </Button>
              </Card>
            ))}
            {preview.length === 0 && (
              <Card padded className="text-center">
                <div className="text-body-sm text-body">Hiện không có công việc nào gần đây.</div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Hot zone tip */}
      <Card variant="dark" padded>
        <Badge tone="dark" className="!bg-surface-dark-elevated !text-on-dark">Khu vực nóng</Badge>
        <div className="mt-sm text-title-md">Williamsburg + LES</div>
        <p className="mt-1 text-body-sm text-on-dark-soft">
          Nhu cầu đang cao điểm. Thời gian chờ lấy hàng trung bình là <span className="nums">4 phút</span>.
        </p>
      </Card>
    </div>
  );
}

function StatTile({ label, value, icon }) {
  return (
    <Card padded={false} className="p-sm">
      <div className="flex items-start justify-between">
        <span className="text-caption-uppercase text-body">{label}</span>
        <span className="grid h-6 w-6 place-items-center rounded-md bg-surface-strong text-body">
          <Icon name={icon} size={12} />
        </span>
      </div>
      <div className="mt-1 nums text-display-sm text-ink leading-none">{value}</div>
    </Card>
  );
}
