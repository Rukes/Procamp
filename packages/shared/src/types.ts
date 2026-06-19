export type AccommodationType = "CARAVAN" | "TENT";

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
  users_manage: boolean;
  templates_edit: boolean;
  settings_edit: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: Permission;
  createdAt: string;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

export interface Surcharge {
  id: string;
  campId: string;
  pricePerNight: number;
  isOptional: boolean;
  translations: Record<string, { name: string }>;
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
  caravanCapacity: number;
  tentCapacity: number;
  caravanPricePerNight: number;
  tentPricePerNight: number;
  adultPricePerNight: number;
  childPricePerNight: number;
  currency: string;
  surcharges: Surcharge[];
  createdAt: string;
}

export interface Reservation {
  id: string;
  campId: string;
  camp?: Camp;
  accommodationType: AccommodationType;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  selectedSurchargeIds: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licensePlate?: string;
  expectedArrival?: string;
  note?: string;
  totalPrice: number;
  status: ReservationStatus;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  campId: string;
  type: "ADMIN_NOTIFICATION" | "CUSTOMER_CONFIRMATION";
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
