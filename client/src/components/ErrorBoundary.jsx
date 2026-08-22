import { Component } from 'react';
import Button from './Button.jsx';

// ErrorBoundary toàn cục — chặn lỗi runtime gây trắng màn hình,
// hiện fallback thân thiện + nút tải lại.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center bg-canvas p-xl">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-pill bg-[#fbeaea] text-error">
              <span className="text-display-sm">!</span>
            </div>
            <h1 className="mt-base text-display-sm text-ink">Có lỗi xảy ra</h1>
            <p className="mt-xs text-body-sm text-body">
              Trang này đang gặp sự cố. Hãy tải lại — nếu vẫn tiếp diễn, liên hệ đội ngũ NomNom.
            </p>
            <Button
              className="mt-base"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              Tải lại trang
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}