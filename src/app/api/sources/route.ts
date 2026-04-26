// ============================================================
// API Route: GET/POST/DELETE /api/sources
// RSS 소스 관리
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('rss_sources')
      .select('*')
      .order('category')
      .order('name');
    if (error) throw error;
    return NextResponse.json({ sources: data || [] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    // 토글 (활성/비활성) 처리
    if (body.id && body.is_active !== undefined) {
      const { error } = await supabase
        .from('rss_sources')
        .update({ is_active: body.is_active })
        .eq('id', body.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // 새 소스 추가
    const { error } = await supabase
      .from('rss_sources')
      .insert({ name: body.name, url: body.url, category: body.category });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const supabase = createServerClient();
    const { error } = await supabase.from('rss_sources').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
