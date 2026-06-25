export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface Permission {
  camps_view: boolean;
  camps_create: boolean;
  camps_edit: boolean;
  camps_delete: boolean;
  reservations_view: boolean;
  reservations_create: boolean;
  reservations_edit: boolean;
  reservations_delete: boolean;
  reservations_force_create: boolean;
  blockings_view: boolean;
  blockings_edit: boolean;
  blockings_delete: boolean;
  users_manage: boolean;
  templates_edit: boolean;
  settings_edit: boolean;
  org_admin: boolean;
  campIds?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: Permission;
  reservationsDefaultView: "list" | "calendar";
  createdAt: string;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: "before" | "after";
}

export function formatPrice(amount: number, lang: Language): string {
  const sym = lang.currencySymbol;
  const formatted = new Intl.NumberFormat(lang.code, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return lang.currencyPosition === "before" ? `${sym}${formatted}` : `${formatted} ${sym}`;
}

export interface SurchargePrice {
  id: string;
  surchargeId: string;
  languageCode: string;
  pricePerNight: number;
}

export interface Surcharge {
  id: string;
  campId: string;
  isOptional: boolean;
  isHidden: boolean;
  translations: Record<string, { name: string; note?: string }>;
  applicableTypeIds: string[];
  prices: SurchargePrice[];
}

export interface AccommodationTypePrice {
  id: string;
  accommodationTypeId: string;
  languageCode: string;
  pricePerNight: number;
  adultPricePerNight: number;
  childPricePerNight: number;
}

export interface NightTierPrice {
  languageCode: string;
  pricePerNight: number;
}

export interface NightTier {
  id: string;
  fromNight: number;
  prices: NightTierPrice[];
}

export interface AccommodationType {
  id: string;
  campId: string;
  translations: Record<string, { name: string; shortDescription?: string; longDescription?: string }>;
  capacity: number;
  sortOrder: number;
  useDynamicPricing: boolean;
  prices: AccommodationTypePrice[];
  nightTiers: NightTier[];
}

export function getEffectivePricePerNight(type: AccommodationType, languageCode: string, nights: number): number {
  if (!type.useDynamicPricing || !type.nightTiers.length) {
    const p = type.prices.find((p) => p.languageCode === languageCode) ?? type.prices[0];
    return p?.pricePerNight ?? 0;
  }
  const sorted = [...type.nightTiers].sort((a, b) => b.fromNight - a.fromNight);
  const tier = sorted.find((t) => nights >= t.fromNight) ?? sorted[sorted.length - 1];
  const tp = tier.prices.find((p) => p.languageCode === languageCode) ?? tier.prices[0];
  return tp?.pricePerNight ?? 0;
}

export interface Camp {
  id: string;
  name: string;
  slug: string;
  notificationEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  requiresConfirmation: boolean;
  smsNotifyCustomer: boolean;
  smsNotifyAdmin: boolean;
  smsAdminPhones: string[];
  smsTemplates: Record<string, string>;
  surcharges: Surcharge[];
  accommodationTypes: AccommodationType[];
  createdAt: string;
}

export interface Reservation {
  id: string;
  bookingCode?: string | null;
  campId: string;
  camp?: Camp;
  accommodationTypeId: string;
  accommodationType?: AccommodationType;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licensePlate?: string;
  expectedArrival?: string;
  note?: string;
  internalNote?: string | null;
  totalPrice: number;
  status: ReservationStatus;
  languageCode: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  campId: string;
  type: "ADMIN_NOTIFICATION" | "CUSTOMER_CONFIRMATION" | "PENDING_CONFIRMATION";
  languageCode: string;
  subject: string;
  body: string;
}

export interface PriceBreakdown {
  nights: number;
  accommodationTotal: number;
  personsTotal: number;
  surchargesTotal: number;
  total: number;
  lines: { label: string; amount: number }[];
}
