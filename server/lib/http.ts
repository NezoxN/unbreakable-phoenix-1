import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z, ZodTypeAny } from 'zod';

/** Помилка, яку обробник перетворює на JSON `{ ok: false, message, errors }` */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string>
  ) {
    super(message);
  }
}

/** Обгортка для async-обробників: будь-який throw потрапляє в errorHandler */
export const handler =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

/** Валідація тіла/квері через zod з помилками у форматі, який уже очікує фронтенд */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] || 'form');
      if (!errors[key]) errors[key] = issue.message;
    }
    throw new HttpError(400, 'Будь ласка, перевірте правильність заповнення полів форми.', errors);
  }
  return result.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ ok: false, message: err.message, errors: err.errors });
    return;
  }
  if (err && typeof err === 'object' && 'code' in err && err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ ok: false, message: 'Файл завеликий. Максимум — 5 МБ.' });
    return;
  }
  console.error('[API Error]:', err);
  res.status(500).json({ ok: false, message: 'Внутрішня помилка сервера. Спробуйте ще раз.' });
}
