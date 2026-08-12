import { Link } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Modal from '../../components/Modal.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

export default function DishQuickViewModal({ dish, onClose }) {
  if (!dish) return null;

  const image = dish.imageUrl ?? dish.image;
  const prepTime = Number(dish.prepTimeMin ?? 0);

  return (
    <Modal
      open={Boolean(dish)}
      onClose={onClose}
      title={dish.name}
      size="sm"
      hideHeader
      footer={
        <Button
          as={Link}
          to={`/app/restaurant/${dish.restaurantId}`}
          className="w-full"
          onClick={onClose}
          trailingIcon="arrowRight"
        >
          Xem thực đơn quán
        </Button>
      }
    >
      <div className="relative -mx-lg overflow-hidden bg-canvas-soft">
        <Image src={image} alt={dish.name} ratio="16/9" className="w-full" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dish preview"
          className="absolute right-sm top-sm grid h-8 w-8 place-items-center rounded-pill bg-surface-card/95 text-ink shadow-soft hover:bg-surface-card"
        >
          <Icon name="close" size={15} />
        </button>
      </div>

      <div className="mt-sm flex items-center justify-between gap-base">
        <div className="min-w-0">
          <h3 className="text-title-lg text-ink">{dish.name}</h3>
          <span className="block truncate text-body-sm text-body">{dish.restaurantName}</span>
        </div>
        <span className="shrink-0 nums text-title-md text-ink">{formatVnd(dish.price)}</span>
      </div>

      {(dish.description || prepTime > 0) && (
        <div className="mt-sm border-t border-hairline pt-sm">
          {dish.description && <p className="line-clamp-2 text-body-sm leading-relaxed text-body">{dish.description}</p>}
          {prepTime > 0 && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-caption text-body">
              <Icon name="clock" size={13} /> Chuẩn bị khoảng {prepTime} phút
            </span>
          )}
        </div>
      )}
    </Modal>
  );
}
