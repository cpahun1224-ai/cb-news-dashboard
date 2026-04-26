// ============================================================
// API Route: POST /api/collect
// RSS 피드에서 뉴스를 수집하여 DB에 저장합니다.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { collectAllFeeds, generateBasicSummary } from '@/lib/rss';
import { analyzeNewsWithAI } from '@/lib/ai';
import type { RssSource } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Cron 보안키 검증 (자동 수집 시)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // 수동 호출 허용 (개발 환경)
      const body = await request.json().catch(() => ({}));
      if (!body.manual) {
        return NextResponse.json({ error: '인증 실패' }, { status: 401 });
      }
    }

    const supabase = createServerClient();

    // 1. 활성화된 RSS 소스 목록 가져오기
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true);

    if (sourcesError) throw sourcesError;
    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'RSS 소스가 없습니다.' }, { status: 400 });
    }

    // 2. 활성화된 키워드 가져오기
    const { data: keywords } = await supabase
      .from('keywords')
      .select('keyword, weight')
      .eq('is_active', true);

    // 3. 설정값 가져오기
    const { data: settingsData } = await supabase
      .from('settings')
      .select('key, value');

    const settings = Object.fromEntries(
      (settingsData || []).map((s: { key: string; value: string }) => [s.key, s.value])
    );
    const minScore = parseFloat(settings.min_relevance_score || '0.3');
    const maxNews = parseInt(settings.max_news_per_day || '30');
    const aiEnabled = settings.ai_enabled !== 'false';

    // 4. RSS 수집
    console.log(`RSS 수집 시작: ${sources.length}개 소스`);
    const { items, errors, processedSources } = await collectAllFeeds(
      sources as RssSource[],
      keywords || []
    );

    console.log(`수집된 뉴스: ${items.length}건, 오류: ${errors.length}건`);

    // 5. 관련성 점수 필터링
    const filteredItems = items
      .filter((item) => item.relevance_score >= minScore)
      .slice(0, maxNews);

    // 6. DB에 저장 (이미 존재하는 URL은 스킵)
    let savedCount = 0;
    let skippedCount = 0;
    const saveErrors: string[] = [];

    for (const item of filteredItems) {
      // AI 분석 (활성화된 경우)
      let analysis = { summary: '', insight: '', action_idea: '' };
      if (aiEnabled) {
        analysis = await analyzeNewsWithAI(item.title, item.raw_content);
      } else {
        analysis.summary = generateBasicSummary(item.raw_content);
      }

      // DB 저장 (중복 URL은 자동 스킵)
      const { error: insertError } = await supabase
        .from('news')
        .insert({
          title: item.title,
          source: item.source,
          url: item.url,
          published_at: item.published_at,
          category: item.category,
          relevance_score: item.relevance_score,
          raw_content: item.raw_content,
          summary: analysis.summary,
          insight: analysis.insight,
          action_idea: analysis.action_idea,
          // 관련성 점수 0.8 이상은 주요 뉴스로 자동 선정
          is_featured: item.relevance_score >= 0.8,
        });

      if (insertError) {
        // unique 제약 위반 = 이미 존재하는 URL
        if (insertError.code === '23505') {
          skippedCount++;
        } else {
          saveErrors.push(`${item.title}: ${insertError.message}`);
        }
      } else {
        savedCount++;
      }
    }

    // 7. 소스 마지막 수집 시각 업데이트
    await supabase
      .from('rss_sources')
      .update({ last_collected_at: new Date().toISOString() })
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      collected: savedCount,
      skipped: skippedCount,
      filtered_out: items.length - filteredItems.length,
      errors: [...errors, ...saveErrors],
      sources_processed: processedSources,
    });

  } catch (error) {
    console.error('뉴스 수집 오류:', error);
    return NextResponse.json(
      { error: '뉴스 수집 중 오류가 발생했습니다.', details: String(error) },
      { status: 500 }
    );
  }
}

// GET 요청도 허용 (Vercel Cron에서 사용)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  // POST와 동일한 로직 실행
  return POST(new NextRequest(request.url, { method: 'POST', headers: request.headers }));
}
