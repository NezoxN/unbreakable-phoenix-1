import nodemailer from 'nodemailer';
import { config } from '../config';

const transport = config.smtpEnabled
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
    })
  : null;

export async function sendVerificationCode(email: string, code: string) {
  if (!transport) {
    // Без SMTP (локальна розробка) код просто виводиться в консоль
    console.log(`[mail] Код підтвердження для ${email}: ${code}`);
    return;
  }
  await transport.sendMail({
    from: config.SMTP_FROM,
    to: email,
    subject: `Код підтвердження: ${code} — UNBREAKABLE PHOENIX`,
    text: `Ваш код підтвердження статусу студента: ${code}\n\nКод дійсний 15 хвилин. Якщо ви не реєструвалися в лізі UNBREAKABLE PHOENIX — просто проігноруйте цей лист.`,
    html: `<p>Ваш код підтвердження статусу студента:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Код дійсний 15 хвилин. Якщо ви не реєструвалися в лізі UNBREAKABLE PHOENIX — просто проігноруйте цей лист.</p>`,
  });
}
