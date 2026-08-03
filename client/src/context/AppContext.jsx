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
import { buildPermittedRoles } from '../lib/auth.js';
import { canShopAsCustomer, getCustomerCartRestriction } from '../lib/customerCart.js';
import { clearTokens, hasStoredSession, saveTokens } from '../lib/authStorage.js';
import {
  addCartItemApi,
  clearCartApi,
  deleteCartItemApi,
  fetchCartApi,
  fetchMe,
  loginApi,
  logoutApi,
  registerSendCodeApi,
  registerVerifyApi,
  fetchRestaurantVouchersApi,
  updateCartItemApi,
  validateVoucherApi,
} from '../lib/api.js';
import { clearGuestCart, loadGuestCart, saveGuestCart } from '../lib/guestCart.js';

const AppContext = createContext(null);

let toastId = 0;
const newId = () => `id-${Date.now()}-${++toastId}`;

export function AppProvider({ children }) {
  const navigate = useNavigate();

  // Auth / role
  const [role, setRole] = useState('customer');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const permittedRoles = useMemo(
    () => (user ? buildPermittedRoles(user.roles) : buildPermittedRoles([])),
    [user],
  );

  const shopAsCustomer = useMemo(
    () => canShopAsCustomer(user, permittedRoles),
    [permittedRoles, user],
  );

  const customerCartRestriction = useMemo(
    () => getCustomerCartRestriction(user, permittedRoles),
    [permittedRoles, user],
  );

  const cartHydratedKey = useRef(null);

  const currentCustomer = useMemo(() => {
    if (!user || !shopAsCustomer) return null;
    return {
      id: String(user.id),
      name: user.fullName,
      email: user.email ?? '',
      phone: user.phone ?? '',
      avatar: user.avatarUrl,
      address: '',
    };
  }, [user, shopAsCustomer]);

  const currentDriver = useMemo(() => {
    if (!user || !permittedRoles.driver) return null;
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
  }, [user, permittedRoles.driver]);

  const currentMerchant = useMemo(() => {
    if (!user || !permittedRoles.merchant) return null;
    return {
      id: String(user.id),
      name: user.fullName,
      email: user.email ?? '',
      avatar: user.avatarUrl,
      restaurantId: 'r-1',
    };
  }, [user, permittedRoles.merchant]);

  const currentAdmin = useMemo(() => {
    if (!user || !permittedRoles.admin) return null;
    return {
      id: String(user.id),
      name: user.fullName,
      email: user.email ?? '',
      avatar: user.avatarUrl,
      role: user.primaryRole === 'admin' ? 'Quản trị viên' : 'Người dùng',
    };
  }, [user, permittedRoles.admin]);

  const emptyCart = useCallback(
    () => ({
      id: null,
      restaurantId: null,
      restaurantName: null,
      restaurantLogo: null,
      baseDeliveryFee: 0,
      items: [],
    }),
    [],
  );

  const normalizeCartItem = useCallback((item) => ({
    id: Number(item.id),
    menuItemId: Number(item.menuItemId ?? item.menu_item_id ?? item.id),
    name: item.name,
    imageUrl: item.imageUrl ?? item.image ?? null,
    image: item.imageUrl ?? item.image ?? null,
    price: Number(item.price ?? 0),
    quantity: Number(item.quantity ?? 0),
    note: item.note ?? null,
    lineSubtotal: Number(item.lineSubtotal ?? Number(item.price ?? 0) * Number(item.quantity ?? 0)),
  }), []);

  const normalizeCart = useCallback(
    (nextCart) => {
      if (!nextCart) return emptyCart();
      return {
        id: nextCart.id ?? null,
        restaurantId: nextCart.restaurantId ?? null,
        restaurantName: nextCart.restaurantName ?? null,
        restaurantLogo: nextCart.restaurantLogo ?? null,
        baseDeliveryFee: Number(nextCart.baseDeliveryFee ?? 0),
        items: (nextCart.items ?? []).map(normalizeCartItem),
      };
    },
    [emptyCart, normalizeCartItem],
  );

  // Cart (customer)
  const [cart, setCart] = useState(() => emptyCart());
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [restaurantVouchers, setRestaurantVouchers] = useState([]);
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
  const deliveryFee = cart.items.length ? Number(cart.baseDeliveryFee ?? 0) : 0;
  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.kind === 'percent') return Math.min(cartSubtotal * (appliedPromo.amount / 100), appliedPromo.cap ?? 9e9);
    return Math.min(appliedPromo.amount, cartSubtotal);
  }, [appliedPromo, cartSubtotal]);
  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - discount);

  useEffect(() => {
    let active = true;

    if (!cart.restaurantId) {
      setRestaurantVouchers([]);
      return () => {
        active = false;
      };
    }

    fetchRestaurantVouchersApi(cart.restaurantId)
      .then((data) => {
        if (!active) return;
        setRestaurantVouchers(data?.items ?? []);
      })
      .catch(() => {
        if (active) setRestaurantVouchers([]);
      });

    return () => {
      active = false;
    };
  }, [cart.restaurantId]);

  const resetCartState = useCallback(() => {
    setCart(emptyCart());
    setAppliedPromo(null);
    setSyncing(false);
  }, [emptyCart]);

  const addToCart = useCallback(
    async (restaurantId, item, qty = 1, restaurantMeta = {}) => {
      if (user && !permittedRoles.customer) {
        const restriction = getCustomerCartRestriction(user, permittedRoles);
        pushToast({
          kind: 'warning',
          title: restriction?.title ?? 'Không thể đặt món',
          message: restriction?.message ?? 'Tài khoản này không thể sử dụng giỏ hàng khách hàng.',
          duration: 4200,
        });
        return null;
      }

      const nextRestaurantName = item.restaurantName ?? restaurantMeta.restaurantName ?? restaurantMeta.name ?? null;
      const nextRestaurantLogo = item.restaurantLogo ?? restaurantMeta.restaurantLogo ?? restaurantMeta.logo ?? null;
      const nextBaseDeliveryFee = Number(
        restaurantMeta.baseDeliveryFee ?? restaurantMeta.fee ?? item.baseDeliveryFee ?? cart.baseDeliveryFee ?? 0,
      );
      const nextRestaurantId = Number.isNaN(Number(restaurantId)) ? restaurantId : Number(restaurantId);
      const rawMenuItemId = item.menuItemId ?? item.menu_item_id;
      const parsedMenuItemId = Number(rawMenuItemId);
      const fallbackMenuItemId = Number(item.id);
      const resolvedMenuItemId = Number.isFinite(parsedMenuItemId) && parsedMenuItemId > 0
        ? parsedMenuItemId
        : Number.isFinite(fallbackMenuItemId) && fallbackMenuItemId > 0
          ? fallbackMenuItemId
          : null;
      const itemId = Number.isFinite(fallbackMenuItemId) && fallbackMenuItemId > 0 ? fallbackMenuItemId : item.id;
      const quantity = Math.max(1, Math.trunc(Number(qty) || 1));

      if (permittedRoles.customer && user) {
        const sameRestaurant = cart.restaurantId === null || String(cart.restaurantId) === String(nextRestaurantId);
        if (!sameRestaurant && cart.items.length > 0) {
          pushToast({
            kind: 'warning',
            title: 'Đã thay giỏ hàng',
            message: 'Giỏ hàng cũ đã được thay bằng món từ quán mới.',
            duration: 2800,
          });
        }

        if (!resolvedMenuItemId) {
          pushToast({
            kind: 'error',
            title: 'Không thể thêm vào giỏ hàng',
            message: 'Món ăn chưa có mã dữ liệu hợp lệ. Vui lòng tải lại trang.',
          });
          return null;
        }

        setSyncing(true);
        try {
          const data = await addCartItemApi({
            menuItemId: resolvedMenuItemId,
            quantity,
            note: item.note ?? undefined,
          });
          setCart(normalizeCart(data.cart));
          setAppliedPromo(null);
          if (data.cart) {
            pushToast({ kind: 'success', title: 'Đã thêm vào giỏ hàng', message: item.name, duration: 2200 });
          }
          return data.cart;
        } catch (error) {
          pushToast({
            kind: 'error',
            title: 'Không thể thêm vào giỏ hàng',
            message: error.message ?? 'Vui lòng thử lại sau.',
          });
          throw error;
        } finally {
          setSyncing(false);
        }
      }

      setCart((cur) => {
        const nextItem = {
          ...item,
          id: itemId,
          menuItemId: resolvedMenuItemId ?? item.menuItemId ?? itemId,
          restaurantId: nextRestaurantId,
          restaurantName: nextRestaurantName,
          restaurantLogo: nextRestaurantLogo,
          imageUrl: item.imageUrl ?? item.image ?? null,
          image: item.image ?? item.imageUrl ?? null,
          price: Number(item.price ?? 0),
          quantity,
          note: item.note ?? null,
          lineSubtotal: Number(item.price ?? 0) * quantity,
        };

        if (cur.restaurantId && String(cur.restaurantId) !== String(nextRestaurantId)) {
          return {
            id: null,
            restaurantId: nextRestaurantId,
            restaurantName: nextRestaurantName,
            restaurantLogo: nextRestaurantLogo,
            baseDeliveryFee: nextBaseDeliveryFee,
            items: [nextItem],
          };
        }

        const existing = cur.items.find((i) => String(i.menuItemId ?? i.id) === String(nextItem.menuItemId ?? nextItem.id));
        const items = existing
          ? cur.items.map((i) =>
            String(i.menuItemId ?? i.id) === String(nextItem.menuItemId ?? nextItem.id)
              ? {
                ...i,
                quantity: Number(i.quantity ?? 0) + quantity,
                lineSubtotal: Number(i.price ?? 0) * (Number(i.quantity ?? 0) + quantity),
              }
              : i,
          )
          : [...cur.items, nextItem];
        return {
          ...cur,
          restaurantId: nextRestaurantId,
          restaurantName: nextRestaurantName,
          restaurantLogo: nextRestaurantLogo,
          baseDeliveryFee: nextBaseDeliveryFee,
          items,
        };
      });

      pushToast({ kind: 'success', title: 'Đã thêm vào giỏ hàng', message: item.name, duration: 2200 });
      if (!user) {
        pushToast({
          kind: 'info',
          title: 'Hãy đăng nhập để đặt món',
          message: 'Đăng nhập để đồng bộ giỏ hàng giữa các thiết bị.',
          duration: 3200,
        });
      }
      return null;
    },
    [cart.baseDeliveryFee, cart.items.length, cart.restaurantId, normalizeCart, permittedRoles, pushToast, user],
  );

  const setItemQty = useCallback(
    async (itemId, qty, note) => {
      if (user && !permittedRoles.customer) return null;

      const quantity = Math.max(0, Math.trunc(Number(qty) || 0));
      if (permittedRoles.customer && user) {
        setSyncing(true);
        try {
          const data = await updateCartItemApi(itemId, { quantity, note });
          setCart(normalizeCart(data.cart));
          if (!data.cart) setAppliedPromo(null);
          return data.cart;
        } catch (error) {
          pushToast({
            kind: 'error',
            title: 'Không thể cập nhật giỏ hàng',
            message: error.message ?? 'Vui lòng thử lại sau.',
          });
          throw error;
        } finally {
          setSyncing(false);
        }
      }

      setCart((cur) => {
        const items = cur.items
          .map((i) => {
            if (String(i.id) !== String(itemId)) return i;
            const nextQty = quantity;
            if (nextQty <= 0) return null;
            return {
              ...i,
              quantity: nextQty,
              note: note === undefined ? i.note : note,
              lineSubtotal: Number(i.price ?? 0) * nextQty,
            };
          })
          .filter(Boolean);
        return items.length
          ? {
            ...cur,
            items,
          }
          : emptyCart();
      });
      return null;
    },
    [emptyCart, normalizeCart, permittedRoles.customer, pushToast, user],
  );

  const removeFromCart = useCallback(
    async (itemId) => {
      if (user && !permittedRoles.customer) return null;

      if (permittedRoles.customer && user) {
        setSyncing(true);
        try {
          const data = await deleteCartItemApi(itemId);
          setCart(normalizeCart(data.cart));
          if (!data.cart) setAppliedPromo(null);
          return data.cart;
        } catch (error) {
          pushToast({
            kind: 'error',
            title: 'Không thể xóa món khỏi giỏ',
            message: error.message ?? 'Vui lòng thử lại sau.',
          });
          throw error;
        } finally {
          setSyncing(false);
        }
      }

      return setItemQty(itemId, 0);
    },
    [normalizeCart, permittedRoles.customer, pushToast, setItemQty, user],
  );

  const clearCart = useCallback(async () => {
    if (user && !permittedRoles.customer) {
      resetCartState();
      return;
    }

    if (permittedRoles.customer && user) {
      setSyncing(true);
      try {
        await clearCartApi();
      } finally {
        setSyncing(false);
      }
    }
    resetCartState();
    if (!user) {
      clearGuestCart();
    }
  }, [permittedRoles.customer, resetCartState, user]);

  const applyPromo = useCallback(
    async (code) => {
      if (user && !permittedRoles.customer) return false;

      try {
        if (user && permittedRoles.customer) {
          const result = await validateVoucherApi(code, cartSubtotal);
          if (!result.ok) {
            pushToast({ kind: 'error', title: 'Mã không hợp lệ', message: result.message || `"${code}" không phải là mã khuyến mãi hợp lệ.` });
            return false;
          }
          // Set the applied promo using the result voucher details
          setAppliedPromo({
            code: result.voucher.code,
            label: result.voucher.kind === 'percent'
              ? `Giảm ${result.voucher.amount}%${result.voucher.max_discount ? ` (tối đa ${formatVnd(result.voucher.max_discount)})` : ''}`
              : `Giảm ${formatVnd(result.voucher.amount)}`,
            kind: result.voucher.kind,
            amount: result.voucher.amount,
            cap: result.voucher.max_discount,
          });
          pushToast({ kind: 'success', title: 'Đã áp dụng khuyến mãi', message: result.voucher.kind === 'percent' ? `Giảm ${result.voucher.amount}%` : `Giảm ${formatVnd(result.voucher.amount)}` });
          return true;
        } else {
          // Guest fallback
          const c = promoCodes.find((p) => p.code.toLowerCase() === code.trim().toLowerCase());
          if (!c) {
            pushToast({ kind: 'error', title: 'Mã không hợp lệ', message: `"${code}" không phải là mã khuyến mãi hợp lệ.` });
            return false;
          }
          setAppliedPromo(c);
          pushToast({ kind: 'success', title: 'Đã áp dụng khuyến mãi', message: c.label });
          return true;
        }
      } catch (error) {
        pushToast({ kind: 'error', title: 'Lỗi áp dụng mã', message: error.message || 'Không thể kiểm tra mã giảm giá lúc này.' });
        return false;
      }
    },
<<<<<<< HEAD
    [permittedRoles.customer, pushToast, user],
=======
    [cartSubtotal, permittedRoles.customer, pushToast, restaurantVouchers, user],
>>>>>>> b45c151 (refactor: optimize dependencies in AppProvider and use useCallback for loadOrders and loadReviews in admin modules)
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

  useEffect(() => {
    if (!authReady) return undefined;

    let cancelled = false;
    (async () => {
      if (!user) {
        if (cartHydratedKey.current === 'guest') return;
        cartHydratedKey.current = 'guest';
        const guest = loadGuestCart();
        if (!cancelled) {
          setCart(guest ? normalizeCart(guest) : emptyCart());
          setAppliedPromo(null);
        }
        return;
      }

      if (!permittedRoles.customer) {
        const blockedKey = `blocked:${user.id}`;
        if (cartHydratedKey.current === blockedKey) return;
        cartHydratedKey.current = blockedKey;
        if (!cancelled) {
          resetCartState();
        }
        return;
      }

      const hydrationKey = `customer:${user.id}`;
      if (cartHydratedKey.current === hydrationKey) return;
      cartHydratedKey.current = hydrationKey;

      setSyncing(true);
      try {
        const guest = loadGuestCart();
        if (guest?.items?.length) {
          const guestRestaurantId = guest.restaurantId;
          const itemsToMerge = guestRestaurantId
            ? guest.items.filter(
              (item) =>
                !item.restaurantId || String(item.restaurantId) === String(guestRestaurantId),
            )
            : guest.items;

          if (itemsToMerge.length < guest.items.length) {
            pushToast({
              kind: 'warning',
              title: 'Một phần giỏ khách không được gộp',
              message: 'Chỉ gộp món cùng quán. Các món quán khác đã được bỏ qua.',
              duration: 3600,
            });
          }

          for (const item of itemsToMerge) {
            const menuItemId = Number(item.menuItemId ?? item.id);
            if (!menuItemId) continue;
            await addCartItemApi({
              menuItemId,
              quantity: Math.max(1, Number(item.quantity ?? 1)),
              note: item.note ?? undefined,
            });
          }
          clearGuestCart();
        }

        const data = await fetchCartApi();
        if (!cancelled) {
          setCart(normalizeCart(data.cart));
          setAppliedPromo(null);
        }
      } catch {
        if (!cancelled) {
          resetCartState();
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, emptyCart, normalizeCart, permittedRoles.customer, pushToast, resetCartState, user]);

  useEffect(() => {
    if (!authReady || user) return undefined;
    if (!cart.items.length) {
      clearGuestCart();
      return undefined;
    }
    saveGuestCart(cart);
    return undefined;
  }, [authReady, cart, user]);

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

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser?.primaryRole) {
      setRole(nextUser.primaryRole);
    }
  }, []);

  const logout = useCallback(
    async ({ redirectTo = '/app', silent = false } = {}) => {
      const hadCustomerCart = Boolean(user && permittedRoles.customer);
      await logoutApi().catch(() => { });
      clearTokens();
      cartHydratedKey.current = null;
      setUser(null);
      setRole('customer');
      if (hadCustomerCart) {
        resetCartState();
      }
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
    [navigate, permittedRoles.customer, pushToast, resetCartState, user],
  );

  const grantCurrentUserRole = useCallback((nextRole) => {
    setUser((cur) => {
      if (!cur) return cur;
      const roles = Array.isArray(cur.roles) ? cur.roles : [];
      if (roles.includes(nextRole)) return cur;
      return { ...cur, roles: [...roles, nextRole].sort() };
    });
  }, []);

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
    setUser,
    authReady,
    login,
    registerSendCode,
    completeRegistration,
    updateUser,
    logout,
    grantCurrentUserRole,
    permittedRoles,
    shopAsCustomer,
    customerCartRestriction,

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
