import nodemailer from "nodemailer";
import { createMagicLinkToken } from "./jwt";
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
 * Send a magic link email to the user.
 * @param email - The email of the user to send the magic link to.
 * @returns A promise that resolves when the email is sent.
 */
export async function sendMagicLinkEmail(email: string): Promise<void> {
  const token = await createMagicLinkToken(email);
  const baseUrl = env.BASE_URL || "http://localhost:3000";
  const magicLink = `${baseUrl}/auth/verify/${encodeURIComponent(token)}`;

  const mailOptions = {
    from: env.SMTP_FROM,
    to: email,
    subject: "Sign in to Azure Billing",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Sign in to Azure Billing</h1>
        <p>Click the link below to sign in:</p>
        <p>
          <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 4px;">
            Sign In
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 5 minutes.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this link, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Sign in to Azure Billing\n\nClick this link to sign in: ${magicLink}\n\nThis link will expire in 5 minutes.`,
  };

  if (env.NEXT_PUBLIC_NO_EMAIL_SEND) {
    console.log(magicLink);

    return;
  }

  const transport = getTransporter();
  await transport.sendMail(mailOptions);
}
