// ============================================================
// API Route: GET /api/cron
// Vercel Cron Job 엔드포인트 - 매일 자동 수집 및 발송
// vercel.json에서 cron 설정으로 자동 호출됩니다.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Vercel Cron은 Authorization 헤더를 자동으로 추가합니다
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const headers = { 'Authorization': `Bearer ${process.env.CRON_SECRET}` };

  try {
    // 1단계: 뉴스 수집
    console.log('[Cron] 뉴스 수집 시작...');
    const collectRes = await fetch(`${baseUrl}/api/collect`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual: false }),
    });
    const collectResult = await collectRes.json();
    console.log('[Cron] 수집 결과:', collectResult);

    // 2단계: 뉴스레터 발송 (수집 성공 시)
    console.log('[Cron] 뉴스레터 발송 시작...');
    const sendRes = await fetch(`${baseUrl}/api/newsletter/send`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const sendResult = await sendRes.json();
    console.log('[Cron] 발송 결과:', sendResult);

    return NextResponse.json({
      success: true,
      collect: collectResult,
      newsletter: sendResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Cron] 오류:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
