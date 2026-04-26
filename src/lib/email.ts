// ============================================================
// 이메일 발송 모듈 (nodemailer + Gmail SMTP)
// ============================================================
import type { News } from '@/types';
import { format } from 'date-fns';

/** 이메일 발송 옵션 */
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * 이메일을 발송합니다.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'CB 뉴스레터'}" <${process.env.SMTP_USER}>`,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
  });
}

/**
 * 뉴스레터 HTML 이메일을 생성합니다.
 */
export function generateNewsletterHTML(
  news: News[],
  dailySummary: string,
  date: Date = new Date()
): string {
  const dateStr = format(date, 'yyyy년 MM월 dd일');
  const topNews = news.filter((n) => n.is_featured).slice(0, 5);
  const domesticNews = news.filter((n) => n.category === 'domestic').slice(0, 8);
  const globalNews = news.filter((n) => n.category === 'global').slice(0, 5);
  const reportNews = news.filter((n) => n.category === 'report').slice(0, 3);

  const categoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      domestic: '#1e40af',
      global: '#065f46',
      report: '#7c3aed',
    };
    const labels: Record<string, string> = {
      domestic: '국내',
      global: '글로벌',
      report: '리포트',
    };
    return `<span style="background:${colors[category] || '#374151'};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${labels[category] || category}</span>`;
  };

  const newsItem = (item: News) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${categoryBadge(item.category)}
              <span style="color:#6b7280;font-size:12px;margin-left:8px;">${item.source}</span>
            </td>
            <td align="right">
              <span style="color:#9ca3af;font-size:11px;">
                ${item.published_at ? format(new Date(item.published_at), 'MM/dd') : ''}
              </span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:6px;">
              <a href="${item.url}" style="color:#1e3a8a;font-weight:600;font-size:14px;text-decoration:none;"
                 onmouseover="this.style.textDecoration='underline'">${item.title}</a>
            </td>
          </tr>
          ${item.summary ? `
          <tr>
            <td colspan="2" style="padding-top:4px;color:#4b5563;font-size:13px;line-height:1.5;">
              ${item.summary}
            </td>
          </tr>` : ''}
          ${item.insight ? `
          <tr>
            <td colspan="2" style="padding-top:6px;">
              <div style="background:#f0f4ff;border-left:3px solid #1e40af;padding:8px 12px;border-radius:0 4px 4px 0;">
                <span style="color:#1e40af;font-size:12px;font-weight:600;">💡 CB 관점: </span>
                <span style="color:#374151;font-size:12px;">${item.insight}</span>
              </div>
            </td>
          </tr>` : ''}
          ${item.action_idea ? `
          <tr>
            <td colspan="2" style="padding-top:6px;">
              <div style="background:#f0fdf4;border-left:3px solid #16a34a;padding:8px 12px;border-radius:0 4px 4px 0;">
                <span style="color:#16a34a;font-size:12px;font-weight:600;">✅ 액션: </span>
                <span style="color:#374151;font-size:12px;">${item.action_idea}</span>
              </div>
            </td>
          </tr>` : ''}
        </table>
      </td>
    </tr>`;

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CB Daily Brief ${dateStr}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
    <tr>
      <td align="center" style="padding:20px;">
        <table width="680" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- 헤더 -->
          <tr>
            <td style="background:linear-gradient(135deg,#172554,#1e40af);padding:28px 32px;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="color:#93c5fd;font-size:12px;font-weight:600;letter-spacing:1px;">CB DAILY BRIEF</div>
                    <div style="color:white;font-size:22px;font-weight:700;margin-top:4px;">${dateStr}</div>
                    <div style="color:#bfdbfe;font-size:13px;margin-top:4px;">기업신용평가 · 기업여신 · AI 금융 트렌드</div>
                  </td>
                  <td align="right">
                    <div style="color:#f59e0b;font-size:28px;font-weight:800;">CB</div>
                    <div style="color:#bfdbfe;font-size:11px;">Credit Bureau</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 오늘의 핵심 요약 -->
          <tr>
            <td style="padding:24px 32px;background:#f0f4ff;border-bottom:1px solid #e0eaff;">
              <div style="color:#1e3a8a;font-size:14px;font-weight:700;margin-bottom:8px;">📊 오늘의 핵심 요약</div>
              <div style="color:#374151;font-size:14px;line-height:1.7;">${dailySummary}</div>
              <div style="margin-top:12px;color:#6b7280;font-size:12px;">
                총 ${news.length}건 수집 · 국내 ${domesticNews.length}건 · 글로벌 ${globalNews.length}건 · 리포트 ${reportNews.length}건
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px;">

              <!-- TOP 뉴스 -->
              ${topNews.length > 0 ? `
              <div style="margin-bottom:24px;">
                <div style="color:#1e3a8a;font-size:16px;font-weight:700;padding-bottom:12px;border-bottom:2px solid #1e40af;margin-bottom:12px;">
                  ⭐ 주요 뉴스 TOP ${topNews.length}
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${topNews.map(newsItem).join('')}
                </table>
              </div>` : ''}

              <!-- 국내 뉴스 -->
              ${domesticNews.length > 0 ? `
              <div style="margin-bottom:24px;">
                <div style="color:#1e3a8a;font-size:16px;font-weight:700;padding-bottom:12px;border-bottom:2px solid #e5e7eb;margin-bottom:12px;">
                  🇰🇷 국내 뉴스
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${domesticNews.map(newsItem).join('')}
                </table>
              </div>` : ''}

              <!-- 글로벌 뉴스 -->
              ${globalNews.length > 0 ? `
              <div style="margin-bottom:24px;">
                <div style="color:#065f46;font-size:16px;font-weight:700;padding-bottom:12px;border-bottom:2px solid #e5e7eb;margin-bottom:12px;">
                  🌐 글로벌 뉴스
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${globalNews.map(newsItem).join('')}
                </table>
              </div>` : ''}

              <!-- 리포트 -->
              ${reportNews.length > 0 ? `
              <div style="margin-bottom:24px;">
                <div style="color:#7c3aed;font-size:16px;font-weight:700;padding-bottom:12px;border-bottom:2px solid #e5e7eb;margin-bottom:12px;">
                  📄 리포트/공시
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${reportNews.map(newsItem).join('')}
                </table>
              </div>` : ''}

            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                CB 본부 내부용 · 자동 생성된 뉴스레터<br>
                수신 거부는 관리자에게 문의하세요.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
