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

// Gemini 무료 플랜: 15 RPM → 한 번에 최대 10건만 AI 분석
const AI_ANALYSIS_LIMIT = 10;

function serializeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) return JSON.stringify(error);
  return String(error);
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ?test=true: RSS 없이 Supabase insert만 테스트
    if (searchParams.get('test') === 'true') {
      return handleTestInsert();
    }

    // ?ai_test=true: Gemini API만 단독 테스트
    if (searchParams.get('ai_test') === 'true') {
      return handleAiTest();
    }

    // Cron 보안키 검증 (자동 수집 시)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const hasGeminiKey = !!geminiKey;
    console.log(`[collect] GEMINI_API_KEY: ${hasGeminiKey ? geminiKey.slice(0, 10) + '...' : '❌ 미설정'} | ai_enabled=${aiEnabled}`);

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
    console.log(`점수 분포 zero=${scoreDistribution.zero} low=${scoreDistribution.low} medium=${scoreDistribution.medium} high=${scoreDistribution.high} minScore=${minScore}`);

    const filteredItems = items
      .filter((item) => item.relevance_score >= minScore)
      .slice(0, maxNews);

    // 6. AI 분석 — 병렬 처리 (상위 AI_ANALYSIS_LIMIT건만, 나머지는 기본 요약)
    // Gemini 무료: 15 RPM / 2 RPS → 10건 병렬은 안전
    const aiItems = (aiEnabled && hasGeminiKey) ? filteredItems.slice(0, AI_ANALYSIS_LIMIT) : [];
    const basicItems = filteredItems.slice(aiItems.length);

    console.log(`AI 분석: ${aiItems.length}건(Gemini병렬) + ${basicItems.length}건(기본요약) | GEMINI_KEY=${hasGeminiKey ? '✅' : '❌없음'}`);

    // 병렬 Gemini 분석 실행
    const aiResults = await Promise.allSettled(
      aiItems.map((item) => analyzeNewsWithAI(item.title, item.raw_content))
    );

    // URL → 분석결과 매핑
    type Analysis = { summary: string; insight: string; action_idea: string };
    const analysisMap = new Map<string, Analysis>();

    aiResults.forEach((result, i) => {
      const item = aiItems[i];
      if (result.status === 'fulfilled') {
        analysisMap.set(item.url, result.value);
      } else {
        console.error(`[ai] ${item.title.slice(0, 40)} 분석 실패:`, result.reason);
        analysisMap.set(item.url, {
          summary: generateBasicSummary(item.raw_content),
          insight: '',
          action_idea: '',
        });
      }
    });

    basicItems.forEach((item) => {
      analysisMap.set(item.url, {
        summary: generateBasicSummary(item.raw_content),
        insight: '',
        action_idea: '',
      });
    });

    // 7. DB에 저장 (이미 존재하는 URL은 스킵)
    let savedCount = 0;
    let skippedCount = 0;
    let aiAnalyzedCount = 0;
    const saveErrors: string[] = [];

    for (const item of filteredItems) {
      const analysis = analysisMap.get(item.url) ?? {
        summary: generateBasicSummary(item.raw_content),
        insight: '',
        action_idea: '',
      };
      if (analysis.insight) aiAnalyzedCount++;

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
          is_featured: item.relevance_score >= 0.8,
        });

      if (insertError) {
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

    // 8. 소스 마지막 수집 시각 업데이트
    await supabase
      .from('rss_sources')
      .update({ last_collected_at: new Date().toISOString() })
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      collected: savedCount,
      skipped: skippedCount,
      filtered_out: items.length - filteredItems.length,
      ai_analyzed: aiAnalyzedCount,
      errors: [...errors, ...saveErrors],
      sources_processed: processedSources,
      debug: {
        total_fetched: items.length,
        min_score_used: minScore,
        score_distribution: scoreDistribution,
        gemini_key_present: hasGeminiKey,
        ai_enabled_setting: aiEnabled,
      },
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
 * Gemini API 단독 테스트 — POST /api/collect?ai_test=true
 * RSS 수집 및 DB 저장 없이 Gemini 응답만 반환합니다.
 */
async function handleAiTest(): Promise<NextResponse> {
  const steps: string[] = [];
  const keyPresent = !!process.env.GEMINI_API_KEY;
  steps.push(`GEMINI_API_KEY: ${keyPresent ? '✅ 있음' : '❌ 없음 (환경변수 미설정)'}`);

  if (!keyPresent) {
    return NextResponse.json({ success: false, steps, error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  try {
    steps.push('Gemini 분석 요청 시작...');
    const sampleTitle = '금융위원회, AI 기반 기업신용평가 시스템 도입 가이드라인 발표';
    const sampleContent = '금융위원회가 AI와 비정형 데이터를 활용한 대안신용평가 모델 도입을 위한 가이드라인을 발표했다. 기업여신 심사에서 ERP 데이터와 현금흐름 기반 신용평가를 허용하는 내용을 담고 있으며, 조기경보시스템(EWS) 고도화도 포함된다.';

    const result = await analyzeNewsWithAI(sampleTitle, sampleContent);
    steps.push('Gemini 분석 완료');

    return NextResponse.json({
      success: true,
      steps,
      sample_title: sampleTitle,
      analysis: result,
    });
  } catch (err) {
    const detail = serializeError(err);
    steps.push(`오류 발생: ${detail}`);
    return NextResponse.json({ success: false, steps, error: detail }, { status: 500 });
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

  return POST(new NextRequest(request.url, { method: 'POST', headers: request.headers }));
}
