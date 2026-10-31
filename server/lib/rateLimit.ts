import rateLimit from 'express-rate-limit';

/**
 * Ліміт на дії залогіненого користувача — рахується по акаунту, а не по IP,
 * щоб студенти за одним NAT (гуртожиток, мережа ЗВО) не блокували одне одного.
 */
export const userLimiter = (windowMs: number, max: number, message?: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.user ? `user:${req.user.id}` : (req.ip ?? 'unknown')),
    ...(message ? { message: { ok: false, message } } : {}),
  });
