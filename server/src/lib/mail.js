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

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
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
  const digits = safeCode.split('').join('<span style="display:inline-block;width:8px"></span>');
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
                  <td align="center" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:20px 16px;">
                    <span style="font-size:32px;font-weight:600;letter-spacing:0.35em;color:#000000;font-variant-numeric:tabular-nums;">${digits}</span>
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
  const digits = safeCode.split('').join('<span style="display:inline-block;width:8px"></span>');
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
            <td align="center" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:20px 16px;">
              <span style="font-size:32px;font-weight:600;letter-spacing:0.35em;">${digits}</span>
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

export async function sendPasswordResetOtpEmail({ to, code, fullName }) {
  const transport = getTransporter();
  const from = resolveFrom();

  if (!transport || !from) {
    console.log(`[NomNom DEV] Mã đặt lại mật khẩu cho ${to}: ${code}`);
    return { dev: true };
  }

  const logo = buildLogoParts();
  await transport.sendMail({
    from,
    to,
    subject: 'Mã đặt lại mật khẩu NomNom',
    text: `Xin chào ${fullName},\n\nMã đặt lại mật khẩu NomNom: ${code}\nMã có hiệu lực 10 phút.\n\nNếu bạn không yêu cầu, hãy bỏ qua email.\n\n— NomNom`,
    html: buildResetOtpHtml({ fullName, code }),
    attachments: logo.attachments,
  });

  return { dev: false };
}

export async function sendAdminResetPasswordEmail({ to, fullName, newPassword }) {
  const transport = getTransporter();
  const from = resolveFrom();
  const safeName = escapeHtml(fullName);
  const safePassword = escapeHtml(newPassword);

  if (!transport || !from) {
    console.log(`[NomNom DEV] Mật khẩu mới cho ${to}: ${newPassword}`);
    return { dev: true };
  }

  const logo = buildLogoParts();
  await transport.sendMail({
    from,
    to,
    subject: 'Mật khẩu mới NomNom',
    text: `Xin chào ${fullName},\n\nMật khẩu mới NomNom của bạn là: ${newPassword}\n\nVui lòng đăng nhập và thay đổi mật khẩu nếu cần.\n\n— NomNom`,
    html: `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#fafafa;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000000;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:440px;"><tr><td style="padding-bottom:20px;text-align:center;"><table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;"><tr>${logo.html ? `<td style="padding-right:10px;vertical-align:middle;">${logo.html}</td>` : ''}<td style="vertical-align:middle;font-size:22px;font-weight:600;color:#000;">nomnom<span style="color:#0d74ce;">.</span></td></tr></table></td></tr><tr><td style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px 24px;"><p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.06em;">Đặt lại mật khẩu</p><h1 style="margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.3;color:#000;">Xin chào, ${safeName}</h1><p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333;">Mật khẩu mới của bạn là:</p><table role="presentation" width="100%"><tr><td align="center" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:20px 16px;"><span style="font-size:20px;font-weight:600;letter-spacing:0.1em;">${safePassword}</span></td></tr></table><p style="margin:24px 0 0;font-size:13px;color:#666;">Hãy đăng nhập và cập nhật mật khẩu nếu cần.</p></td></tr><tr><td style="padding-top:20px;text-align:center;font-size:12px;color:#999;">© NomNom · Giao đồ ăn tận nơi</td></tr></table></td></tr></table></body></html>`,
    attachments: logo.attachments,
  });

  return { dev: false };
}

/**
 * Gửi mã OTP đăng ký qua Gmail SMTP.
 * Dev: nếu chưa cấu hình SMTP, in mã ra console.
 */
export async function sendRegisterOtpEmail({ to, code, fullName }) {
  const transport = getTransporter();
  const from = resolveFrom();

  if (!transport || !from) {
    console.log(`[NomNom DEV] Mã đăng ký cho ${to}: ${code}`);
    return { dev: true };
  }

  const logo = buildLogoParts();

  await transport.sendMail({
    from,
    to,
    subject: 'Mã xác minh đăng ký NomNom',
    text: `Xin chào ${fullName},\n\nMã xác minh NomNom của bạn là: ${code}\nMã có hiệu lực 10 phút.\n\nNếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.\n\n— NomNom`,
    html: buildRegisterOtpHtml({ fullName, code }),
    attachments: logo.attachments,
  });

  return { dev: false };
}
