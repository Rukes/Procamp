import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import { Reservation, Camp } from "@procamp/shared";

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function buildVars(reservation: Reservation & { camp: Camp }, nights: number): Record<string, string> {
  return {
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    email: reservation.email,
    phone: reservation.phone,
    licensePlate: reservation.licensePlate ?? "-",
    expectedArrival: reservation.expectedArrival ?? "-",
    note: reservation.note ?? "-",
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    nights: String(nights),
    accommodationType: String(reservation.accommodationType ?? "-"),
    adults: String(reservation.adults),
    children: String(reservation.children),
    totalPrice: String(reservation.totalPrice),
    campName: reservation.camp.name,
    reservationId: reservation.id,
    status: reservation.status,
  };
}

export async function sendReservationEmails(
  prisma: PrismaClient,
  reservation: Reservation & { camp: Camp },
  nights: number,
) {
  const camp = reservation.camp;
  if (!camp.smtpHost || !camp.smtpUser) return;

  const transport = nodemailer.createTransport({
    host: camp.smtpHost,
    port: camp.smtpPort,
    auth: { user: camp.smtpUser, pass: camp.smtpPasswordEncrypted },
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

  const from = camp.smtpFrom;

  if (adminTpl) {
    await transport.sendMail({
      from,
      to: camp.notificationEmail.split(",").map((e) => e.trim()).filter(Boolean).join(", "),
      subject: renderTemplate(adminTpl.subject, vars),
      html: renderTemplate(adminTpl.body, vars),
    });
  }

  if (customerTpl) {
    await transport.sendMail({
      from,
      to: reservation.email,
      subject: renderTemplate(customerTpl.subject, vars),
      html: renderTemplate(customerTpl.body, vars),
    });
  }
}

declare module "@procamp/shared" {
  interface Camp {
    smtpPasswordEncrypted: string;
  }
}
