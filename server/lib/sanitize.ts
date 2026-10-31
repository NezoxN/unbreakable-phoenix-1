import { z } from 'zod';

// Sanitize string helper (strips HTML tags and control characters)
export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

/** Рядок, очищений від HTML, з перевіркою довжини та українським повідомленням */
export const cleanString = (min: number, max: number, message: string) =>
  z
    .string()
    .transform(sanitizeInput)
    .refine((val) => val.length >= min && val.length <= max, { message });

export const telegramSchema = z
  .string()
  .transform(sanitizeInput)
  .refine((val) => /^@?[a-zA-Z0-9_]{4,32}$/.test(val), {
    message: 'Вкажіть коректний Telegram-нікнейм (@username).',
  })
  .transform((val) => (val.startsWith('@') ? val : `@${val}`));
