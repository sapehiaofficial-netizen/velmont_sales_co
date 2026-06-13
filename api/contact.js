// Vercel serverless function — handles "Book a Call" form submissions.
// Sends the lead's details to the inbox via Resend's REST API.
// Zero dependencies: uses the native fetch available on the Vercel Node runtime.
//
// Required env var (set in Vercel, never committed):
//   RESEND_API_KEY   — your Resend API key (starts with "re_")
// Optional env vars (sane defaults below):
//   CONTACT_TO_EMAIL   — where leads are delivered   (default: sapehiaofficial@gmail.com)
//   CONTACT_FROM_EMAIL — sender; must be a Resend-verified domain.
//                        Defaults to onboarding@resend.dev (works to the account
//                        owner with no domain setup). Once velmontassociates.in is
//                        verified in Resend, set this to
//                        "Velmont Associates <noreply@velmontassociates.in>".

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "sapehiaofficial@gmail.com";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "Velmont Associates <onboarding@resend.dev>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function readBody(req) {
  // Vercel usually parses JSON into req.body, but fall back to the raw stream.
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length) {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (e) { return {}; }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return res.status(500).json({ ok: false, error: "Email service is not configured." });
  }

  let data;
  try {
    data = await readBody(req);
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Invalid request body." });
  }

  // Honeypot — bots fill hidden fields; humans never see it.
  if (data.company_website) return res.status(200).json({ ok: true });

  const name = (data.name || "").toString().trim();
  const email = (data.email || "").toString().trim();
  const company = (data.company || "").toString().trim();
  const phone = (data.phone || "").toString().trim();
  const message = (data.message || "").toString().trim();

  if (!name || !email || !company) {
    return res.status(400).json({ ok: false, error: "Name, email, and brand are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
  }

  const subject = `New enquiry — ${name}${company ? ` (${company})` : ""}`;

  const text =
    `New "Book a Call" enquiry from the Velmont Associates site\n\n` +
    `Name:             ${name}\n` +
    `Email:            ${email}\n` +
    `Brand / business: ${company}\n` +
    (phone ? `Phone:            ${phone}\n` : "") +
    (message ? `\nWhat they make / stock:\n${message}\n` : "") +
    `\n— sent from velmontassociates.in`;

  const html =
    `<div style="font-family:Georgia,'Times New Roman',serif;color:#1c2b22;line-height:1.6;max-width:560px">` +
      `<p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#9a8248;margin:0 0 4px">Velmont Associates</p>` +
      `<h2 style="margin:0 0 18px;font-size:22px;color:#16271d">New &ldquo;Book a Call&rdquo; enquiry</h2>` +
      `<table style="border-collapse:collapse;width:100%;font-size:15px">` +
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7a70;white-space:nowrap;vertical-align:top">Name</td><td style="padding:6px 0"><strong>${esc(name)}</strong></td></tr>` +
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7a70;vertical-align:top">Email</td><td style="padding:6px 0"><a href="mailto:${esc(email)}" style="color:#9a8248">${esc(email)}</a></td></tr>` +
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7a70;vertical-align:top">Brand</td><td style="padding:6px 0">${esc(company)}</td></tr>` +
        (phone ? `<tr><td style="padding:6px 12px 6px 0;color:#6b7a70;vertical-align:top">Phone</td><td style="padding:6px 0">${esc(phone)}</td></tr>` : "") +
      `</table>` +
      (message ? `<p style="margin:18px 0 6px;color:#6b7a70;font-size:13px;text-transform:uppercase;letter-spacing:.06em">What they make / stock</p><p style="margin:0;white-space:pre-wrap">${esc(message)}</p>` : "") +
      `<hr style="border:none;border-top:1px solid #e3e0d6;margin:22px 0 10px"/>` +
      `<p style="font-size:12px;color:#9aa49b;margin:0">Sent from velmontassociates.in &middot; reply directly to reach ${esc(name)}.</p>` +
    `</div>`;

  let resendRes;
  try {
    resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });
  } catch (e) {
    console.error("Resend request failed:", e);
    return res.status(502).json({ ok: false, error: "Could not reach the email service." });
  }

  if (!resendRes.ok) {
    const detail = await resendRes.text().catch(() => "");
    console.error("Resend error:", resendRes.status, detail);
    return res.status(502).json({ ok: false, error: "The email service rejected the request." });
  }

  return res.status(200).json({ ok: true });
};
