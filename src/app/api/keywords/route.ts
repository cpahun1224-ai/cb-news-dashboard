// ============================================================
// API Route: GET/POST/DELETE /api/keywords
// 키워드 관리
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('weight', { ascending: false })
      .order('keyword');
    if (error) throw error;
    return NextResponse.json({ keywords: data || [] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (body.id && body.is_active !== undefined) {
      const { error } = await supabase
        .from('keywords')
        .update({ is_active: body.is_active })
        .eq('id', body.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('keywords')
      .insert({ keyword: body.keyword, weight: body.weight || 1.0 });
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
    const { error } = await supabase.from('keywords').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
