import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Bản 48×48 (~1KB) — logo.png gốc ~170KB gây Gmail clip mail. */
const LOGO_EMAIL_PATH = join(__dirname, '../assets/logo-email.png');
const LOGO_FALLBACK_PATH = join(__dirname, '../assets/logo.png');
const LOGO_CID = 'nomnom-logo@nomnom';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const isSecure = port === 465 || String(process.env.SMTP_SECURE) === 'true';

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port,
    secure: isSecure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return transporter;
}

/** Tên hiển thị trong hộp thư (Gmail cần object `from`, không chỉ chuỗi). */
function resolveFrom() {
  const address = process.env.SMTP_USER;
  if (!address) return null;

  const raw = process.env.SMTP_FROM?.trim();
  let name = 'NomNom';
  if (raw) {
    if (raw.includes('<')) {
      const m = raw.match(/^([^<]+)</);
      if (m) name = m[1].trim().replace(/^["']|["']$/g, '');
    } else if (!raw.includes('@')) {
      name = raw;
    }
  }

  return { name, address };
}

function resolveLogoPath() {
  if (existsSync(LOGO_EMAIL_PATH)) return LOGO_EMAIL_PATH;
  if (existsSync(LOGO_FALLBACK_PATH)) return LOGO_FALLBACK_PATH;
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Gmail chặn data: URI → dùng cid inline (file nhỏ) hoặc URL HTTPS công khai.
 */
function buildLogoParts() {
  const publicUrl = process.env.EMAIL_LOGO_URL?.trim();
  if (publicUrl) {
    return {
      html: `<img src="${escapeHtml(publicUrl)}" alt="" width="28" height="28" style="display:block;border-radius:6px;" />`,
      attachments: [],
    };
  }

  const path = resolveLogoPath();
  if (!path) return { html: '', attachments: [] };

  return {
    html: `<img src="cid:${LOGO_CID}" alt="" width="28" height="28" style="display:block;border-radius:6px;" />`,
    attachments: [
      {
        path,
        cid: LOGO_CID,
        contentType: 'image/png',
        contentDisposition: 'inline',
      },
    ],
  };
}

function buildRegisterOtpHtml({ fullName, code }) {
  const safeName = escapeHtml(fullName);
  const safeCode = escapeHtml(code);
  const { html: logoBlock } = buildLogoParts();

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000000;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:440px;">
          <tr>
            <td style="padding-bottom:20px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
                <tr>
                  ${logoBlock ? `<td style="padding-right:10px;vertical-align:middle;">${logoBlock}</td>` : ''}
                  <td style="vertical-align:middle;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#000000;white-space:nowrap;">nomnom<span style="color:#0d74ce;">.</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px 24px;">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#666666;text-transform:uppercase;letter-spacing:0.06em;">Xác minh email</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.3;color:#000000;">Xin chào, ${safeName}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333333;">
                Dùng mã 6 chữ số bên dưới để hoàn tất đăng ký tài khoản NomNom. Mã có hiệu lực <strong>10 phút</strong>.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:16px 12px;">
                    <span style="font-size:28px;font-weight:700;letter-spacing:0.25em;color:#000000;font-variant-numeric:tabular-nums;white-space:nowrap;display:inline-block;padding-left:0.25em;">${safeCode}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#666666;">
                Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;text-align:center;font-size:12px;line-height:1.5;color:#999999;">
              © NomNom · Giao đồ ăn, editorial &amp; tối giản
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildResetOtpHtml({ fullName, code }) {
  const safeName = escapeHtml(fullName);
  const safeCode = escapeHtml(code);
  const { html: logoBlock } = buildLogoParts();

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000000;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:440px;">
        <tr><td style="padding-bottom:20px;text-align:center;">
          <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;"><tr>
            ${logoBlock ? `<td style="padding-right:10px;vertical-align:middle;">${logoBlock}</td>` : ''}
            <td style="vertical-align:middle;font-size:22px;font-weight:600;color:#000;">nomnom<span style="color:#0d74ce;">.</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:28px 24px;">
          <p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.06em;">Đặt lại mật khẩu</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;">Xin chào, ${safeName}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333;">
            Mã bên dưới dùng để đặt lại mật khẩu NomNom. Mã có hiệu lực <strong>10 phút</strong>.
          </p>
          <table role="presentation" width="100%"><tr>
            <td align="center" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:16px 12px;">
              <span style="font-size:28px;font-weight:700;letter-spacing:0.25em;color:#000000;font-variant-numeric:tabular-nums;white-space:nowrap;display:inline-block;padding-left:0.25em;">${safeCode}</span>
            </td>
          </tr></table>
          <p style="margin:24px 0 0;font-size:13px;color:#666;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email.</p>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;font-size:12px;color:#999;">© NomNom · Giao đồ ăn tận nơi</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendMailMessage({ to, subject, text, html, attachments = [] }) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    const fromAddress = process.env.RESEND_FROM?.trim() || 'NomNom <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Resend Error]', errText);
      throw new Error(`Resend error: ${errText}`);
    }
    return { dev: false };
  }

  const transport = getTransporter();
  const from = resolveFrom();

  if (!transport || !from) {
    console.log(`[NomNom DEV] Email to ${to}: ${subject}`);
    return { dev: true };
  }

  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
    attachments,
  });

  return { dev: false };
}

