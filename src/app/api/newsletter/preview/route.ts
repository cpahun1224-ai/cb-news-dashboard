// ============================================================
// API Route: GET /api/newsletter/preview
// 뉴스레터 HTML 미리보기를 반환합니다.
// ============================================================
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { generateNewsletterHTML } from '@/lib/email';
import type { News } from '@/types';

export async function GET() {
  try {
    const supabase = createServerClient();

    // 오늘의 뉴스 가져오기
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: newsData } = await supabase
      .from('news')
      .select('*')
      .gte('created_at', todayStart.toISOString())
      .order('relevance_score', { ascending: false })
      .limit(30);

    const news = (newsData || []) as News[];

    if (news.length === 0) {
      return new NextResponse(
        '<html><body><p>오늘 수집된 뉴스가 없습니다.</p></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const html = generateNewsletterHTML(
      news,
      `오늘 ${news.length}건의 기업신용·AI금융 관련 뉴스가 수집되었습니다.`
    );

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
