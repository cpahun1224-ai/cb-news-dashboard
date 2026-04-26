'use client';
// ============================================================
// 뉴스 상세 페이지 - 데모 모드 지원
// ============================================================
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Calendar, Building2, Globe, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MOCK_NEWS } from '@/lib/mock-data';
import type { News } from '@/types';

const CATEGORY_META = {
  domestic: { label: '국내', icon: Building2, color: 'text-blue-700 bg-blue-50' },
  global: { label: '글로벌', icon: Globe, color: 'text-emerald-700 bg-emerald-50' },
  report: { label: '리포트', icon: FileText, color: 'text-purple-700 bg-purple-50' },
};

export default function NewsDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      // 먼저 목업에서 찾기
      const mockItem = MOCK_NEWS.find((n) => n.id === String(id));
      if (mockItem) {
        setNews(mockItem);
        setLoading(false);
        return;
      }

      // Supabase에서 찾기
      try {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { data } = await supabase.from('news').select('*').eq('id', id).single();
          setNews(data);
        }
      } catch {
        // 무시
      }
      setLoading(false);
    };
    if (id) fetchNews();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 size={32} className="animate-spin text-navy-500" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">뉴스를 찾을 수 없습니다.</p>
        <Link href="/" className="mt-4 inline-block text-navy-600 hover:underline">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  const meta = CATEGORY_META[news.category] || CATEGORY_META.domestic;
  const Icon = meta.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={15} />
        뒤로가기
      </button>

      <article className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${meta.color}`}>
              <Icon size={12} />
              {meta.label}
            </span>
            <span className="text-sm text-gray-500 font-medium">{news.source}</span>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-mono">
              관련성 {(news.relevance_score * 100).toFixed(0)}점
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 leading-tight mb-3">
            {news.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {news.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {format(new Date(news.published_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </span>
            )}
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-navy-600 hover:underline"
            >
              <ExternalLink size={13} />
              원문 보기
            </a>
          </div>
        </div>

        {/* 요약 */}
        {news.summary && (
          <div className="p-6 border-b">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
              📋 요약
            </h2>
            <p className="text-gray-700 leading-relaxed text-[15px]">{news.summary}</p>
          </div>
        )}

        {/* CB 관점 */}
        {news.insight && (
          <div className="p-6 border-b bg-blue-50">
            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-3">
              💡 CB 본부장 관점 인사이트
            </h2>
            <p className="text-blue-900 leading-relaxed text-[15px]">{news.insight}</p>
          </div>
        )}

        {/* 액션 아이디어 */}
        {news.action_idea && (
          <div className="p-6 border-b bg-green-50">
            <h2 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3">
              ✅ 내부 액션 아이디어
            </h2>
            <p className="text-green-900 leading-relaxed text-[15px]">{news.action_idea}</p>
          </div>
        )}

        {!news.insight && !news.action_idea && (
          <div className="p-6 bg-yellow-50 border-b">
            <p className="text-sm text-yellow-700">
              💬 AI API Key를 설정하면 자동으로 인사이트와 액션 아이디어가 생성됩니다.
            </p>
          </div>
        )}

        <div className="p-6">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-700 transition-colors"
          >
            <ExternalLink size={14} />
            원문 전체 보기
          </a>
        </div>
      </article>

      <div className="text-xs text-gray-400 text-center">
        수집일시: {format(new Date(news.created_at), 'yyyy-MM-dd HH:mm:ss')}
      </div>
    </div>
  );
}
