import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const NOTIFICATION_EMAIL = process.env.ENGAGEMENT_NOTIFICATION_EMAIL || 'villagecoders7@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HCPT Enterprise <onboarding@resend.dev>';
const DEFAULT_REPLY_TO = 'info@techhalal.com';

const resend = new Resend(RESEND_API_KEY);

export interface EngagementFormData {
  confirmationId: string;
  fullName: string;
  organizationName: string;
  officialEmail: string;
  phoneNumber?: string;
  jurisdiction: string;
  currentSystem: string;
  annualCertificates: string;
  inquiryDetails: string;
  receivedAt?: string;
}

export async function sendEngagementNotification(inquiry: EngagementFormData): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  try {
    const timestamp = inquiry.receivedAt || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #006837; color: #ffffff; padding: 28px 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #a7f3d0; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #064e3b; color: #6ee7b7; border-radius: 9999px; margin-bottom: 12px; border: 1px solid #047857; }
    .content { padding: 24px; }
    .meta-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-label { color: #166534; font-weight: 600; }
    .meta-val { color: #0f172a; font-family: monospace; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .label-col { width: 38%; color: #475569; font-weight: 600; }
    .val-col { width: 62%; color: #0f172a; }
    .inquiry-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 10px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #334155; }
    .cta-btn { display: inline-block; padding: 12px 20px; background: #006837; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Enterprise Engagement Lead</div>
      <h1>HCPT — New Engagement Consultation</h1>
      <p>Institutional inquiry received from official portal intake</p>
    </div>
    
    <div class="content">
      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Confirmation Reference:</span>
          <span class="meta-val">${inquiry.confirmationId}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Submitted Timestamp:</span>
          <span class="meta-val">${timestamp}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th colspan="2">Applicant & Authority Profile</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label-col">Representative Name:</td>
            <td class="val-col"><strong>${inquiry.fullName}</strong></td>
          </tr>
          <tr>
            <td class="label-col">Organization / Authority:</td>
            <td class="val-col"><strong>${inquiry.organizationName}</strong></td>
          </tr>
          <tr>
            <td class="label-col">Official Institutional Email:</td>
            <td class="val-col"><a href="mailto:${inquiry.officialEmail}">${inquiry.officialEmail}</a></td>
          </tr>
          <tr>
            <td class="label-col">Direct Telephone:</td>
            <td class="val-col">${inquiry.phoneNumber || 'Not provided'}</td>
          </tr>
          <tr>
            <td class="label-col">Target Jurisdiction / Region:</td>
            <td class="val-col">${inquiry.jurisdiction}</td>
          </tr>
          <tr>
            <td class="label-col">Current Operating Model:</td>
            <td class="val-col">${inquiry.currentSystem}</td>
          </tr>
          <tr>
            <td class="label-col">Annual Certificate Volume:</td>
            <td class="val-col"><strong>${inquiry.annualCertificates}</strong></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 16px;">
        <strong style="font-size: 13px; color: #1e293b;">Digital Transformation & Workflow Requirements:</strong>
        <div class="inquiry-box">${inquiry.inquiryDetails}</div>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="mailto:${inquiry.officialEmail}?subject=RE:%20HCPT%20Engagement%20Inquiry%20${encodeURIComponent(inquiry.confirmationId)}" class="cta-btn">
          Reply Directly to ${inquiry.fullName} &rarr;
        </a>
      </div>
    </div>

    <div class="footer">
      This notification was automatically dispatched to <strong>${NOTIFICATION_EMAIL}</strong> via HCPT Resend Enterprise Gateway.<br/>
      Official Inquiries Contact: info@techhalal.com | HCPT Digital Halal Infrastructure
    </div>
  </div>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [NOTIFICATION_EMAIL],
      replyTo: [inquiry.officialEmail, DEFAULT_REPLY_TO],
      subject: `[HCPT Lead] ${inquiry.organizationName} — ${inquiry.fullName} (${inquiry.confirmationId})`,
      html: htmlContent
    });

    if (error) {
      console.error('[EmailService] Resend dispatch error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[EmailService] Engagement notification sent to ${NOTIFICATION_EMAIL} (Resend ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[EmailService] Unexpected failure sending email:', err);
    return { success: false, error: err?.message || String(err) };
  }
}
