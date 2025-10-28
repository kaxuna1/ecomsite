import nodemailer from 'nodemailer';
import { env } from '../config/env';

type Contact = { name: string; email: string; phone?: string };

const transporter = env.smtpHost
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort ?? 587,
      secure: false,
      auth: env.smtpUser
        ? {
            user: env.smtpUser,
            pass: env.smtpPassword
          }
        : undefined
    })
  : null;

export async function sendOrderConfirmation(contact: Contact, orderId: number) {
  const subject = `Luxia Products — Order ${orderId} received`;
  const text = `Dear ${contact.name},\n\nThank you for reserving your Luxia products.\n\nOur concierge team will review your order and send manual payment instructions shortly.\n\nWarmly,\nLuxia Products`;

  if (transporter) {
    await transporter.sendMail({
      from: env.notifyFrom,
      to: contact.email,
      subject,
      text
    });
  } else {
    console.info('[email] %s -> %s\n%s', subject, contact.email, text);
  }

  if (contact.phone && env.smsWebhookUrl && env.smsApiKey) {
    await fetch(env.smsWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.smsApiKey}`
      },
      body: JSON.stringify({
        to: contact.phone,
        from: env.smsFrom,
        message: `Luxia Products: Order ${orderId} received. Check email for manual payment instructions.`
      })
    }).catch((error) => console.error('SMS notification failed', error));
  } else if (contact.phone) {
    console.info('[sms] Order %s -> %s', orderId, contact.phone);
  }
}
