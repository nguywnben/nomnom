import Icon from './Icon.jsx';

export default function EmptyState({ icon = 'package', title, message, description, action, className = '' }) {
  const text = message || description;
  return (
    <div
      className={`flex flex-col items-center justify-center gap-sm rounded-lg border border-dashed border-hairline-strong bg-canvas-soft p-xxl text-center ${className}`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-md bg-surface-strong text-body">
        <Icon name={icon} size={20} />
      </div>
      <div className="text-title-md text-ink">{title}</div>
      {text && <div className="max-w-md text-body-sm text-body">{text}</div>}
      {action}
    </div>
  );
}
