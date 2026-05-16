import { Navigate, Route, Routes } from 'react-router-dom';

import ToastViewport from './components/Toast.jsx';
import Landing from './pages/Landing.jsx';
import PartnerFaq from './pages/PartnerFaq.jsx';
import MerchantPartnerContact from './pages/MerchantPartnerContact.jsx';

// Customer
import CustomerLayout from './modules/customer/CustomerLayout.jsx';
import CustomerHome from './modules/customer/Home.jsx';
import CustomerSearch from './modules/customer/Search.jsx';
import CustomerRestaurant from './modules/customer/Restaurant.jsx';
import CustomerTracking from './modules/customer/Tracking.jsx';
import CustomerOrders from './modules/customer/Orders.jsx';
import CustomerReviews from './modules/customer/Reviews.jsx';
import CustomerCheckout from './modules/customer/Checkout.jsx';
import CustomerOrderSuccess from './modules/customer/OrderSuccess.jsx';
import CustomerProfile from './modules/customer/Profile.jsx';
import CustomerProfileEdit from './modules/customer/profile/EditProfile.jsx';
import CustomerProfileAddresses from './modules/customer/profile/Addresses.jsx';
import CustomerProfilePayments from './modules/customer/profile/Payments.jsx';
import CustomerProfilePromotions from './modules/customer/profile/Promotions.jsx';
import CustomerProfileNotifications from './modules/customer/profile/Notifications.jsx';
import CustomerProfileSettings from './modules/customer/profile/Settings.jsx';

// Merchant
import MerchantLayout from './modules/merchant/MerchantLayout.jsx';
import MerchantDashboard from './modules/merchant/Dashboard.jsx';
import MerchantOrders from './modules/merchant/Orders.jsx';
import MerchantMenu from './modules/merchant/Menu.jsx';
import MerchantPromotions from './modules/merchant/Promotions.jsx';

// Driver
import DriverShell from './modules/driver/DriverShell.jsx';
import DriverHome from './modules/driver/Home.jsx';
import DriverJobs from './modules/driver/JobPool.jsx';
import DriverActive from './modules/driver/ActiveDelivery.jsx';
import DriverWallet from './modules/driver/Wallet.jsx';
import DriverAccount from './modules/driver/Account.jsx';

// Admin
import AdminLayout from './modules/admin/AdminLayout.jsx';
import AdminOverview from './modules/admin/Overview.jsx';
import AdminAccounts from './modules/admin/Accounts.jsx';
import AdminFinancial from './modules/admin/Financial.jsx';

// Chat
import ChatScreen from './modules/chat/ChatScreen.jsx';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/faq" element={<PartnerFaq />} />
        <Route path="/hop-tac" element={<MerchantPartnerContact />} />

        <Route path="/app" element={<CustomerLayout />}>
          <Route index element={<CustomerHome />} />
          <Route path="search" element={<CustomerSearch />} />
          <Route path="restaurant/:id" element={<CustomerRestaurant />} />
          <Route path="checkout" element={<CustomerCheckout />} />
          <Route path="order/success/:id" element={<CustomerOrderSuccess />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="track/:id" element={<CustomerTracking />} />
          <Route path="reviews/:id" element={<CustomerReviews />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="profile/edit" element={<CustomerProfileEdit />} />
          <Route path="profile/addresses" element={<CustomerProfileAddresses />} />
          <Route path="profile/payments" element={<CustomerProfilePayments />} />
          <Route path="profile/promotions" element={<CustomerProfilePromotions />} />
          <Route path="profile/notifications" element={<CustomerProfileNotifications />} />
          <Route path="profile/settings" element={<CustomerProfileSettings />} />
        </Route>

        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<MerchantDashboard />} />
          <Route path="orders" element={<MerchantOrders />} />
          <Route path="menu" element={<MerchantMenu />} />
          <Route path="promotions" element={<MerchantPromotions />} />
        </Route>

        <Route path="/driver" element={<DriverShell />}>
          <Route index element={<DriverHome />} />
          <Route path="jobs" element={<DriverJobs />} />
          <Route path="active" element={<DriverActive />} />
          <Route path="wallet" element={<DriverWallet />} />
          <Route path="account" element={<DriverAccount />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="financial" element={<AdminFinancial />} />
        </Route>

        <Route path="/chat/:id" element={<ChatScreen />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastViewport />
    </>
  );
}
