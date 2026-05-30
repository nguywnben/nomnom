import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  initialOrders,
  initialDriverJobs,
  initialMerchantOrders,
  initialAdminAccounts,
  initialPayouts,
  initialChats,
  promoCodes,
} from '../data/mock.js';
import { formatVnd } from '../lib/formatVnd.js';
import { buildAuthedRoles } from '../lib/auth.js';
import { clearTokens, hasStoredSession, saveTokens } from '../lib/authStorage.js';
import { fetchMe, loginApi, logoutApi, registerSendCodeApi, registerVerifyApi } from '../lib/api.js';

const AppContext = createContext(null);

let toastId = 0;
const newId = () => `id-${Date.now()}-${++toastId}`;

export function AppProvider({ children }) {
  const navigate = useNavigate();

  // Auth / role
  const [role, setRole] = useState('customer');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const authedRoles = useMemo(
    () => (user ? buildAuthedRoles(user.roles) : buildAuthedRoles([])),
    [user],
  );

  const currentCustomer = useMemo(() => {
    if (!user || !authedRoles.customer) return null;
    return {
      id: String(user.id),
      name: user.fullName,
      email: user.email ?? '',
      phone: user.phone ?? '',
      avatar: user.avatarUrl,
      address: '',
    };
  }, [user, authedRoles.customer]);

  const currentDriver = useMemo(() => {
    if (!user || !authedRoles.driver) return null;
    return {
      id: String(user.id),
      name: user.fullName,
      email: user.email ?? '',
      phone: user.phone ?? '',
      avatar: user.avatarUrl,
      vehicle: '—',
      rating: 4.9,
      trips: 0,
    };
  }, [user, authedRoles.driver]);

  const currentMerchant = useMemo(() => {
    if (!user || !authedRoles.merchant) return null;
    return {
      id: String(user.id),
      name: user.fullName,
      email: user.email ?? '',
      avatar: user.avatarUrl,
      restaurantId: 'r-1',
    };
  }, [user, authedRoles.merchant]);

  const currentAdmin = useMemo(() => {
    if (!user) return null;
    return {
      id: String(user.id),
      name: user.fullName,
      email: user.email ?? '',
      avatar: user.avatarUrl,
      role: authedRoles.admin ? 'Quản trị viên' : 'Người dùng',
    };
  }, [user, authedRoles.admin]);

  // Cart (customer)
  const [cart, setCart] = useState({ restaurantId: null, items: [] });
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((t) => {
    const id = newId();
    const toast = {
      id,
      kind: 'info',
      title: '',
      message: '',
      duration: 3600,
      ...t,
    };
    setToasts((cur) => [...cur, toast]);
    if (toast.duration) {
      setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== id));
      }, toast.duration);
    }
    return id;
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  // Orders (customer-side history)
  const [orders, setOrders] = useState(initialOrders);

  // Merchant — orders kanban
  const [merchantOrders, setMerchantOrders] = useState(initialMerchantOrders);

  // Driver — job pool + active job
  const [driverOnline, setDriverOnline] = useState(true);
  const [driverJobs, setDriverJobs] = useState(initialDriverJobs);
  const [activeDriverJob, setActiveDriverJob] = useState(null);

  // Admin — accounts, payouts, config
  const [adminAccounts, setAdminAccounts] = useState(initialAdminAccounts);
  const [payouts, setPayouts] = useState(initialPayouts);
  const [commissionRate, setCommissionRate] = useState(18); // %

  // Chats
  const [chats, setChats] = useState(initialChats);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(initialChats[0]?.id ?? null);

  // ---- Cart helpers ----
  const cartCount = useMemo(
    () => cart.items.reduce((s, i) => s + i.quantity, 0),
    [cart.items],
  );
  const cartSubtotal = useMemo(
    () => cart.items.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart.items],
  );
  const deliveryFee = cart.items.length ? 62000 : 0;
  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.kind === 'percent') return Math.min(cartSubtotal * (appliedPromo.amount / 100), appliedPromo.cap ?? 9e9);
    return Math.min(appliedPromo.amount, cartSubtotal);
  }, [appliedPromo, cartSubtotal]);
  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - discount);

  const simulateSync = useRef(null);
  const triggerSync = useCallback(() => {
    if (!authedRoles.customer) return;
    setSyncing(true);
    clearTimeout(simulateSync.current);
    simulateSync.current = setTimeout(() => setSyncing(false), 700);
  }, [authedRoles.customer]);

  const addToCart = useCallback(
    (restaurantId, item, qty = 1) => {
      setCart((cur) => {
        // Different restaurant -> reset
        if (cur.restaurantId && cur.restaurantId !== restaurantId) {
          return { restaurantId, items: [{ ...item, quantity: qty }] };
        }
        const existing = cur.items.find((i) => i.id === item.id);
        const items = existing
          ? cur.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + qty } : i))
          : [...cur.items, { ...item, quantity: qty }];
        return { restaurantId, items };
      });
      triggerSync();
      pushToast({ kind: 'success', title: 'Đã thêm vào giỏ hàng', message: item.name, duration: 2200 });
    },
    [pushToast, triggerSync],
  );

  const setItemQty = useCallback(
    (itemId, qty) => {
      setCart((cur) => {
        const items = cur.items
          .map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))
          .filter((i) => i.quantity > 0);
        return { ...cur, items, restaurantId: items.length ? cur.restaurantId : null };
      });
      triggerSync();
    },
    [triggerSync],
  );

  const removeFromCart = useCallback(
    (itemId) => setItemQty(itemId, 0),
    [setItemQty],
  );

  const clearCart = useCallback(() => {
    setCart({ restaurantId: null, items: [] });
    setAppliedPromo(null);
  }, []);

  const applyPromo = useCallback(
    (code) => {
      const c = promoCodes.find((p) => p.code.toLowerCase() === code.trim().toLowerCase());
      if (!c) {
        pushToast({ kind: 'error', title: 'Mã không hợp lệ', message: `"${code}" không phải là mã khuyến mãi hợp lệ.` });
        return false;
      }
      setAppliedPromo(c);
      pushToast({ kind: 'success', title: 'Đã áp dụng khuyến mãi', message: c.label });
      return true;
    },
    [pushToast],
  );

  // ---- Order placement (customer) ----
  const placeOrder = useCallback(
    (payment) => {
      const order = {
        id: 'ord-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        restaurantId: cart.restaurantId,
        items: cart.items,
        subtotal: cartSubtotal,
        deliveryFee,
        discount,
        total: cartTotal,
        payment,
        status: 'preparing',
        placedAt: Date.now(),
        driverId: 'drv-1',
        eta: 28,
      };
      setOrders((cur) => [order, ...cur]);
      // Mirror into merchant kanban
      setMerchantOrders((cur) => ({
        ...cur,
        new: [
          {
            id: order.id,
            customerName: currentCustomer?.name ?? 'Khách',
            items: cart.items,
            total: cartTotal,
            placedAt: order.placedAt,
            note: '',
          },
          ...cur.new,
        ],
      }));
      clearCart();
      return order;
    },
    [cart, cartSubtotal, deliveryFee, discount, cartTotal, clearCart, currentCustomer],
  );

  // ---- Driver helpers ----
  const acceptDriverJob = useCallback(
    (jobId) => {
      // Edge-case: occasionally show "Job already taken"
      const alreadyTaken = Math.random() < 0.25;
      if (alreadyTaken) {
        pushToast({
          kind: 'error',
          title: 'Công việc đã có người nhận',
          message: 'Tài xế khác đã nhanh tay hơn. Hãy thử công việc khác nhé.',
        });
        setDriverJobs((cur) => cur.filter((j) => j.id !== jobId));
        return null;
      }
      const job = driverJobs.find((j) => j.id === jobId);
      if (!job) return null;
      setDriverJobs((cur) => cur.filter((j) => j.id !== jobId));
      const active = { ...job, step: 'to-merchant', startedAt: Date.now() };
      setActiveDriverJob(active);
      pushToast({ kind: 'success', title: 'Đã nhận công việc', message: `Lấy hàng tại ${job.restaurantName}` });
      return active;
    },
    [driverJobs, pushToast],
  );
  const advanceDriverStep = useCallback(
    (proofUrl) => {
      setActiveDriverJob((cur) => {
        if (!cur) return cur;
        const order = ['to-merchant', 'at-merchant', 'to-customer', 'delivered'];
        const next = order[Math.min(order.indexOf(cur.step) + 1, order.length - 1)];
        if (next === 'delivered') {
          pushToast({
            kind: 'success',
            title: 'Đã giao hàng',
            message: `+${formatVnd(cur.earnings)} đã vào ví`,
          });
          setTimeout(() => setActiveDriverJob(null), 1500);
          return { ...cur, step: next, proofUrl };
        }
        return { ...cur, step: next };
      });
    },
    [pushToast],
  );

  // ---- Merchant helpers ----
  const moveMerchantOrder = useCallback((id, from, to) => {
    setMerchantOrders((cur) => {
      const item = cur[from].find((o) => o.id === id);
      if (!item) return cur;
      return {
        ...cur,
        [from]: cur[from].filter((o) => o.id !== id),
        [to]: [{ ...item }, ...cur[to]],
      };
    });
  }, []);

  // ---- Admin helpers ----
  const setAccountStatus = useCallback((id, status) => {
    setAdminAccounts((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);
  const resolvePayout = useCallback((id, decision) => {
    setPayouts((cur) => cur.map((p) => (p.id === id ? { ...p, status: decision } : p)));
  }, []);

  // ---- Chat helpers ----
  const sendChat = useCallback((chatId, text, senderId = 'me') => {
    setChats((cur) =>
      cur.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, { id: newId(), senderId, text, at: Date.now() }],
            }
          : c,
      ),
    );
    // Simulate the other side replying briefly later
    setTimeout(() => {
      setChats((cur) =>
        cur.map((c) => {
          if (c.id !== chatId) return c;
          const replier = c.participants.find((p) => p.id !== senderId);
          if (!replier) return c;
          const reply = autoReply(c, text);
          return {
            ...c,
            messages: [
              ...c.messages,
              { id: newId(), senderId: replier.id, text: reply, at: Date.now() },
            ],
          };
        }),
      );
    }, 1200 + Math.random() * 1200);
  }, []);

  // Khôi phục phiên JWT khi reload trang
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasStoredSession()) {
        if (!cancelled) setAuthReady(true);
        return;
      }
      try {
        const { user: me } = await fetchMe();
        if (!cancelled) {
          setUser(me);
          setRole(me.primaryRole);
        }
      } catch {
        clearTokens();
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password, { remember = true } = {}) => {
    const data = await loginApi(email, password, remember);
    saveTokens(data.accessToken, data.refreshToken, { remember });
    setUser(data.user);
    setRole(data.user.primaryRole);
    return data.user;
  }, []);

  const registerSendCode = useCallback(async ({ fullName, email, password }) => {
    return registerSendCodeApi({ fullName, email, password });
  }, []);

  const completeRegistration = useCallback(async (email, code) => {
    const data = await registerVerifyApi({ email, code });
    saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setRole('customer');
    return data.user;
  }, []);

  const logout = useCallback(
    async ({ redirectTo = '/app', silent = false } = {}) => {
      await logoutApi().catch(() => {});
      clearTokens();
      setUser(null);
      setRole('customer');
      clearCart();
      if (!silent) {
        pushToast({
          kind: 'info',
          title: 'Đã đăng xuất',
          message: 'Hẹn gặp lại bạn ở NomNom.',
          duration: 2800,
        });
      }
      navigate(redirectTo, { replace: true });
    },
    [clearCart, navigate, pushToast],
  );

  // Simulate live "new order" pings to merchant every ~25s if window stays open
  useEffect(() => {
    if (role !== 'merchant') return undefined;
    const t = setInterval(() => {
      const ghostId = 'live-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      setMerchantOrders((cur) => ({
        ...cur,
        new: [
          {
            id: ghostId,
            customerName: ['Mia C.', 'Owen T.', 'Lia D.', 'Rae P.'][Math.floor(Math.random() * 4)],
            items: [
              { id: 'm1', name: 'Margherita', price: 338000, quantity: 1 },
              { id: 'm2', name: 'Flat White', price: 120000, quantity: 1 },
            ],
            total: 458000,
            placedAt: Date.now(),
            note: 'Làm ơn cho thêm khăn giấy',
            isNew: true,
          },
          ...cur.new,
        ],
      }));
      pushToast({
        kind: 'info',
        title: 'Nhận được đơn hàng mới',
        message: ghostId,
        duration: 5000,
        sound: true,
      });
    }, 28000);
    return () => clearInterval(t);
  }, [role, pushToast]);

  const value = {
    role,
    setRole,
    user,
    authReady,
    login,
    registerSendCode,
    completeRegistration,
    logout,
    authedRoles,

    cart,
    cartOpen,
    setCartOpen,
    cartCount,
    cartSubtotal,
    deliveryFee,
    discount,
    cartTotal,
    appliedPromo,
    applyPromo,
    setAppliedPromo,
    syncing,
    addToCart,
    setItemQty,
    removeFromCart,
    clearCart,

    toasts,
    pushToast,
    dismissToast,

    orders,
    placeOrder,

    merchantOrders,
    setMerchantOrders,
    moveMerchantOrder,

    driverOnline,
    setDriverOnline,
    driverJobs,
    activeDriverJob,
    acceptDriverJob,
    advanceDriverStep,
    setActiveDriverJob,

    adminAccounts,
    setAccountStatus,
    payouts,
    resolvePayout,
    commissionRate,
    setCommissionRate,

    chats,
    sendChat,
    chatOpen,
    setChatOpen,
    activeChatId,
    setActiveChatId,

    currentCustomer,
    currentDriver,
    currentMerchant,
    currentAdmin,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

// ---------- helpers ----------
function autoReply(chat, text) {
  const role = chat.participants.find((p) => p.id !== 'me')?.role;
  const t = text.toLowerCase();
  if (role === 'driver') {
    if (t.includes('where')) return "Tôi đang cách đây 5 phút — chuẩn bị rời khỏi nhà hàng.";
    if (t.includes('door') || t.includes('apartment')) return 'Đã rõ, tôi sẽ để ở quầy lễ tân.';
    return 'Đã hiểu, tôi đang trên đường đến.';
  }
  if (role === 'merchant') {
    if (t.includes('substitute') || t.includes('out of'))
      return "Chúng tôi có thể thay Margherita cho Funghi — cùng giá. Bạn thấy sao?";
    return 'Cảm ơn — đã xác nhận và đang chuẩn bị.';
  }
  if (role === 'admin') {
    if (t.includes('refund')) return "Tôi đã mở phiếu yêu cầu #4821 để hoàn tiền cho bạn — tiền sẽ về sau 1-2 ngày.";
    return "Chào bạn, tôi là Avery từ bộ phận hỗ trợ. Tôi có thể giúp gì cho bạn hôm nay?";
  }
  return 'Đã hiểu — cảm ơn bạn.';
}
