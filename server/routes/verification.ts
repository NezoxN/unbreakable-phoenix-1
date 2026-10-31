import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { handler, HttpError, parse } from '../lib/http';
import { sha256 } from '../lib/session';
import { userLimiter } from '../lib/rateLimit';
import { emailMatchesDomains, parseDomains } from '../lib/emailDomain';
import { currentUser, requireAuth } from '../middleware/auth';
import { sendVerificationCode } from '../services/mail';
import { syncMember } from '../services/discord';
import { loadMe } from './me';

export const verificationRouter = Router();
verificationRouter.use(requireAuth);

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const sendLimiter = userLimiter(15 * 60 * 1000, 3, 'Забагато запитів коду. Спробуйте через 15 хвилин.');

const codeHash = (userId: string, code: string) => sha256(`${userId}:${code}`);

function assertNotVerified(status: string) {
  if (status === 'VERIFIED') throw new HttpError(409, 'Статус студента вже підтверджено.');
}

verificationRouter.post(
  '/email',
  sendLimiter,
  handler(async (req, res) => {
    const user = currentUser(req);
    assertNotVerified(user.verificationStatus);
    const { email } = parse(
      z.object({
        email: z
          .string()
          .trim()
          .toLowerCase()
          .email('Вкажіть дійсну адресу електронної пошти.')
          .max(120),
      }),
      req.body
    );

    if (!user.universityId) {
      throw new HttpError(400, 'Спочатку оберіть свій ЗВО у профілі.');
    }
    const uni = await prisma.university.findUniqueOrThrow({ where: { id: user.universityId } });
    const domains = parseDomains(uni.emailDomains);
    if (!emailMatchesDomains(email, domains)) {
      throw new HttpError(400, 'Пошта не належить вашому ЗВО.', {
        email: `Потрібна корпоративна пошта ${domains.map((d) => '@' + d).join(', ')}. Немає її — завантажте фото студентського.`,
      });
    }
    // Одна студентська пошта — один акаунт
    const taken = await prisma.user.findFirst({
      where: { studentEmail: email, verificationStatus: 'VERIFIED', NOT: { id: user.id } },
    });
    if (taken) {
      throw new HttpError(409, 'Цю пошту вже використано для іншого акаунта.', { email: 'Пошта вже використана.' });
    }

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    await prisma.emailCode.deleteMany({ where: { userId: user.id } });
    await prisma.emailCode.create({
      data: { userId: user.id, email, codeHash: codeHash(user.id, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    });
    await prisma.user.update({ where: { id: user.id }, data: { verificationStatus: 'EMAIL_SENT', studentEmail: email } });
    await sendVerificationCode(email, code);

    res.json({ ok: true, message: `Код надіслано на ${email}. Він дійсний 15 хвилин.` });
  })
);

verificationRouter.post(
  '/email/confirm',
  handler(async (req, res) => {
    const user = currentUser(req);
    assertNotVerified(user.verificationStatus);
    const { code } = parse(z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Код складається з 6 цифр.') }), req.body);

    const record = await prisma.emailCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (!record || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) {
      throw new HttpError(410, 'Код недійсний або прострочений. Запросіть новий.', { code: 'Запросіть новий код.' });
    }
    const ok = crypto.timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(codeHash(user.id, code)));
    if (!ok) {
      await prisma.emailCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new HttpError(400, 'Невірний код.', { code: `Невірний код. Залишилось спроб: ${MAX_ATTEMPTS - record.attempts - 1}.` });
    }

    await prisma.$transaction([
      prisma.emailCode.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: { verificationStatus: 'VERIFIED', studentEmail: record.email, verifiedAt: new Date() },
      }),
    ]);
    await syncMember(user.id);
    res.json({ ok: true, message: 'Статус студента підтверджено!', ...(await loadMe(user.id)) });
  })
);

/* ------------------------------------------------------------------ */
/* Фото студентського квитка (ручна перевірка адміністратором)        */
/* ------------------------------------------------------------------ */

fs.mkdirSync(config.uploadsDir, { recursive: true });

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadsDir,
    filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + ALLOWED_MIME[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, 'Дозволені формати: JPG, PNG, WEBP або PDF.'));
  },
});

export function removeUpload(fileName: string | null | undefined) {
  if (!fileName) return;
  fs.promises.unlink(path.join(config.uploadsDir, path.basename(fileName))).catch(() => undefined);
}

verificationRouter.post(
  '/card',
  userLimiter(60 * 60 * 1000, 5, 'Забагато завантажень. Спробуйте пізніше.'),
  (req, _res, next) => {
    // Перевіряємо статус до прийому файлу, щоб не зберігати зайве
    try {
      assertNotVerified(currentUser(req).verificationStatus);
      next();
    } catch (err) {
      next(err);
    }
  },
  upload.single('card'),
  handler(async (req, res) => {
    const user = currentUser(req);
    if (!req.file) throw new HttpError(400, 'Додайте фото студентського квитка.');
    if (!user.universityId) {
      removeUpload(req.file.filename);
      throw new HttpError(400, 'Спочатку оберіть свій ЗВО у профілі.');
    }

    // Попередня заявка на перевірці замінюється новою
    const previous = await prisma.studentCard.findMany({ where: { userId: user.id, status: 'PENDING' } });
    previous.forEach((c) => removeUpload(c.filePath));
    await prisma.studentCard.deleteMany({ where: { userId: user.id, status: 'PENDING' } });

    await prisma.studentCard.create({
      data: { userId: user.id, filePath: req.file.filename, mimeType: req.file.mimetype },
    });
    await prisma.user.update({ where: { id: user.id }, data: { verificationStatus: 'PENDING_REVIEW' } });
    res.status(201).json({
      ok: true,
      message: 'Фото надіслано. Організатори перевірять його найближчим часом.',
      ...(await loadMe(user.id)),
    });
  })
);
