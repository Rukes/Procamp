const SYSTEM_GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(args);
}

function injectGtag(id: string) {
  if (document.querySelector(`script[data-ga="${id}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.dataset.ga = id;
  document.head.appendChild(script);
}

export function initAnalytics(clientId: string | null) {
  const ids = [SYSTEM_GA_ID, clientId].filter(Boolean) as string[];
  if (ids.length === 0) return;

  // Inject gtag.js once (první ID stačí, ostatní se registrují přes config)
  injectGtag(ids[0]);

  gtag("js", new Date());
  for (const id of ids) {
    gtag("config", id, { send_page_view: false });
  }
}

export function trackPageView(campName: string) {
  gtag("event", "page_view", { page_title: campName });
}

export function trackBeginCheckout(campName: string) {
  gtag("event", "begin_checkout", { item_name: campName });
}

export function trackPurchase(params: {
  reservationId: string;
  campName: string;
  totalPrice: number;
  currency: string;
  nights: number;
}) {
  gtag("event", "purchase", {
    transaction_id: params.reservationId,
    value: params.totalPrice,
    currency: params.currency,
    items: [{ item_name: params.campName, quantity: params.nights }],
  });
}
