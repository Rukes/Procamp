import { PrismaClient } from "@prisma/client";

const BOOKING_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateBookingCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) code += BOOKING_CODE_CHARS[Math.floor(Math.random() * BOOKING_CODE_CHARS.length)];
  return code;
}

export async function generateUniqueBookingCode(prisma: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateBookingCode();
    const exists = await prisma.reservation.findUnique({ where: { bookingCode: code } });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique booking code");
}
