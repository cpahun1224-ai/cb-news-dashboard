// ============================================================
// API Route: GET /api/news
// 뉴스 목록 조회 - Supabase 미연결 시 목업 데이터 반환
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_NEWS } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const period = searchParams.get('period') || 'today';
    const search = (searchParams.get('search') || '').toLowerCase();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // ── Supabase 연결 시도 ────────────────────────────────
    try {
      const { createServerClient } = await import('@/lib/supabase-server');
      const supabase = createServerClient(); // DEMO_MODE 예외 발생 가능

      let query = supabase
        .from('news')
        .select('*', { count: 'exact' })
        .order('relevance_score', { ascending: false })
        .order('published_at', { ascending: false });

      if (category !== 'all') query = query.eq('category', category);

      const now = new Date();
      if (period === 'today') {
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        query = query.gte('created_at', start.toISOString());
      } else if (period === 'week') {
        const start = new Date(now); start.setDate(start.getDate() - 7);
        query = query.gte('created_at', start.toISOString());
      } else if (period === 'month') {
        const start = new Date(now); start.setMonth(start.getMonth() - 1);
        query = query.gte('created_at', start.toISOString());
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,summary.ilike.%${search}%,source.ilike.%${search}%`
        );
      }

      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return NextResponse.json({
        news: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        demo: false,
      });

    } catch (dbError) {
      const isDemoMode =
        dbError instanceof Error && dbError.message === 'DEMO_MODE';

      // 실제 DB 에러(연결은 됐지만 쿼리 실패)는 데모 모드로 숨기지 않고 에러로 반환
      if (!isDemoMode) {
        console.error('[api/news] DB 오류:', dbError);
        return NextResponse.json(
          {
            error: 'DB 조회 실패',
            details: dbError instanceof Error ? dbError.message : String(dbError),
            news: [],
            total: 0,
            demo: false,
          },
          { status: 500 }
        );
      }

      // DEMO_MODE: 환경변수 미설정 시 목업 데이터 반환
      let filtered = MOCK_NEWS;

      if (category !== 'all') {
        filtered = filtered.filter((n) => n.category === category);
      }
      if (search) {
        filtered = filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(search) ||
            (n.summary || '').toLowerCase().includes(search) ||
            n.source.toLowerCase().includes(search)
        );
      }

      return NextResponse.json({
        news: filtered,
        total: filtered.length,
        page: 1,
        limit: filtered.length,
        totalPages: 1,
        demo: true,
      });
    }

  } catch (error) {
    console.error('뉴스 조회 오류:', error);
    return NextResponse.json(
      { error: '뉴스 조회 실패', news: MOCK_NEWS, demo: true, total: MOCK_NEWS.length },
      { status: 200 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, is_featured, insight, action_idea } = await request.json();
    const { createServerClient } = await import('@/lib/supabase-server');
    const supabase = createServerClient();

    const updates: Record<string, unknown> = {};
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (insight !== undefined) updates.insight = insight;
    if (action_idea !== undefined) updates.action_idea = action_idea;

    const { error } = await supabase.from('news').update(updates).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true, demo: true });
  }
}
