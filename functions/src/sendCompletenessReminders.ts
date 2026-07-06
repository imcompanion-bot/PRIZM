import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as nodemailer from "nodemailer";

const gmailEmail = defineSecret("GMAIL_EMAIL");
const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");

interface Recipient {
  name: string;
  email: string;
  completeness: number;
  actualHours: number;
  expectedHours: number;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function emailHtml(recipients: Recipient[], periodLabel: string): string {
  const rows = recipients
    .slice()
    .sort((a, b) => a.completeness - b.completeness)
    .map((r) => {
      const pct = Math.round(r.completeness);
      const actual = Math.round(r.actualHours);
      const expected = Math.round(r.expectedHours);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(r.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${pct}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#555;">${actual}h / ${expected}h</td>
      </tr>`;
    })
    .join("");

  const greeting = recipients.length === 1
    ? `Hi ${escapeHtml((recipients[0].name || "").trim().split(/\s+/)[0] || "there")},`
    : "Hi team,";
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.5;">
  <p>${greeting}</p>
  <p>Just a friendly nudge — the following timesheets are currently below 95% complete for <strong>${escapeHtml(periodLabel)}</strong>. Please top yours up when you have a moment so we have a clean view of where time is going.</p>
  <table style="border-collapse:collapse;width:100%;max-width:520px;margin:16px 0;font-size:14px;">
    <thead>
      <tr style="background:#ff7daa;">
        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;color:#ffffff;">Name</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #ddd;color:#ffffff;">Completeness</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #ddd;color:#ffffff;">Logged</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p>Thanks!</p>
  <p>James</p>
  </body></html>`;
}

export const sendCompletenessReminders = onCall(
  { secrets: [gmailEmail, gmailAppPassword], enforceAppCheck: false },
  async (request) => {
    const data = request.data;
    const recipients: Recipient[] = Array.isArray(data?.recipients) ? data.recipients : [];
    const ccList: string[] = Array.isArray(data?.cc) ? data.cc : [];
    const periodLabel: string = String(data?.periodLabel || "the selected period");

    if (!recipients.length) {
      throw new HttpsError("invalid-argument", "No recipients provided");
    }

    const validRecipients = recipients.filter((r) => r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email));
    const invalid = recipients.filter((r) => !validRecipients.includes(r));
    if (!validRecipients.length) {
      throw new HttpsError("invalid-argument", "No valid recipient emails");
    }

    const toHeader = validRecipients.map((r) => `${r.name.replace(/[<>"]/g, "")} <${r.email}>`);
    const subject = `Timesheet reminder — ${periodLabel}`;
    const html = emailHtml(validRecipients, periodLabel);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailEmail.value(),
        pass: gmailAppPassword.value(),
      },
    });

    try {
      const info = await transporter.sendMail({
        from: `"PRIZM Timesheets" <${gmailEmail.value()}>`,
        to: toHeader,
        cc: ccList.length > 0 ? ccList : undefined,
        subject: subject,
        html: html,
      });

      return { ok: true, sentTo: validRecipients.length, invalid: invalid.length, messageId: info.messageId };
    } catch (e: any) {
      throw new HttpsError("internal", String(e));
    }
  }
);