export async function sendPasswordResetOtpEmail({ to, code, fullName }) {
  const logo = buildLogoParts();
  return sendMailMessage({
    to,
    subject: 'Mã đặt lại mật khẩu NomNom',
    text: `Xin chào ${fullName},\n\nMã đặt lại mật khẩu NomNom: ${code}\nMã có hiệu lực 10 phút.\n\nNếu bạn không yêu cầu, hãy bỏ qua email.\n\n— NomNom`,
    html: buildResetOtpHtml({ fullName, code }),
    attachments: logo.attachments,
  });
}

export async function sendAdminResetPasswordEmail({ to, fullName, newPassword }) {
  const safeName = escapeHtml(fullName);
  const safePassword = escapeHtml(newPassword);
  const logo = buildLogoParts();

  return sendMailMessage({
    to,
    subject: 'Mật khẩu mới NomNom',
    text: `Xin chào ${fullName},\n\nMật khẩu mới NomNom của bạn là: ${newPassword}\n\nVui lòng đăng nhập và thay đổi mật khẩu nếu cần.\n\n— NomNom`,
    html: `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#fafafa;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000000;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:440px;"><tr><td style="padding-bottom:20px;text-align:center;"><table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;"><tr>${logo.html ? `<td style="padding-right:10px;vertical-align:middle;">${logo.html}</td>` : ''}<td style="vertical-align:middle;font-size:22px;font-weight:600;color:#000;">nomnom<span style="color:#0d74ce;">.</span></td></tr></table></td></tr><tr><td style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px 24px;"><p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.06em;">Đặt lại mật khẩu</p><h1 style="margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.3;color:#000;">Xin chào, ${safeName}</h1><p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333;">Mật khẩu mới của bạn là:</p><table role="presentation" width="100%"><tr><td align="center" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:20px 16px;"><span style="font-size:20px;font-weight:600;letter-spacing:0.1em;">${safePassword}</span></td></tr></table><p style="margin:24px 0 0;font-size:13px;color:#666;">Hãy đăng nhập và cập nhật mật khẩu nếu cần.</p></td></tr><tr><td style="padding-top:20px;text-align:center;font-size:12px;color:#999;">© NomNom · Giao đồ ăn tận nơi</td></tr></table></td></tr></table></body></html>`,
    attachments: logo.attachments,
  });
}

export async function sendAccountSuspensionEmail({ to, fullName, reason, expiresAt }) {
  const safeName = escapeHtml(fullName);
  const safeReason = escapeHtml(reason);
  const expiresText = expiresAt ? new Date(expiresAt).toLocaleDateString('vi-VN') : null;
  const logo = buildLogoParts();

  return sendMailMessage({
    to,
    subject: 'Tài khoản NomNom đã bị đình chỉ',
    text: `Xin chào ${fullName},\n\nTài khoản NomNom của bạn đã bị đình chỉ${expiresText ? ` đến ${expiresText}` : ''}.\nLý do: ${reason}\n\nNếu bạn cần hỗ trợ, vui lòng liên hệ bộ phận quản trị.\n\n— NomNom`,
    html: `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#fafafa;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000000;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:440px;"><tr><td style="padding-bottom:20px;text-align:center;"><table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;"><tr>${logo.html ? `<td style="padding-right:10px;vertical-align:middle;">${logo.html}</td>` : ''}<td style="vertical-align:middle;font-size:22px;font-weight:600;color:#000;">nomnom<span style="color:#0d74ce;">.</span></td></tr></table></td></tr><tr><td style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px 24px;"><p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.06em;">Thông báo đình chỉ tài khoản</p><h1 style="margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.3;color:#000;">Xin chào, ${safeName}</h1><p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333;">Tài khoản của bạn đã bị đình chỉ${expiresText ? ` đến ${escapeHtml(expiresText)}` : ''}.</p><p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333;"><strong>Lý do:</strong> ${safeReason}</p><p style="margin:0 0 0;font-size:13px;line-height:1.5;color:#666;">Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ bộ phận quản trị NomNom.</p></td></tr><tr><td style="padding-top:20px;text-align:center;font-size:12px;color:#999;">© NomNom · Giao đồ ăn tận nơi</td></tr></table></td></tr></table></body></html>`,
    attachments: logo.attachments,
  });
}

