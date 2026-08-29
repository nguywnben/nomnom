import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ToastViewport from './components/Toast.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import RedirectIfAuthed from './components/RedirectIfAuthed.jsx';
import Landing from './pages/Landing.jsx';
import PartnerFaq from './pages/PartnerFaq.jsx';
import NotFoundPage from './pages/NotFound.jsx';

// Auth
import LoginPage from './pages/auth/Login.jsx';
import RegisterPage from './pages/auth/Register.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPassword.jsx';
import VerifyOtpPage from './pages/auth/VerifyOtp.jsx';
import ResetPasswordPage from './pages/auth/ResetPassword.jsx';
import TermsOfServicePage from './pages/legal/TermsOfService.jsx';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicy.jsx';

// Code-split các module nặng: chỉ tải khi vào route tương ứng.
const CustomerLayout = lazy(() => import('./modules/customer/CustomerLayout.jsx'));
const CustomerHome = lazy(() => import('./modules/customer/Home.jsx'));
const CustomerSearch = lazy(() => import('./modules/customer/Search.jsx'));
const CustomerRestaurant = lazy(() => import('./modules/customer/Restaurant.jsx'));
const CustomerDishDetail = lazy(() => import('./modules/customer/DishDetail.jsx'));
const CustomerDishReviews = lazy(() => import('./modules/customer/DishReviews.jsx'));
const CustomerTracking = lazy(() => import('./modules/customer/Tracking.jsx'));
const CustomerOrders = lazy(() => import('./modules/customer/Orders.jsx'));
const CustomerReviews = lazy(() => import('./modules/customer/Reviews.jsx'));
const CustomerRestaurantReviews = lazy(() => import('./modules/customer/RestaurantReviews.jsx'));
const CustomerCheckout = lazy(() => import('./modules/customer/Checkout.jsx'));
const CustomerOrderSuccess = lazy(() => import('./modules/customer/OrderSuccess.jsx'));
const CustomerProfile = lazy(() => import('./modules/customer/Profile.jsx'));
const CustomerProfileEdit = lazy(() => import('./modules/customer/profile/EditProfile.jsx'));
const CustomerProfileAddresses = lazy(() => import('./modules/customer/profile/Addresses.jsx'));
const CustomerProfilePromotions = lazy(() => import('./modules/customer/profile/Promotions.jsx'));
const CustomerProfileSettings = lazy(() => import('./modules/customer/profile/Settings.jsx'));
const CustomerNotifications = lazy(() => import('./modules/customer/Notifications.jsx'));
const VnpayReturn = lazy(() => import('./modules/customer/VnpayReturn.jsx'));

const MerchantLayout = lazy(() => import('./modules/merchant/MerchantLayout.jsx'));
const MerchantDashboard = lazy(() => import('./modules/merchant/Dashboard.jsx'));
const MerchantOrders = lazy(() => import('./modules/merchant/Orders.jsx'));
const MerchantMenu = lazy(() => import('./modules/merchant/Menu.jsx'));
const MerchantPromotions = lazy(() => import('./modules/merchant/Promotions.jsx'));
const MerchantOnboarding = lazy(() => import('./modules/merchant/Onboarding.jsx'));
const MerchantPending = lazy(() => import('./modules/merchant/Pending.jsx'));
const MerchantSettings = lazy(() => import('./modules/merchant/Settings.jsx'));
const MerchantReviews = lazy(() => import('./modules/merchant/Reviews.jsx'));
const MerchantWallet = lazy(() => import('./modules/merchant/Wallet.jsx'));
const MerchantNotifications = lazy(() => import('./modules/merchant/Notifications.jsx'));

const AdminLayout = lazy(() => import('./modules/admin/AdminLayout.jsx'));
const AdminOverview = lazy(() => import('./modules/admin/Overview.jsx'));
const AdminAccounts = lazy(() => import('./modules/admin/Accounts.jsx'));
const AdminFinancial = lazy(() => import('./modules/admin/Financial.jsx'));
const AdminRestaurantApprovals = lazy(() => import('./modules/admin/RestaurantApprovals.jsx'));
const AdminPayouts = lazy(() => import('./modules/admin/Payouts.jsx'));
const AdminOrders = lazy(() => import('./modules/admin/Orders.jsx'));
const AdminReviewsModeration = lazy(() => import('./modules/admin/ReviewsModeration.jsx'));
const AdminPromotions = lazy(() => import('./modules/admin/Promotions.jsx'));
const AdminConfig = lazy(() => import('./modules/admin/Config.jsx'));
const AdminCuisines = lazy(() => import('./modules/admin/Cuisines.jsx'));
const AdminCustomerHome = lazy(() => import('./modules/admin/CustomerHomeManagement.jsx'));
const AdminAuditLogs = lazy(() => import('./modules/admin/AuditLogs.jsx'));

const ChatScreen = lazy(() => import('./modules/chat/ChatScreen.jsx'));

