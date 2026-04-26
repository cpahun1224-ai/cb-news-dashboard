// ============================================================
// API Route: POST /api/newsletter/send
// 뉴스레터를 생성하고 이메일로 발송합니다.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { sendEmail, generateNewsletterHTML } from '@/lib/email';
import { generateDailySummary } from '@/lib/ai';
import { format } from 'date-fns';
import type { News } from '@/types';

export async function POST(request: NextRequest) {
  const logId = crypto.randomUUID();
  let recipient = '';
  let subject = '';

  try {
    const body = await request.json().catch(() => ({}));
    const testMode = body.test === true;
    const customRecipient = body.recipient;

    const supabase = createServerClient();

    // 1. 설정 가져오기
    const { data: settingsData } = await supabase
      .from('settings')
      .select('key, value');

    const settings = Object.fromEntries(
      (settingsData || []).map((s: { key: string; value: string }) => [s.key, s.value])
    );

    // 수신자 결정
    recipient = customRecipient ||
      settings.recipient_emails ||
      process.env.DEFAULT_RECIPIENT ||
      '';

    if (!recipient) {
      return NextResponse.json(
        { error: '수신 이메일이 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 2. 오늘의 뉴스 가져오기
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select('*')
      .gte('created_at', todayStart.toISOString())
      .order('relevance_score', { ascending: false })
      .limit(parseInt(settings.max_news_per_day || '30'));

    if (newsError) throw newsError;

    const news = (newsData || []) as News[];

    if (news.length === 0) {
      return NextResponse.json(
        { error: '오늘 수집된 뉴스가 없습니다. 먼저 뉴스를 수집해주세요.' },
        { status: 400 }
      );
    }

    // 3. AI 일일 요약 생성
    const dailySummary = await generateDailySummary(news.map((n) => n.title));

    // 4. 이메일 제목 생성
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const prefix = settings.newsletter_subject_prefix || '[CB Daily Brief]';
    subject = `${prefix} ${dateStr} 기업신용·AI금융 트렌드${testMode ? ' [테스트]' : ''}`;

    // 5. HTML 이메일 생성
    const html = generateNewsletterHTML(news, dailySummary);

    // 6. 발송 로그 생성
    await supabase.from('newsletter_logs').insert({
      id: logId,
      recipient,
      subject,
      news_count: news.length,
      status: 'pending',
    });

    // 7. 이메일 발송
    await sendEmail({ to: recipient, subject, html });

    // 8. 성공 로그 업데이트
    await supabase
      .from('newsletter_logs')
      .update({ status: 'success' })
      .eq('id', logId);

    return NextResponse.json({
      success: true,
      recipient,
      subject,
      news_count: news.length,
      test_mode: testMode,
    });

  } catch (error) {
    console.error('뉴스레터 발송 오류:', error);

    // 실패 로그 업데이트
    try {
      const supabase = createServerClient();
      await supabase
        .from('newsletter_logs')
        .update({
          status: 'failed',
          error_message: String(error),
        })
        .eq('id', logId);
    } catch { /* 로그 업데이트 실패는 무시 */ }

    return NextResponse.json(
      {
        error: '이메일 발송 실패',
        details: String(error),
        help: 'Gmail 앱 비밀번호가 올바른지 확인하세요.',
      },
      { status: 500 }
    );
  }
}
