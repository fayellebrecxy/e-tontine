import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (!cachedTransporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      // SMTP_SECURE=true => connexion TLS directe (port 465)
      secure: process.env.SMTP_SECURE !== "false",
      auth: { user, pass },
    });
  }

  return cachedTransporter;
}

export function isMailerConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP non configuré (SMTP_HOST / SMTP_USER / SMTP_PASS manquants).");
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