function SuspenseRoute({ children }) {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center p-xl text-body">Đang tải…</div>}>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/faq" element={<PartnerFaq />} />
        <Route path="/hop-tac" element={<Navigate to="/merchant/onboarding" replace />} />

        {/* Auth — đã đăng nhập thì không vào, chuyển /app */}
        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route path="/dieu-khoan-su-dung" element={<Navigate to="/terms-of-service" replace />} />
        <Route path="/chinh-sach-bao-mat" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        <Route path="/app" element={<SuspenseRoute><CustomerLayout /></SuspenseRoute>}>
          <Route index element={<SuspenseRoute><CustomerHome /></SuspenseRoute>} />
          <Route path="search" element={<SuspenseRoute><CustomerSearch /></SuspenseRoute>} />
          <Route path="restaurant/:id" element={<SuspenseRoute><CustomerRestaurant /></SuspenseRoute>} />
          <Route path="dish/:id" element={<SuspenseRoute><CustomerDishDetail /></SuspenseRoute>} />
          <Route path="dish/:id/reviews" element={<SuspenseRoute><CustomerDishReviews /></SuspenseRoute>} />
          <Route path="reviews/:id" element={<SuspenseRoute><CustomerRestaurantReviews /></SuspenseRoute>} />

          <Route element={<RequireAuth role="customer" />}>
            <Route path="checkout" element={<SuspenseRoute><CustomerCheckout /></SuspenseRoute>} />
            <Route path="checkout/vnpay/return" element={<SuspenseRoute><VnpayReturn /></SuspenseRoute>} />
            <Route path="order/success/:id" element={<SuspenseRoute><CustomerOrderSuccess /></SuspenseRoute>} />
            <Route path="orders" element={<SuspenseRoute><CustomerOrders /></SuspenseRoute>} />
            <Route path="track/:id" element={<SuspenseRoute><CustomerTracking /></SuspenseRoute>} />
            <Route path="profile/addresses" element={<SuspenseRoute><CustomerProfileAddresses /></SuspenseRoute>} />
            <Route path="profile/promotions" element={<SuspenseRoute><CustomerProfilePromotions /></SuspenseRoute>} />
            <Route path="reviews/write/:id" element={<SuspenseRoute><CustomerReviews /></SuspenseRoute>} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="notifications" element={<SuspenseRoute><CustomerNotifications /></SuspenseRoute>} />
            <Route path="profile" element={<SuspenseRoute><CustomerProfile /></SuspenseRoute>} />
            <Route path="profile/edit" element={<SuspenseRoute><CustomerProfileEdit /></SuspenseRoute>} />
            <Route path="profile/settings" element={<SuspenseRoute><CustomerProfileSettings /></SuspenseRoute>} />
          </Route>
        </Route>

        {/* Merchant onboarding/pending — không dùng layout chính, chỉ yêu cầu đăng nhập */}
        <Route element={<RequireAuth />}>
          <Route path="/merchant/onboarding" element={<SuspenseRoute><MerchantOnboarding /></SuspenseRoute>} />
          <Route path="/merchant/pending" element={<SuspenseRoute><MerchantPending /></SuspenseRoute>} />
        </Route>

        <Route element={<RequireAuth role="merchant" />}>
          <Route path="/merchant" element={<SuspenseRoute><MerchantLayout /></SuspenseRoute>}>
            <Route index element={<SuspenseRoute><MerchantDashboard /></SuspenseRoute>} />
            <Route path="orders" element={<SuspenseRoute><MerchantOrders /></SuspenseRoute>} />
            <Route path="menu" element={<SuspenseRoute><MerchantMenu /></SuspenseRoute>} />
            <Route path="promotions" element={<SuspenseRoute><MerchantPromotions /></SuspenseRoute>} />
            <Route path="reviews" element={<SuspenseRoute><MerchantReviews /></SuspenseRoute>} />
            <Route path="wallet" element={<SuspenseRoute><MerchantWallet /></SuspenseRoute>} />
            <Route path="settings" element={<SuspenseRoute><MerchantSettings /></SuspenseRoute>} />
            <Route path="notifications" element={<SuspenseRoute><MerchantNotifications /></SuspenseRoute>} />
          </Route>
        </Route>

        <Route element={<RequireAuth role="admin" />}>
          <Route path="/admin" element={<SuspenseRoute><AdminLayout /></SuspenseRoute>}>
            <Route index element={<SuspenseRoute><AdminOverview /></SuspenseRoute>} />
            <Route path="accounts" element={<SuspenseRoute><AdminAccounts /></SuspenseRoute>} />
            <Route path="promotions" element={<SuspenseRoute><AdminPromotions /></SuspenseRoute>} />
            <Route path="financial" element={<SuspenseRoute><AdminFinancial /></SuspenseRoute>} />
            <Route path="restaurants" element={<SuspenseRoute><AdminRestaurantApprovals /></SuspenseRoute>} />
            <Route path="payouts" element={<SuspenseRoute><AdminPayouts /></SuspenseRoute>} />
            <Route path="orders" element={<SuspenseRoute><AdminOrders /></SuspenseRoute>} />
            <Route path="reviews" element={<SuspenseRoute><AdminReviewsModeration /></SuspenseRoute>} />
            <Route path="cuisines" element={<SuspenseRoute><AdminCuisines /></SuspenseRoute>} />
            <Route path="customer-home" element={<SuspenseRoute><AdminCustomerHome /></SuspenseRoute>} />
            <Route path="config" element={<SuspenseRoute><AdminConfig /></SuspenseRoute>} />
            <Route path="audit-logs" element={<SuspenseRoute><AdminAuditLogs /></SuspenseRoute>} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/chat/:id" element={<SuspenseRoute><ChatScreen /></SuspenseRoute>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastViewport />
    </ErrorBoundary>
  );
}