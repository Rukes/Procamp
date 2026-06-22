import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import { Reservation, Camp } from "@procamp/shared";
import { logActivity } from "./activityLog";

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function formatDate(val: string | Date): string {
  const d = new Date(val);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

function buildVars(reservation: Reservation & { camp: Camp }, nights: number): Record<string, string> {
  const at = reservation.accommodationType as unknown as Record<string, unknown> | null;
  const lang = reservation.languageCode ?? "cs";
  const trans = at?.translations as Record<string, { name?: string }> | undefined;
  const accommodationName = trans?.[lang]?.name ?? trans?.["cs"]?.name ?? "-";

  return {
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    email: reservation.email,
    phone: reservation.phone,
    licensePlate: reservation.licensePlate ?? "-",
    expectedArrival: reservation.expectedArrival ?? "-",
    note: reservation.note ?? "-",
    checkIn: formatDate(reservation.checkIn),
    checkOut: formatDate(reservation.checkOut),
    nights: String(nights),
    accommodationType: accommodationName,
    adults: String(reservation.adults),
    children: String(reservation.children),
    totalPrice: String(reservation.totalPrice),
    campName: reservation.camp.name,
    reservationId: reservation.id,
    status: reservation.status,
  };
}

function getSystemSmtp(): { host: string; port: number; user: string; pass: string; from: string } | null {
  const host = process.env.SYSTEM_SMTP_HOST;
  const user = process.env.SYSTEM_SMTP_USER;
  const pass = process.env.SYSTEM_SMTP_PASS;
  const from = process.env.SYSTEM_SMTP_FROM;
  if (!host || !user || !pass || !from) return null;
  return { host, port: parseInt(process.env.SYSTEM_SMTP_PORT ?? "587"), user, pass, from };
}

export async function sendReservationEmails(
  prisma: PrismaClient,
  reservation: Reservation & { camp: Camp },
  nights: number,
  only?: { sendCustomer?: boolean; sendAdmin?: boolean },
  triggeredBy?: string,
) {
  // Kill switch — pokud je SMTP vypnuté v nastavení systému, neodesílat nic
  const settings = await (prisma as any).systemSettings.findUnique({ where: { id: "singleton" }, select: { smtpEnabled: true } });
  if (settings && settings.smtpEnabled === false) return;

  const camp = reservation.camp;
  const useCustom = (camp as any).useCustomSmtp === true;

  let smtpConfig: { host: string; port: number; user: string; pass: string; from: string; replyTo?: string } | null = null;

  if (useCustom && camp.smtpHost && camp.smtpUser) {
    smtpConfig = {
      host: camp.smtpHost,
      port: camp.smtpPort,
      user: camp.smtpUser,
      pass: camp.smtpPasswordEncrypted,
      from: camp.smtpFrom,
      replyTo: (camp as any).smtpReplyTo || undefined,
    };
  } else if (!useCustom) {
    const sys = getSystemSmtp();
    if (sys) smtpConfig = { ...sys, replyTo: camp.notificationEmail || undefined };
  }

  if (!smtpConfig) return;

  const transport = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    auth: { user: smtpConfig.user, pass: smtpConfig.pass },
  } as nodemailer.TransportOptions);

  const lang = reservation.languageCode;
  const vars = buildVars(reservation, nights);

  const adminTpl = await prisma.emailTemplate.findUnique({
    where: { campId_type_languageCode: { campId: camp.id, type: "ADMIN_NOTIFICATION", languageCode: lang } },
  }) ?? await prisma.emailTemplate.findUnique({
    where: { campId_type_languageCode: { campId: camp.id, type: "ADMIN_NOTIFICATION", languageCode: "cs" } },
  });

  const customerTpl = await prisma.emailTemplate.findUnique({
    where: { campId_type_languageCode: { campId: camp.id, type: "CUSTOMER_CONFIRMATION", languageCode: lang } },
  }) ?? await prisma.emailTemplate.findUnique({
    where: { campId_type_languageCode: { campId: camp.id, type: "CUSTOMER_CONFIRMATION", languageCode: "cs" } },
  });

  const logBase = { userEmail: triggeredBy ?? "system", entity: "reservation", entityId: reservation.id };

  const sendAdmin = only ? (only.sendAdmin ?? true) : true;
  const sendCustomer = only ? (only.sendCustomer ?? true) : true;

  if (sendAdmin && adminTpl) {
    const to = camp.notificationEmail.split(",").map((e) => e.trim()).filter(Boolean).join(", ");
    try {
      await transport.sendMail({ from: smtpConfig.from, replyTo: smtpConfig.replyTo, to, subject: renderTemplate(adminTpl.subject, vars), html: renderTemplate(adminTpl.body, vars) });
      await logActivity(prisma, { ...logBase, action: "EMAIL_SENT", payload: { type: "ADMIN_NOTIFICATION", to } });
    } catch (err: unknown) {
      await logActivity(prisma, { ...logBase, action: "EMAIL_FAILED", payload: { type: "ADMIN_NOTIFICATION", to, error: String(err) } });
    }
  }

  if (sendCustomer && customerTpl) {
    const to = reservation.email;
    try {
      await transport.sendMail({ from: smtpConfig.from, replyTo: smtpConfig.replyTo, to, subject: renderTemplate(customerTpl.subject, vars), html: renderTemplate(customerTpl.body, vars) });
      await logActivity(prisma, { ...logBase, action: "EMAIL_SENT", payload: { type: "CUSTOMER_CONFIRMATION", to } });
    } catch (err: unknown) {
      await logActivity(prisma, { ...logBase, action: "EMAIL_FAILED", payload: { type: "CUSTOMER_CONFIRMATION", to, error: String(err) } });
    }
  }
}

declare module "@procamp/shared" {
  interface Camp {
    smtpPasswordEncrypted: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpFrom: string;
    smtpReplyTo: string;
  }
}
