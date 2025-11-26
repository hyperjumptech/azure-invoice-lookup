import nodemailer from "nodemailer";
import { env } from "@workspace/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

/**
 * The function that sends an email.
 * @param to - The email address to send the email to.
 * @param subject - The subject of the email.
 * @param html - The HTML content of the email.
 * @param html
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
};
