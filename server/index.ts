import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config';
import { prisma } from './db';
import { errorHandler } from './lib/http';
import { checkOrigin, loadUser } from './middleware/auth';
import { authRouter } from './routes/auth';
import { meRouter } from './routes/me';
import { verificationRouter } from './routes/verification';
import { invitesRouter, teamsRouter } from './routes/teams';
import { marketRouter } from './routes/market';
import { discordRouter } from './routes/discord';
import { publicRouter } from './routes/public';
import { adminRouter } from './routes/admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Vite/Unsplash assets in production preview
  })
);

app.use(
  cors({
    origin: new URL(config.APP_URL).origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.use('/api', checkOrigin, loadUser);

// Healthcheck endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const [players, teams] = await Promise.all([
    prisma.user.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.team.count({ where: { status: 'APPROVED' } }),
  ]);
  res.json({
    ok: true,
    service: 'unbreakable-phoenix-api',
    status: 'operational',
    verifiedPlayersCount: players,
    registeredTeamsCount: teams,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/market', marketRouter);
app.use('/api/discord', discordRouter);
app.use('/api/admin', adminRouter);
app.use('/api', publicRouter);

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ ok: false, message: 'Endpoint не знайдено.' });
});
app.use(errorHandler);

// Serve static production frontend when NODE_ENV === 'production'
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to SPA index.html for non-API GET routes
app.use(async (req: Request, res: Response, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    next();
    return;
  }
  try {
    const indexHtml = path.join(distPath, 'index.html');
    await fs.access(indexHtml);
    res.sendFile(indexHtml);
  } catch {
    res.status(404).json({
      ok: false,
      message: 'Frontend build not found. Run `npm run build` first or use Vite dev server.',
    });
  }
});

app.listen(config.PORT, () => {
  console.log(`[UNBREAKABLE PHOENIX API] Server listening on http://localhost:${config.PORT}`);
  if (config.devLogin) console.log('[UNBREAKABLE PHOENIX API] DEV_LOGIN увімкнено — вхід без FACEIT доступний.');
});
