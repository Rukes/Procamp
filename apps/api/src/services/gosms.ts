import { PrismaClient } from "@prisma/client";
import { logActivity } from "./activityLog";

const BASE = "https://app.gosms.eu";

interface TokenCache {
  token: string;
  expiresAt: number;
}

// In-memory token cache per organization
const tokenCache = new Map<string, TokenCache>();

async function getToken(clientId: string, clientSecret: string, orgId: string): Promise<string> {
  const cached = tokenCache.get(orgId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const params = new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret });
  const res = await fetch(`${BASE}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`GoSMS token error: ${res.status} ${await res.text().catch(() => "")}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  tokenCache.set(orgId, { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

export async function getGoSmsCredit(clientId: string, clientSecret: string, orgId: string) {
  const token = await getToken(clientId, clientSecret, orgId);
  const res = await fetch(`${BASE}/api/v1`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GoSMS credit error: ${res.status}`);
  return res.json();
}

export async function sendSms(
  prisma: PrismaClient,
  orgId: string,
  clientId: string,
  clientSecret: string,
  channelId: number,
  recipients: string | string[],
  message: string,
  context: { userEmail: string; ip?: string; reservationId?: string },
) {
  const token = await getToken(clientId, clientSecret, orgId);
  const body = { message, channel: channelId, recipients };
  const res = await fetch(`${BASE}/api/v1/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseBody = await res.json().catch(() => null);

  await logActivity(prisma, {
    userEmail: context.userEmail,
    ip: context.ip,
    action: "SMS_SEND",
    entity: "reservation",
    entityId: context.reservationId,
    payload: {
      status: res.status,
      ok: res.ok,
      recipients,
      message,
      channelId,
      response: responseBody,
    },
  });

  if (!res.ok) throw new Error(`GoSMS send error: ${res.status} ${JSON.stringify(responseBody)}`);
  return responseBody;
}

export async function sendReservationSms(
  prisma: PrismaClient,
  reservation: { id: string; bookingCode?: string | null; firstName: string; lastName: string; phone: string; languageCode?: string | null },
  camp: { smsNotifyCustomer: boolean; smsNotifyAdmin: boolean; smsAdminPhones: string[]; smsTemplates: Record<string, string>; organizationId: string | null },
  options: { sendCustomer?: boolean; sendAdmin?: boolean; customPhone?: string; userEmail?: string } = {},
) {
  if (!camp.organizationId) return;
  const org = await prisma.organization.findUnique({
    where: { id: camp.organizationId },
    select: { goSmsClientId: true, goSmsClientSecret: true, goSmsChannelId: true },
  });
  if (!org?.goSmsClientId || !org.goSmsClientSecret || !org.goSmsChannelId) return;

  const stripDiacritics = (s: string) => s
    .replace(/[áÁ]/g, (c) => c === "á" ? "a" : "A").replace(/[čČ]/g, (c) => c === "č" ? "c" : "C")
    .replace(/[ďĎ]/g, (c) => c === "ď" ? "d" : "D").replace(/[éÉěĚ]/g, (c) => "eEeE"["éÉěĚ".indexOf(c)])
    .replace(/[íÍ]/g, (c) => c === "í" ? "i" : "I").replace(/[ňŇ]/g, (c) => c === "ň" ? "n" : "N")
    .replace(/[óÓ]/g, (c) => c === "ó" ? "o" : "O").replace(/[řŘ]/g, (c) => c === "ř" ? "r" : "R")
    .replace(/[šŠ]/g, (c) => c === "š" ? "s" : "S").replace(/[ťŤ]/g, (c) => c === "ť" ? "t" : "T")
    .replace(/[úÚůŮ]/g, (c) => "uUuU"["úÚůŮ".indexOf(c)]).replace(/[ýÝ]/g, (c) => c === "ý" ? "y" : "Y")
    .replace(/[žŽ]/g, (c) => c === "ž" ? "z" : "Z");

  const lang = reservation.languageCode ?? "cs";
  const templates = camp.smsTemplates ?? {};
  const rawMessage = templates[lang] || templates[Object.keys(templates)[0]] || "Vaše rezervace byla potvrzena.";
  const message = rawMessage
    .replace(/\{bookingCode\}/g, stripDiacritics(reservation.bookingCode ?? "-"))
    .replace(/\{fullName\}/g, stripDiacritics(`${reservation.firstName} ${reservation.lastName}`))
    .replace(/\{firstName\}/g, stripDiacritics(reservation.firstName))
    .replace(/\{lastName\}/g, stripDiacritics(reservation.lastName));
  const context = { userEmail: options.userEmail ?? "system", reservationId: reservation.id };

  const sendCustomer = options.sendCustomer ?? camp.smsNotifyCustomer;
  const sendAdmin = options.sendAdmin ?? camp.smsNotifyAdmin;

  if (sendCustomer) {
    const phone = options.customPhone ?? reservation.phone;
    if (phone) {
      await sendSms(prisma, camp.organizationId, org.goSmsClientId, org.goSmsClientSecret, org.goSmsChannelId, phone, message, context);
    }
  }

  if (sendAdmin && camp.smsAdminPhones.length > 0) {
    await sendSms(prisma, camp.organizationId, org.goSmsClientId, org.goSmsClientSecret, org.goSmsChannelId, camp.smsAdminPhones, message, context).catch(() => {});
  }
}
