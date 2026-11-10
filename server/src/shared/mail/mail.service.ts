import { Injectable, Logger } from "@nestjs/common";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../config/env";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface MailResult {
  transport: "smtp" | "file";
  reference: string;
}

/**
 * Single entry point for outgoing mail. With SMTP_URL configured the message is
 * delivered through nodemailer; otherwise it is serialised to MAIL_OUTBOX_DIR so
 * local development and tests never need a mail server.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  async send(message: MailMessage): Promise<MailResult> {
    if (env.SMTP_URL) {
      this.transporter ??= nodemailer.createTransport(env.SMTP_URL);
      const info = await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo,
      });
      return { transport: "smtp", reference: info.messageId };
    }

    const dir = resolve(env.MAIL_OUTBOX_DIR);
    mkdirSync(dir, { recursive: true });
    const reference = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.json`;
    writeFileSync(resolve(dir, reference), JSON.stringify({ from: env.MAIL_FROM, ...message, sentAt: new Date().toISOString() }, null, 2));
    this.logger.debug(`Mail ${reference} to ${message.to} written to ${dir}`);
    return { transport: "file", reference };
  }
}
