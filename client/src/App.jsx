import { Navigate, Route, Routes } from 'react-router-dom';

import ToastViewport from './components/Toast.jsx';
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

// Customer
import CustomerLayout from './modules/customer/CustomerLayout.jsx';
import CustomerHome from './modules/customer/Home.jsx';
import CustomerSearch from './modules/customer/Search.jsx';
import CustomerRestaurant from './modules/customer/Restaurant.jsx';
import CustomerDishDetail from './modules/customer/DishDetail.jsx';
import CustomerTracking from './modules/customer/Tracking.jsx';
import CustomerOrders from './modules/customer/Orders.jsx';
import CustomerReviews from './modules/customer/Reviews.jsx';
import CustomerRestaurantReviews from './modules/customer/RestaurantReviews.jsx';
import CustomerCheckout from './modules/customer/Checkout.jsx';
import CustomerOrderSuccess from './modules/customer/OrderSuccess.jsx';
import CustomerProfile from './modules/customer/Profile.jsx';
import CustomerProfileEdit from './modules/customer/profile/EditProfile.jsx';
import CustomerProfileAddresses from './modules/customer/profile/Addresses.jsx';
import CustomerProfilePromotions from './modules/customer/profile/Promotions.jsx';
import CustomerProfileNotifications from './modules/customer/profile/Notifications.jsx';
import CustomerProfileSettings from './modules/customer/profile/Settings.jsx';
import CustomerNotifications from './modules/customer/Notifications.jsx';
import VnpayReturn from './modules/customer/VnpayReturn.jsx';

// Merchant
import MerchantLayout from './modules/merchant/MerchantLayout.jsx';
import MerchantDashboard from './modules/merchant/Dashboard.jsx';
import MerchantOrders from './modules/merchant/Orders.jsx';
import MerchantMenu from './modules/merchant/Menu.jsx';
import MerchantPromotions from './modules/merchant/Promotions.jsx';
import MerchantOnboarding from './modules/merchant/Onboarding.jsx';
import MerchantPending from './modules/merchant/Pending.jsx';
import MerchantSettings from './modules/merchant/Settings.jsx';
import MerchantReviews from './modules/merchant/Reviews.jsx';
import MerchantWallet from './modules/merchant/Wallet.jsx';
import MerchantNotifications from './modules/merchant/Notifications.jsx';

// Admin
import AdminLayout from './modules/admin/AdminLayout.jsx';
import AdminOverview from './modules/admin/Overview.jsx';
import AdminAccounts from './modules/admin/Accounts.jsx';
import AdminFinancial from './modules/admin/Financial.jsx';
import AdminRestaurantApprovals from './modules/admin/RestaurantApprovals.jsx';
import AdminPayouts from './modules/admin/Payouts.jsx';
import AdminOrders from './modules/admin/Orders.jsx';
import AdminReviewsModeration from './modules/admin/ReviewsModeration.jsx';
import AdminConfig from './modules/admin/Config.jsx';
import AdminCuisines from './modules/admin/Cuisines.jsx';
import AdminAuditLogs from './modules/admin/AuditLogs.jsx';

// Chat
import ChatScreen from './modules/chat/ChatScreen.jsx';

export default function App() {
  return (
    <>
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

        <Route path="/app" element={<CustomerLayout />}>
          <Route index element={<CustomerHome />} />
          <Route path="search" element={<CustomerSearch />} />
          <Route path="restaurant/:id" element={<CustomerRestaurant />} />
          <Route path="dish/:id" element={<CustomerDishDetail />} />

          <Route element={<RequireAuth role="customer" />}>
            <Route path="checkout" element={<CustomerCheckout />} />
            <Route path="checkout/vnpay/return" element={<VnpayReturn />} />
            <Route path="order/success/:id" element={<CustomerOrderSuccess />} />
            <Route path="orders" element={<CustomerOrders />} />
            <Route path="track/:id" element={<CustomerTracking />} />
            <Route path="profile/addresses" element={<CustomerProfileAddresses />} />
            <Route path="profile/notifications" element={<CustomerProfileNotifications />} />
            <Route path="profile/promotions" element={<CustomerProfilePromotions />} />
            <Route path="reviews/write/:id" element={<CustomerReviews />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="reviews/:id" element={<CustomerRestaurantReviews />} />
            <Route path="notifications" element={<CustomerNotifications />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="profile/edit" element={<CustomerProfileEdit />} />
            <Route path="profile/settings" element={<CustomerProfileSettings />} />
          </Route>
        </Route>

        {/* Merchant onboarding/pending — không dùng layout chính, chỉ yêu cầu đăng nhập */}
        <Route element={<RequireAuth />}>
          <Route path="/merchant/onboarding" element={<MerchantOnboarding />} />
          <Route path="/merchant/pending" element={<MerchantPending />} />
        </Route>

        <Route element={<RequireAuth role="merchant" />}>
          <Route path="/merchant" element={<MerchantLayout />}>
            <Route index element={<MerchantDashboard />} />
            <Route path="orders" element={<MerchantOrders />} />
            <Route path="menu" element={<MerchantMenu />} />
            <Route path="promotions" element={<MerchantPromotions />} />
            <Route path="reviews" element={<MerchantReviews />} />
            <Route path="wallet" element={<MerchantWallet />} />
            <Route path="settings" element={<MerchantSettings />} />
            <Route path="notifications" element={<MerchantNotifications />} />
          </Route>
        </Route>

        <Route element={<RequireAuth role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="accounts" element={<AdminAccounts />} />
            <Route path="financial" element={<AdminFinancial />} />
            <Route path="restaurants" element={<AdminRestaurantApprovals />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reviews" element={<AdminReviewsModeration />} />
            <Route path="cuisines" element={<AdminCuisines />} />
            <Route path="config" element={<AdminConfig />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/chat/:id" element={<ChatScreen />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastViewport />
    </>
  );
}
