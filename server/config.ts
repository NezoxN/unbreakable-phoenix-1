import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

// .env підвантажуємо вбудованим механізмом Node (без dotenv)
const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  APP_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('file:../server/data/app.db'),
  SESSION_TTL_DAYS: z.coerce.number().default(30),
  RATE_LIMIT_MAX: z.coerce.number().default(10),

  FACEIT_CLIENT_ID: optional,
  FACEIT_CLIENT_SECRET: optional,
  FACEIT_API_KEY: optional,

  DISCORD_CLIENT_ID: optional,
  DISCORD_CLIENT_SECRET: optional,
  DISCORD_BOT_TOKEN: optional,
  DISCORD_GUILD_ID: optional,
  DISCORD_PLAYER_ROLE_ID: optional,
  DISCORD_CAPTAIN_ROLE_ID: optional,
  DISCORD_TEAMS_CATEGORY_ID: optional,

  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: optional,
  SMTP_PASS: optional,
  SMTP_FROM: z.string().default('UNBREAKABLE PHOENIX <no-reply@unbreakable-phoenix.ua>'),

  ADMIN_FACEIT_IDS: z
    .string()
    .default('')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  /** Учасники команди мають бути з того ж ЗВО, що й команда */
  TEAM_SAME_UNIVERSITY: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),
  /** Вхід без FACEIT для локальної розробки. Ніколи не вмикається в production. */
  DEV_LOGIN: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[config] Некоректні змінні оточення:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;
process.env.DATABASE_URL = env.DATABASE_URL;

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  devLogin: env.DEV_LOGIN && env.NODE_ENV !== 'production',
  faceitEnabled: Boolean(env.FACEIT_CLIENT_ID && env.FACEIT_CLIENT_SECRET),
  faceitDataEnabled: Boolean(env.FACEIT_API_KEY),
  discordOAuthEnabled: Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
  discordBotEnabled: Boolean(env.DISCORD_BOT_TOKEN && env.DISCORD_GUILD_ID),
  smtpEnabled: Boolean(env.SMTP_HOST),
  uploadsDir: path.resolve(process.cwd(), 'server/uploads'),
};

if (config.isProd && !config.faceitEnabled) {
  console.warn('[config] FACEIT OAuth не налаштовано — вхід на сайт буде недоступний.');
}
