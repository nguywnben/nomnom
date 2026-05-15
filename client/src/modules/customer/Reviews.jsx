import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import StarRating from '../../components/StarRating.jsx';
import Avatar from '../../components/Avatar.jsx';
import { Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { currentDriver, restaurants, sampleReviews } from '../../data/mock.js';

const QUICK_TAGS = ['Đúng giờ', 'Nguyên liệu tươi', 'Đóng gói cẩn thận', 'Tài xế thân thiện', 'Làm đúng yêu cầu'];

export default function Reviews() {
  const { id } = useParams();
  const nav = useNavigate();
  const r = restaurants.find((x) => x.id === id);
  const { pushToast } = useApp();
  const [foodRating, setFoodRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState('');

  const toggle = (t) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const submit = () => {
    if (!foodRating || !driverRating) {
      pushToast({ kind: 'error', title: 'Thêm đánh giá', message: 'Vui lòng đánh giá cả đồ ăn và tài xế.' });
      return;
    }
    pushToast({
      kind: 'success',
      title: 'Cảm ơn bạn đã đánh giá',
      message: `${r.name} và tài xế của bạn rất trân trọng điều này.`,
    });
    nav('/app/orders');
  };

  if (!r) return null;
  return (
    <div className="container-page py-xl">
      <Link to="/app/orders" className="inline-flex items-center gap-1 text-button text-body hover:text-ink">
        <Icon name="chevronLeft" size={14} /> Quay lại đơn hàng
      </Link>
      <div className="mt-2 mb-base">
        <div className="text-caption-uppercase text-body">Để lại đánh giá</div>
        <h1 className="text-display-lg text-ink">{r.name}</h1>
      </div>

      <div className="grid gap-xl lg:grid-cols-[1fr_360px]">
        <div className="space-y-base">
          <Card padded>
            <div className="flex items-center gap-sm">
              <img src={r.logo} alt="" className="h-12 w-12 rounded-md object-cover" />
              <div className="flex-1">
                <div className="text-title-md text-ink">{r.name}</div>
                <div className="text-caption text-body">Đồ ăn như thế nào?</div>
              </div>
              <StarRating value={foodRating} onChange={setFoodRating} size={22} />
            </div>
            <Textarea
              className="mt-base"
              rows={4}
              label="Kể thêm cho chúng tôi (không bắt buộc)"
              placeholder="Đế bánh Margherita hoàn hảo, rau húng quế hơi héo."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-sm flex flex-wrap gap-1">
              {QUICK_TAGS.map((t) => {
                const sel = tags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggle(t)}
                    className={
                      'rounded-pill border px-2.5 py-1 text-caption transition-colors ' +
                      (sel
                        ? 'border-ink bg-primary text-on-primary'
                        : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padded>
            <div className="flex items-center gap-sm">
              <Avatar src={currentDriver.avatar} name={currentDriver.name} />
              <div className="flex-1">
                <div className="text-title-md text-ink">{currentDriver.name}</div>
                <div className="text-caption text-body">Tài xế của bạn thế nào?</div>
              </div>
              <StarRating value={driverRating} onChange={setDriverRating} size={22} />
            </div>
          </Card>

          <div className="flex items-center justify-end gap-xs">
            <Button variant="secondary" onClick={() => nav('/app/orders')}>
              Bỏ qua
            </Button>
            <Button onClick={submit}>Gửi đánh giá</Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card padded>
            <div className="text-title-md text-ink mb-base">Những người khác đã nói gì</div>
            <div className="space-y-base">
              {sampleReviews.map((rev) => (
                <div key={rev.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Avatar src={rev.avatar} name={rev.author} size="sm" />
                    <span className="text-body-sm font-semibold text-ink">{rev.author}</span>
                    <Badge tone="outline">{rev.rating}★</Badge>
                  </div>
                  <p className="text-caption text-body">{rev.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
