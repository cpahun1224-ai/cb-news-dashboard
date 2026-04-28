// ============================================================
// API Route: POST /api/collect
// RSS 피드에서 뉴스를 수집하여 DB에 저장합니다.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { collectAllFeeds, generateBasicSummary } from '@/lib/rss';
import { analyzeNewsWithAI } from '@/lib/ai';
import type { RssSource } from '@/types';

// Vercel 서버리스 최대 실행 시간 (초) — Hobby 60, Pro 300
export const maxDuration = 60;

/** 어떤 타입의 에러든 읽을 수 있는 문자열로 변환 */
function serializeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    // PostgrestError 등 Supabase 에러 객체 처리
    return JSON.stringify(error);
  }
  return String(error);
}

export async function POST(request: NextRequest) {
  try {
    // ?test=true 로 호출하면 RSS 수집 없이 Supabase insert만 테스트
    const { searchParams } = new URL(request.url);
    if (searchParams.get('test') === 'true') {
      return handleTestInsert();
    }

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

    if (sourcesError) {
      console.error('[api/collect] rss_sources 조회 오류:', JSON.stringify(sourcesError));
      throw new Error(`rss_sources 조회 실패: ${JSON.stringify(sourcesError)}`);
    }
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
    const minScore = parseFloat(settings.min_relevance_score || '0.1');
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
    const scoreDistribution = {
      zero: items.filter((i) => i.relevance_score === 0).length,
      low: items.filter((i) => i.relevance_score > 0 && i.relevance_score < 0.1).length,
      medium: items.filter((i) => i.relevance_score >= 0.1 && i.relevance_score < 0.3).length,
      high: items.filter((i) => i.relevance_score >= 0.3).length,
    };
    console.log(`점수 분포: 0점=${scoreDistribution.zero}, 0~0.1=${scoreDistribution.low}, 0.1~0.3=${scoreDistribution.medium}, 0.3+=${scoreDistribution.high}, minScore=${minScore}`);

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
          const errDetail = `${item.title}: [${insertError.code}] ${insertError.message} | ${insertError.details || ''}`;
          console.error('[api/collect] insert 오류:', errDetail);
          saveErrors.push(errDetail);
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
      debug: { total_fetched: items.length, min_score_used: minScore, score_distribution: scoreDistribution },
    });

  } catch (error) {
    const detail = serializeError(error);
    console.error('[api/collect] 수집 오류:', detail);
    return NextResponse.json(
      { error: '뉴스 수집 중 오류가 발생했습니다.', details: detail },
      { status: 500 }
    );
  }
}

/**
 * Supabase insert 단독 테스트 (RSS 없이)
 * POST /api/collect?test=true 로 호출
 */
async function handleTestInsert(): Promise<NextResponse> {
  const steps: string[] = [];
  try {
    steps.push('1. createServerClient() 호출');
    const supabase = createServerClient();
    steps.push('2. Supabase 클라이언트 생성 성공');

    const testItem = {
      title: '[TEST] Supabase insert 테스트',
      source: 'test',
      url: `https://test.example.com/test-${Date.now()}`,
      published_at: new Date().toISOString(),
      category: 'domestic',
      relevance_score: 0.5,
      raw_content: 'Supabase insert 연결 테스트용 데이터입니다.',
      summary: 'insert 테스트',
      insight: '',
      action_idea: '',
      is_featured: false,
    };

    steps.push('3. news 테이블에 insert 시도');
    const { data, error } = await supabase.from('news').insert(testItem).select().single();

    if (error) {
      steps.push(`4. insert 실패: ${JSON.stringify(error)}`);
      return NextResponse.json({ success: false, steps, error: JSON.stringify(error) }, { status: 500 });
    }

    steps.push(`4. insert 성공! id=${data?.id}`);

    // 테스트 데이터 바로 삭제
    if (data?.id) {
      await supabase.from('news').delete().eq('id', data.id);
      steps.push('5. 테스트 데이터 삭제 완료');
    }

    return NextResponse.json({ success: true, steps, message: 'Supabase insert/delete 정상 동작' });
  } catch (err) {
    const detail = serializeError(err);
    steps.push(`예외 발생: ${detail}`);
    return NextResponse.json({ success: false, steps, error: detail }, { status: 500 });
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