function buildKycStatusHtml({ fullName, headline, message, ctaLabel, ctaPath }) {
  const safeName = escapeHtml(fullName);
  const safeHeadline = escapeHtml(headline);
  const safeMessage = escapeHtml(message);
  const safeCta = escapeHtml(ctaLabel);
  const { html: logoBlock } = buildLogoParts();
  const appUrl = process.env.APP_URL?.trim() || 'http://localhost:5173';
  const ctaHref = ctaPath ? `${appUrl.replace(/\/$/, '')}${ctaPath}` : appUrl;

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:440px;">
        <tr><td style="padding-bottom:20px;text-align:center;">
          <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;"><tr>
            ${logoBlock ? `<td style="padding-right:10px;vertical-align:middle;">${logoBlock}</td>` : ''}
            <td style="vertical-align:middle;font-size:22px;font-weight:600;color:#000;">nomnom<span style="color:#0d74ce;">.</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:28px 24px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;">Xin chào, ${safeName}</h1>
          <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#000;">${safeHeadline}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333;">${safeMessage}</p>
          ${ctaPath ? `<p style="margin:0;"><a href="${escapeHtml(ctaHref)}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">${safeCta}</a></p>` : ''}
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;font-size:12px;color:#999;">© NomNom</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendKycApprovedEmail({ to, fullName, subjectKind, portalPath }) {
  const headline = `Hồ sơ ${subjectKind} đã được duyệt`;
  const message = `Chúc mừng! Hồ sơ ${subjectKind} của bạn đã được đội ngũ NomNom phê duyệt. Bạn có thể đăng nhập và bắt đầu sử dụng portal ngay.`;
  const logo = buildLogoParts();

  return sendMailMessage({
    to,
    subject: `NomNom — ${headline}`,
    text: `Xin chào ${fullName},\n\n${message}\n\n— NomNom`,
    html: buildKycStatusHtml({
      fullName,
      headline,
      message,
      ctaLabel: 'Mở portal',
      ctaPath: portalPath,
    }),
    attachments: logo.attachments,
  });
}

export async function sendKycRejectedEmail({ to, fullName, subjectKind, reason, portalPath }) {
  const headline = `Hồ sơ ${subjectKind} chưa được chấp nhận`;
  const safeReason = String(reason ?? '').trim() || 'Không có lý do cụ thể.';
  const message = `Rất tiếc, hồ sơ ${subjectKind} của bạn chưa được chấp nhận.\n\nLý do: ${safeReason}\n\nVui lòng kiểm tra lại giấy tờ và nộp lại hồ sơ.`;
  const logo = buildLogoParts();

  return sendMailMessage({
    to,
    subject: `NomNom — ${headline}`,
    text: `Xin chào ${fullName},\n\n${message}\n\n— NomNom`,
    html: buildKycStatusHtml({
      fullName,
      headline,
      message: message.replace(/\n/g, '<br/>'),
      ctaLabel: 'Cập nhật hồ sơ',
      ctaPath: portalPath,
    }),
    attachments: logo.attachments,
  });
}

export async function sendRegisterOtpEmail({ to, code, fullName }) {
  const logo = buildLogoParts();

  return sendMailMessage({
    to,
    subject: 'Mã xác minh đăng ký NomNom',
    text: `Xin chào ${fullName},\n\nMã xác minh NomNom của bạn là: ${code}\nMã có hiệu lực 10 phút.\n\nNếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.\n\n— NomNom`,
    html: buildRegisterOtpHtml({ fullName, code }),
    attachments: logo.attachments,
  });
}
