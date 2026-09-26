'use client';

// POS Multi-Trade · International commerce console workbench
// Implements the approved v2 layout from prototype/pos-multitrade-redesign-v2-international.html
// while wiring the existing local-first IndexedDB domain layer.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { INDUSTRIES, type IndustryId, type IndustryTemplate } from '@/types/industry';
import { PAYMENT_METHODS, type Order, type PaymentMethod, type Product, type Technician } from '@/types';
import { ensureIndustrySeeded, listProducts } from '@/db/productRepo';
import { listOrders, createOrder } from '@/db/orderRepo';
import { listTechnicians } from '@/db/technicianRepo';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
type NavView = 'counter' | 'orders' | 'catalog' | 'insights' | 'settings';
type LocaleId = 'zh-TW' | 'en';
type ChannelId = 'counter' | 'pickup';

interface ToastMsg {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'warn' | 'error';
}

const CURRENCY = 'NT$';
const WORKSPACE_LABEL = 'Little Day · Taipei';
const LOCALE_LABEL: Record<LocaleId, string> = {
  'zh-TW': '繁中 / EN',
  en: 'EN / 繁中',
};

const MICRO: Record<string, { zh: string; en: string }> = {
  counter: { zh: '收銀台', en: 'Counter' },
  orders: { zh: '訂單', en: 'Orders' },
  catalog: { zh: '商品', en: 'Catalog' },
  insights: { zh: '報表', en: 'Insights' },
  settings: { zh: '設定', en: 'Settings' },
  operate: { zh: '營運', en: 'Operate' },
  manage: { zh: '管理', en: 'Manage' },
  addToCart: { zh: '加入購物車', en: 'Add to cart' },
  currentSale: { zh: '目前訂單', en: 'Current sale' },
  draft: { zh: '草稿', en: 'Draft' },
  selectItems: { zh: '請選擇商品以繼續', en: 'Select items to continue' },
  complete: { zh: '完成結帳', en: 'Complete sale' },
  subtotal: { zh: '小計', en: 'Subtotal' },
  total: { zh: '應收', en: 'Total' },
  payment: { zh: '付款方式', en: 'Payment method' },
  search: { zh: '搜尋商品、訂單⋯', en: 'Search products, orders…' },
  todaySales: { zh: '今日營業額', en: "Today's sales" },
  completed: { zh: '已完成', en: 'Completed' },
  inProduction: { zh: '待出餐', en: 'In production' },
  readyForPickup: { zh: '待取貨', en: 'Ready for pickup' },
  upcoming: { zh: '待服務', en: 'Upcoming' },
  attention: { zh: '需處理', en: 'Attention' },
  liveActivity: { zh: '即時動態', en: 'Live activity' },
  signalBoard: { zh: '營運訊號', en: 'Signal board' },
  topItem: { zh: '熱賣商品', en: 'Top item' },
  grossMargin: { zh: '毛利率', en: 'Gross margin' },
  repeatCustomers: { zh: '回頭客', en: 'Repeat customers' },
  syncState: { zh: '同步狀態', en: 'Sync state' },
  snapshot: { zh: '查看 snapshot', en: 'View snapshot' },
  newSale: { zh: '新交易', en: '+ New sale' },
  viewActivity: { zh: '查看動態', en: 'View activity' },
  emptyCart: { zh: '尚未加入商品', en: 'No items yet' },
  emptyCartHint: { zh: '選擇商品以開始交易', en: 'Select a product to start a sale' },
  walkIn: { zh: '現場客', en: 'Walk-in customer' },
  noProfile: { zh: '尚未綁定', en: 'No profile attached' },
  snapshotModalTitle: { zh: '切換商業 profile', en: 'Change business profile' },
  snapshotModalBody: {
    zh: '切換工作 profile 不會清除目前目錄或訂單紀錄。',
    en: 'Switch the operating profile without losing the catalogue or order history from the current profile.',
  },
  snapshotCalloutTitle: { zh: 'Snapshot 保護已啟用', en: 'Snapshot protection enabled' },
  snapshotCalloutBody: {
    zh: '切換前會先在本地儲存目前 profile 的完整快照。',
    en: 'The current profile is saved locally before switching.',
  },
  cancel: { zh: '取消', en: 'Cancel' },
  confirm: { zh: '儲存 snapshot 並切換', en: 'Save snapshot & switch' },
  current: { zh: '目前', en: 'Current' },
  switch: { zh: '切換', en: 'Switch' },
  channelLabel: { zh: '櫃台 01', en: 'Counter 01' },
  retailChannel: { zh: '外帶', en: 'Pickup' },
  cartFull: { zh: '已加入購物車', en: 'Added to sale' },
  saleCompleted: { zh: '結帳完成 · 已儲存於本機', en: 'Sale completed · saved on device' },
  snapshotSaved: { zh: 'Snapshot 已儲存 · 已切換 profile', en: 'Snapshot saved · profile switched' },
  offlineNote: { zh: '離線模式', en: 'Offline mode' },
  onlineNote: { zh: '線上', en: 'Online' },
  loadError: { zh: '載入失敗，請重試', en: 'Failed to load, please retry' },
  retry: { zh: '重試', en: 'Retry' },
  checkoutError: { zh: '結帳失敗：', en: 'Checkout failed: ' },
  previewHint: { zh: '入口預覽', en: 'Workspace preview' },
  filterAll: { zh: '全部', en: 'All' },
  availableLocal: { zh: '本機可用', en: 'Available · local stock' },
  snapshotReady: { zh: 'Latest snapshot · today · complete', en: 'Latest snapshot · today · complete' },
  cartClearedOnSwitch: { zh: '已切換並清空購物車', en: 'Cart cleared after switch' },
};

function t(micro: string, locale: LocaleId): string {
  const entry = MICRO[micro];
  if (!entry) return micro;
  return locale === 'en' ? entry.en : entry.zh;
}

function formatMoney(n: number, locale: LocaleId): string {
  const formatted = n.toLocaleString(locale === 'en' ? 'en-US' : 'zh-TW');
  return `${CURRENCY}${formatted}`;
}

function profileAccent(industry: IndustryId): string {
  if (industry === 'fnb') return 'F';
  if (industry === 'retail') return 'R';
  return 'S';
}

function todayStart(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export default function PosWorkbench() {
  const activeIndustry = useAppStore((s) => s.activeIndustry);
  const switchIndustry = useAppStore((s) => s.switchIndustry);
  const hydrateActiveIndustry = useAppStore((s) => s.hydrateActiveIndustry);
  const setOnline = useAppStore((s) => s.setIsOnline);

  const cartItems = useCartStore((s) => s.items);
  const cartCount = useCartStore((s) => s.count());
  const cartTotal = useCartStore((s) => {
    try {
      return s.total();
    } catch {
      return 0;
    }
  });
  const addProduct = useCartStore((s) => s.addProduct);
  const removeProduct = useCartStore((s) => s.removeProduct);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clearCart = useCartStore((s) => s.clear);

  const [status, setStatus] = useState<LoadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [channel, setChannel] = useState<ChannelId>('counter');
  const [nav, setNav] = useState<NavView>('counter');
  const [locale, setLocale] = useState<LocaleId>('zh-TW');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [pendingIndustry, setPendingIndustry] = useState<IndustryId>(activeIndustry);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [isOnline, setIsOnlineLocal] = useState<boolean>(true);
  const [checkoutError, setCheckoutError] = useState<string>('');
  const [checkoutSuccess, setCheckoutSuccess] = useState<string>('');

  const searchRef = useRef<HTMLInputElement | null>(null);
  const toastIdRef = useRef<number>(0);

  const pushToast = useCallback((text: string, tone: ToastMsg['tone'] = 'info') => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((m) => m.id !== id));
    }, 2400);
  }, []);

  // Online/offline listener
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const update = () => {
      const next = navigator.onLine;
      setIsOnlineLocal(next);
      setOnline(next);
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [setOnline]);

  // Hydrate active industry from IndexedDB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await hydrateActiveIndustry();
      } catch {
        // ignore
      }
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateActiveIndustry]);

  // Load products/orders/technicians for current industry
  const loadAll = useCallback(async (industry: IndustryId) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      await ensureIndustrySeeded(industry);
      const [prods, orders, techs] = await Promise.all([
        listProducts(industry),
        listOrders({ industryId: industry, limit: 8 }),
        listTechnicians(),
      ]);
      setProducts(prods);
      setRecentOrders(orders);
      setTechnicians(techs);
      setStatus('ready');
    } catch (err) {
      setErrorMsg((err as Error).message ?? 'load_failed');
      setStatus('error');
    }
  }, []);

  // Initial load + reload when activeIndustry changes
  useEffect(() => {
    void loadAll(activeIndustry);
  }, [activeIndustry, loadAll]);

  // Keyboard shortcuts: `/` focuses search, `Esc` closes modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (modalOpen) {
          setModalOpen(false);
        }
        return;
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = products;
    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }, [products, category, query]);

  const metrics = useMemo(() => {
    const start = todayStart();
    const todayRevenue = recentOrders
      .filter((o) => o.createdAt >= start)
      .reduce((s, o) => s + o.totalAmount, 0);
    const todayCount = recentOrders.filter((o) => o.createdAt >= start).length;
    const queue = products.length > 0 ? Math.min(99, Math.max(0, recentOrders.filter((o) => o.createdAt >= start).length)) : 0;
    const lowStock = products.filter((p) => typeof p.stock === 'number' && p.stock <= 5).length;
    return {
      todayRevenue,
      todayCount,
      queue,
      lowStock,
    };
  }, [recentOrders, products]);

  const topProduct = useMemo<{ name: string; count: number } | null>(() => {
    const counts = new Map<string, number>();
    recentOrders.forEach((o) => {
      o.items.forEach((it) => {
        counts.set(it.productName, (counts.get(it.productName) ?? 0) + it.quantity);
      });
    });
    let best: { name: string; count: number } | null = null;
    counts.forEach((count, name) => {
      const current: { name: string; count: number } | null = best;
      if (current === null || count > current.count) {
        best = { name, count };
      }
    });
    return best;
  }, [recentOrders]);

  const profile: IndustryTemplate = INDUSTRIES[activeIndustry];

  function openSwitchModal() {
    setPendingIndustry(activeIndustry);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function confirmSwitch() {
    if (pendingIndustry === activeIndustry) {
      setModalOpen(false);
      return;
    }
    const result = await switchIndustry(pendingIndustry);
    if (!result.ok) {
      pushToast(`Snapshot failed: ${result.error}`, 'error');
      return;
    }
    setModalOpen(false);
    pushToast(t('snapshotSaved', locale), 'good');
  }

  function onAddProduct(product: Product) {
    try {
      addProduct(product, 1);
      pushToast(`${product.name} ${t('cartFull', locale)}`, 'info');
    } catch (err) {
      pushToast(`Add failed: ${(err as Error).message}`, 'error');
    }
  }

  async function onCheckout() {
    setCheckoutError('');
    setCheckoutSuccess('');
    if (cartItems.length === 0) {
      setCheckoutError('ORDER_001');
      return;
    }
    if (!payment) {
      setCheckoutError('ORDER_002');
      return;
    }
    try {
      const technician = activeIndustry === 'service'
        ? cartItems.find((i) => i.product.technician)?.product.technician ?? null
        : null;
      const order = await createOrder({
        industryId: activeIndustry,
        items: cartItems.map((i) => ({ product: i.product, quantity: i.quantity })),
        paymentMethod: payment,
        technician,
      });
      setCheckoutSuccess(order.orderNumber);
      clearCart();
      pushToast(t('saleCompleted', locale), 'good');
      await loadAll(activeIndustry);
    } catch (err) {
      setCheckoutError((err as Error).message ?? 'checkout_failed');
      pushToast(`${t('checkoutError', locale)}${(err as Error).message}`, 'error');
    }
  }

  function onNewSale() {
    clearCart();
    setCheckoutError('');
    setCheckoutSuccess('');
    pushToast(t('newSale', locale), 'info');
  }

  return (
    <div className="app" data-testid="pos-workbench">
      <aside className="rail" aria-label={t('operate', locale)}>
        <div className="mark-row">
          <div className="mark" aria-hidden="true">P</div>
          <div className="wordmark">
            POS Multi-Trade
            <small>Commerce console</small>
          </div>
        </div>

        <button className="workspace-switch" type="button" aria-label={`Workspace · ${WORKSPACE_LABEL}`}>
          <span>
            <span className="label">Workspace</span>
            <span className="value">{WORKSPACE_LABEL}</span>
          </span>
          <span className="chevron" aria-hidden="true">⌄</span>
        </button>

        <div className="rail-section">{t('operate', locale)}</div>
        <nav className="nav" aria-label="Primary navigation">
          {(['counter', 'orders', 'catalog', 'insights'] as NavView[]).map((view) => (
            <button
              key={view}
              type="button"
              className={nav === view ? 'active' : ''}
              data-view={view}
              onClick={() => {
                setNav(view);
                if (view !== 'counter') {
                  pushToast(`${t(view, locale)} ${t('previewHint', locale)}`, 'info');
                }
              }}
            >
              <span className="nav-icon" aria-hidden="true">
                {view === 'counter' && '▦'}
                {view === 'orders' && '≡'}
                {view === 'catalog' && '◇'}
                {view === 'insights' && '◒'}
              </span>
              <span className="nav-label">{t(view, locale)} <small>· {view}</small></span>
              <span className="nav-hint">{view === 'counter' ? '⌘1' : view === 'orders' ? '⌘2' : view === 'catalog' ? '⌘3' : '⌘4'}</span>
            </button>
          ))}
        </nav>

        <div className="rail-section" style={{ marginTop: 23 }}>{t('manage', locale)}</div>
        <nav className="nav" aria-label="Settings navigation">
          <button
            type="button"
            className={nav === 'settings' ? 'active' : ''}
            onClick={() => {
              setNav('settings');
              pushToast(`${t('settings', locale)} ${t('previewHint', locale)}`, 'info');
            }}
          >
            <span className="nav-icon" aria-hidden="true">⚙</span>
            <span className="nav-label">{t('settings', locale)}</span>
          </button>
        </nav>

        <div className="rail-bottom">
          <div className="connection" data-testid="connection-state">
            <span className="pulse" aria-hidden="true"></span>
            <span>
              {isOnline ? t('onlineNote', locale) : t('offlineNote', locale)} · local-first
            </span>
          </div>
          <div className="build">POS Multi-Trade · 2026.09</div>
        </div>
      </aside>

      <div className="shell">
        <header className="globalbar">
          <div className="crumbs">
            Workspace <span>/</span> <strong>Counter</strong>
          </div>
          <div className="global-actions">
            <div className="search-wrap">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                ref={searchRef}
                className="search"
                aria-label={t('search', locale)}
                placeholder={t('search', locale)}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="compact"
              onClick={() => {
                setLocale(locale === 'zh-TW' ? 'en' : 'zh-TW');
                pushToast(`Locale · ${LOCALE_LABEL[locale === 'zh-TW' ? 'en' : 'zh-TW']}`, 'info');
              }}
              aria-label={`Locale · ${LOCALE_LABEL[locale]}`}
            >
              {LOCALE_LABEL[locale]}
            </button>
            <button
              type="button"
              className="compact"
              onClick={() => pushToast(`${t('channelLabel', locale)} · ${t('previewHint', locale)}`, 'info')}
              aria-label={`Channel · ${t('channelLabel', locale)}`}
            >
              {t('channelLabel', locale)} ⌄
            </button>
            <div className="avatar" aria-hidden="true">M</div>
          </div>
        </header>

        <main>
          <section className="hero">
            <div>
              <div className="overline">Unified commerce console · v2 direction</div>
              <h1>
                Move the line.
                <br />
                <span style={{ color: 'var(--accent)' }}>Keep the context.</span>
              </h1>
              <p className="hero-copy">
                {locale === 'zh-TW'
                  ? '為同時販售商品、服務或兩者的微型店家打造的收銀工作區——同一份目錄、同一個結帳流程，以及能在你改變行業時跟著切換的商業 profile。'
                  : 'A focused workspace for small businesses that sell products, services, or both — with one catalogue, one checkout, and an industry profile that can change when your business does.'}
              </p>
            </div>
            <div className="hero-actions">
              <button className="secondary" type="button" onClick={() => pushToast(`${t('liveActivity', locale)} ${t('previewHint', locale)}`, 'info')}>
                {t('viewActivity', locale)}
              </button>
              <button className="primary" type="button" onClick={onNewSale}>
                {t('newSale', locale)}
              </button>
            </div>
          </section>

          <section className="context" aria-label="Business profile context">
            <div className="profile">
              <div className="profile-icon" aria-hidden="true" data-testid="profile-icon">{profileAccent(activeIndustry)}</div>
              <div>
                <div className="profile-title" data-testid="profile-title">
                  {profile.nameEn} <span style={{ color: '#97A3BB', fontWeight: 500 }}>/ {profile.name}</span>
                </div>
                <div className="profile-meta" data-testid="profile-meta">
                  {products.length} items · {CURRENCY} · Asia/Taipei · snapshot protected
                </div>
              </div>
            </div>
            <div className="profiles" aria-label="Business profile switcher" role="tablist">
              {(Object.keys(INDUSTRIES) as IndustryId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeIndustry === id}
                  className={`profile-btn${activeIndustry === id ? ' active' : ''}`}
                  data-industry={id}
                  data-testid={`profile-btn-${id}`}
                  onClick={openSwitchModal}
                >
                  {INDUSTRIES[id].nameEn}
                </button>
              ))}
            </div>
          </section>

          <section className="metrics" aria-label="Operational metrics">
            <article className="metric">
              <div className="metric-head"><span>{t('todaySales', locale)}</span><span aria-hidden="true">↗</span></div>
              <div className="metric-value" data-testid="metric-sales">{formatMoney(metrics.todayRevenue, locale)}</div>
              <div className="metric-foot">+{metrics.todayCount} orders today</div>
            </article>
            <article className="metric">
              <div className="metric-head"><span>{t('completed', locale)}</span><span aria-hidden="true">⌁</span></div>
              <div className="metric-value">{metrics.todayCount}</div>
              <div className="metric-foot">
                Avg. ticket {metrics.todayCount ? formatMoney(Math.round(metrics.todayRevenue / metrics.todayCount), locale) : '—'}
              </div>
            </article>
            <article className="metric">
              <div className="metric-head">
                <span>
                  {activeIndustry === 'retail'
                    ? t('readyForPickup', locale)
                    : activeIndustry === 'service'
                      ? t('upcoming', locale)
                      : t('inProduction', locale)}
                </span>
                <span aria-hidden="true">◷</span>
              </div>
              <div className="metric-value">{metrics.queue}</div>
              <div className={`metric-foot${metrics.queue > 0 ? ' warn' : ''}`}>Queue depth</div>
            </article>
            <article className="metric">
              <div className="metric-head"><span>{t('attention', locale)}</span><span aria-hidden="true">!</span></div>
              <div className="metric-value">{metrics.lowStock}</div>
              <div className={`metric-foot${metrics.lowStock > 0 ? ' warn' : ''}`}>Low stock items</div>
            </article>
          </section>

          {status === 'error' && (
            <div className="status-callout error" role="alert" data-testid="load-error">
              <strong>{t('loadError', locale)}</strong>
              <span>{errorMsg}</span>
              <button className="secondary" type="button" onClick={() => loadAll(activeIndustry)}>{t('retry', locale)}</button>
            </div>
          )}

          <section className="console" data-testid="console">
            <article className="panel catalog">
              <div className="panel-head">
                <div>
                  <div className="panel-title">{t('counter', locale)} · Quick sale</div>
                  <div className="panel-sub">
                    {profile.nameEn} catalogue · {products.length} items
                  </div>
                </div>
                <div className="catalog-tools">
                  <select className="filter" aria-label="Sort catalogue" defaultValue="">
                    <option value="">Recommended</option>
                    <option>Best sellers</option>
                    <option>Price: low to high</option>
                  </select>
                  <button
                    type="button"
                    className="filter"
                    onClick={() => pushToast(`${t('catalog', locale)} ${t('previewHint', locale)}`, 'info')}
                  >
                    Manage ↗
                  </button>
                </div>
              </div>
              <div className="categories" role="tablist" aria-label="Categories">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={category === cat}
                    className={`category${category === cat ? ' active' : ''}`}
                    data-cat={cat}
                    onClick={() => setCategory(cat)}
                  >
                    {cat === 'all' ? t('filterAll', locale) : cat}
                  </button>
                ))}
              </div>
              <div className="products" data-testid="products">
                {status === 'loading' && (
                  <div className="empty" role="status" data-testid="products-loading">
                    Loading products…
                  </div>
                )}
                {status === 'ready' && visibleProducts.length === 0 && (
                  <div className="empty" role="status" data-testid="products-empty">
                    {t('emptyCart', locale)} · {profile.nameEn}
                  </div>
                )}
                {status === 'ready' &&
                  visibleProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="product"
                      data-testid={`product-${p.id}`}
                      onClick={() => onAddProduct(p)}
                      aria-label={`${p.name} ${formatMoney(p.price, locale)}`}
                    >
                      <div className="product-code" aria-hidden="true">
                        {p.name.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="product-name">{p.name}</div>
                      <div className="product-meta">
                        <span className="product-price">{formatMoney(p.price, locale)}</span>
                        <span className="add" aria-hidden="true">+</span>
                      </div>
                      <div className={`availability${typeof p.stock === 'number' && p.stock <= 5 ? ' low' : ''}`}>
                        {typeof p.stock === 'number' && p.stock <= 5
                          ? `Low stock · ${p.stock}`
                          : `${t('availableLocal', locale)}`}
                      </div>
                    </button>
                  ))}
              </div>
            </article>

            <aside className="panel checkout" aria-label="Checkout">
              <div className="checkout-head">
                <div>
                  <div className="panel-title">{t('currentSale', locale)}</div>
                  <div className="order-id">{t('draft', locale)} · POS-{activeIndustry.toUpperCase()}</div>
                </div>
                <span className="count" data-testid="cart-count">{cartCount} items</span>
              </div>

              <div className="customer">
                <div className="customer-main">
                  <div className="customer-avatar" aria-hidden="true">W</div>
                  <div>
                    <div className="customer-label">{t('walkIn', locale)}</div>
                    <div className="customer-meta">{t('noProfile', locale)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => pushToast(`${t('walkIn', locale)} · ${t('previewHint', locale)}`, 'info')}
                >
                  Add
                </button>
              </div>

              <div className="order-switch" role="tablist" aria-label="Order type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={channel === 'counter'}
                  className={channel === 'counter' ? 'active' : ''}
                  onClick={() => setChannel('counter')}
                >
                  {t('counter', locale)}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={channel === 'pickup'}
                  className={channel === 'pickup' ? 'active' : ''}
                  onClick={() => setChannel('pickup')}
                >
                  {t('retailChannel', locale)}
                </button>
              </div>

              <div className="cart" data-testid="cart">
                {cartItems.length === 0 ? (
                  <div className="empty" data-testid="cart-empty">
                    {t('emptyCart', locale)}
                    <br />
                    {t('emptyCartHint', locale)}
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div className="cart-row" key={item.productId} data-testid={`cart-row-${item.productId}`}>
                      <div>
                        <div className="cart-name">{item.product.name}</div>
                        <div className="cart-meta">
                          {item.product.name.slice(0, 3).toUpperCase()} · {formatMoney(item.product.price, locale)} each
                        </div>
                        <div className="qty">
                          <button
                            type="button"
                            aria-label={`decrease ${item.product.name}`}
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span data-testid={`cart-qty-${item.productId}`}>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`increase ${item.product.name}`}
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => removeProduct(item.productId)}
                            aria-label={`remove ${item.product.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="cart-amount">{formatMoney(item.subtotal, locale)}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="summary">
                <div className="summary-row">
                  <span>{t('subtotal', locale)}</span>
                  <span data-testid="subtotal">{formatMoney(cartTotal, locale)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount</span>
                  <span>—</span>
                </div>
                <div className="summary-row total">
                  <span>{t('total', locale)}</span>
                  <span data-testid="total">{formatMoney(cartTotal, locale)}</span>
                </div>
              </div>

              <div className="payment-label">{t('payment', locale)}</div>
              <div className="payments" role="radiogroup" aria-label={t('payment', locale)}>
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={payment === m.id}
                    className={`payment${payment === m.id ? ' active' : ''}`}
                    data-testid={`payment-${m.id}`}
                    onClick={() => setPayment(m.id)}
                  >
                    <span aria-hidden="true">{m.icon}</span> {m.label}
                  </button>
                ))}
              </div>

              <button
                className="complete"
                type="button"
                onClick={onCheckout}
                disabled={cartItems.length === 0}
                data-testid="complete"
              >
                {cartItems.length === 0
                  ? t('selectItems', locale)
                  : `${t('complete', locale)} · ${formatMoney(cartTotal, locale)}`}
              </button>

              {checkoutError && (
                <div className="status-callout error" role="alert" data-testid="checkout-error">
                  {t('checkoutError', locale)}{checkoutError}
                </div>
              )}
              {checkoutSuccess && (
                <div className="status-callout good" role="status" data-testid="checkout-success">
                  {t('saleCompleted', locale)} · #{checkoutSuccess}
                </div>
              )}
            </aside>
          </section>

          <section className="insights">
            <article className="panel insight">
              <div className="panel-head">
                <div>
                  <div className="panel-title">{t('liveActivity', locale)}</div>
                  <div className="panel-sub">
                    {recentOrders.length} recent · local data only
                  </div>
                </div>
                <button
                  className="link-btn"
                  type="button"
                  onClick={() => pushToast(`${t('orders', locale)} ${t('previewHint', locale)}`, 'info')}
                >
                  View all
                </button>
              </div>
              <table className="activity">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Channel</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody data-testid="activity-table">
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ color: 'var(--muted)' }}>
                        No recent orders · checkout to populate
                      </td>
                    </tr>
                  )}
                  {recentOrders.slice(0, 6).map((o) => (
                    <tr key={o.id}>
                      <td>{o.orderNumber}</td>
                      <td>{channel === 'pickup' ? 'Pickup' : 'Counter'}</td>
                      <td>{formatMoney(o.totalAmount, locale)}</td>
                      <td><span className="tag">Completed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="panel insight">
              <div className="panel-head">
                <div>
                  <div className="panel-title">{t('signalBoard', locale)}</div>
                  <div className="panel-sub">Today · local data only</div>
                </div>
                <button
                  className="filter"
                  type="button"
                  onClick={() => pushToast(t('snapshotReady', locale), 'info')}
                  data-testid="snapshot-btn"
                >
                  {t('snapshot', locale)} ↗
                </button>
              </div>
              <div className="mini-stats">
                <div className="mini">
                  <div className="mini-label">{t('topItem', locale)}</div>
                  <div className="mini-value" data-testid="top-item">
                    {topProduct?.name ?? '—'}
                  </div>
                  <div className="bar"><i style={{ width: topProduct ? `${Math.min(100, topProduct.count * 25)}%` : '0%' }}></i></div>
                </div>
                <div className="mini">
                  <div className="mini-label">{t('grossMargin', locale)}</div>
                  <div className="mini-value">—</div>
                  <div className="bar"><i style={{ width: '0%' }}></i></div>
                </div>
                <div className="mini">
                  <div className="mini-label">{t('repeatCustomers', locale)}</div>
                  <div className="mini-value">—</div>
                  <div className="bar"><i style={{ width: '0%' }}></i></div>
                </div>
                <div className="mini">
                  <div className="mini-label">{t('syncState', locale)}</div>
                  <div className="mini-value" style={{ fontSize: 15, color: 'var(--good)' }}>
                    {isOnline ? 'On device' : 'Offline'}
                  </div>
                  <div className="bar"><i style={{ width: '100%', background: 'var(--good)' }}></i></div>
                </div>
              </div>
              {technicians.length > 0 && activeIndustry === 'service' && (
                <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 11 }}>
                  {technicians.length} technicians · service profile
                </div>
              )}
            </article>
          </section>
        </main>
      </div>

      <div
        className={`modal-backdrop${modalOpen ? ' show' : ''}`}
        id="backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modal" role="document">
          <h2 id="modalTitle">{t('snapshotModalTitle', locale)}</h2>
          <p>{t('snapshotModalBody', locale)}</p>
          <div className="callout">
            <span aria-hidden="true">◷</span>
            <span>
              <strong>{t('snapshotCalloutTitle', locale)}</strong>
              <br />
              {t('snapshotCalloutBody', locale)}
            </span>
          </div>
          <div className="modal-list" role="radiogroup" aria-label="Profile selection">
            {(Object.keys(INDUSTRIES) as IndustryId[]).map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={pendingIndustry === id}
                className={`${pendingIndustry === id ? 'selected' : ''}`}
                data-modal={id}
                onClick={() => setPendingIndustry(id)}
              >
                <span>
                  <strong>{INDUSTRIES[id].nameEn}</strong>{' '}
                  <span style={{ color: 'var(--muted)' }}>/ {INDUSTRIES[id].name}</span>
                </span>
                <span>{id === activeIndustry ? t('current', locale) : t('switch', locale)}</span>
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={closeModal} data-testid="modal-cancel">
              {t('cancel', locale)}
            </button>
            <button type="button" className="primary" onClick={confirmSwitch} data-testid="modal-confirm">
              {t('confirm', locale)}
            </button>
          </div>
        </div>
      </div>

      <div className="toast-stack" aria-live="polite">
        {toasts.map((m) => (
          <div
            key={m.id}
            className={`toast show ${m.tone}`}
            role="status"
            data-testid={`toast-${m.tone}`}
          >
            {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}
