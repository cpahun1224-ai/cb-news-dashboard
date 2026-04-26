'use client';
// ============================================================
// 메인 대시보드 페이지
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Star, Loader2, Send, AlertCircle, TrendingUp, Info } from 'lucide-react';
import NewsCard from '@/components/NewsCard';
import NewsFilterBar from '@/components/NewsFilter';
import DashboardStats from '@/components/DashboardStats';
import type { News, NewsFilter } from '@/types';

export default function DashboardPage() {
  const [news, setNews] = useState<News[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<NewsFilter>({
    category: 'all',
    period: 'today',
    search: '',
  });
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        category: filter.category || 'all',
        period: filter.period || 'today',
        search: filter.search || '',
        limit: '50',
      });
      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error('뉴스 조회 실패');
      const data = await res.json();
      setNews(data.news || []);
      setTotal(data.total || 0);
      setIsDemo(data.demo === true);
    } catch (e) {
      setError('뉴스를 불러오는 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await fetch('/api/news', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_featured: !current }),
    });
    fetchNews();
  };

  const handleSendNewsletter = async () => {
    if (isDemo) {
      setSendMsg('⚠️ 데모 모드: Supabase 연결 후 실제 발송 가능합니다');
      setTimeout(() => setSendMsg(''), 3000);
      return;
    }
    setSending(true);
    setSendMsg('발송 중...');
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setSendMsg(data.success ? `✅ 발송 완료 (${data.news_count}건)` : `❌ ${data.error}`);
    } catch {
      setSendMsg('❌ 발송 실패');
    } finally {
      setSending(false);
      setTimeout(() => setSendMsg(''), 5000);
    }
  };

  // 통계
  const domesticCount = news.filter((n) => n.category === 'domestic').length;
  const globalCount = news.filter((n) => n.category === 'global').length;
  const reportCount = news.filter((n) => n.category === 'report').length;
  const avgScore =
    news.length > 0
      ? news.reduce((s, n) => s + n.relevance_score, 0) / news.length
      : 0;

  // 주요 뉴스
  const featuredNews = news
    .filter((n) => n.is_featured || n.relevance_score >= 0.88)
    .slice(0, 5);

  const today = format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko });

  return (
    <div className="space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">데모 모드로 실행 중입니다</p>
            <p className="text-amber-700 mt-0.5">
              현재 샘플 뉴스 데이터를 표시하고 있습니다.{' '}
              <span className="font-medium">실제 서비스</span>를 위해서는{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-900"
              >
                Supabase
              </a>
              를 연결하고 <code className="bg-amber-100 px-1 rounded">.env.local</code>에 API 키를 설정하세요.
              설정 후 &quot;즉시 수집&quot; 버튼을 누르면 실제 뉴스가 수집됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CB Daily Brief</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {today} · 기업신용평가 · 기업여신 · AI금융 트렌드
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendNewsletter}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sendMsg || '뉴스레터 발송'}
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <DashboardStats
        todayCount={total}
        domesticCount={domesticCount}
        globalCount={globalCount}
        reportCount={reportCount}
        avgScore={avgScore}
      />

      {/* 오류 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* 주요 뉴스 TOP 5 */}
      {!loading && featuredNews.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-gold-400 fill-gold-400" />
            <h2 className="text-lg font-bold text-gray-800">
              주요 뉴스 TOP {featuredNews.length}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredNews.map((item) => (
              <NewsCard
                key={item.id}
                news={item}
                compact
                onToggleFeatured={handleToggleFeatured}
              />
            ))}
          </div>
        </section>
      )}

      {/* 필터 바 */}
      <NewsFilterBar filter={filter} onChange={setFilter} />

      {/* 뉴스 목록 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-navy-500" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">뉴스가 없습니다</h3>
          <p className="text-gray-400 text-sm">
            상단의 &quot;즉시 수집&quot; 버튼을 클릭하여 뉴스를 수집하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(filter.category === 'all' || filter.category === 'domestic') && (
            <NewsSection
              title="🇰🇷 국내 뉴스"
              titleColor="text-blue-800"
              news={news.filter((n) => n.category === 'domestic')}
              onToggleFeatured={handleToggleFeatured}
            />
          )}
          {(filter.category === 'all' || filter.category === 'global') && (
            <NewsSection
              title="🌐 글로벌 뉴스"
              titleColor="text-emerald-800"
              news={news.filter((n) => n.category === 'global')}
              onToggleFeatured={handleToggleFeatured}
            />
          )}
          {(filter.category === 'all' || filter.category === 'report') && (
            <NewsSection
              title="📄 리포트 / 공식자료"
              titleColor="text-purple-800"
              news={news.filter((n) => n.category === 'report')}
              onToggleFeatured={handleToggleFeatured}
            />
          )}
        </div>
      )}
    </div>
  );
}

function NewsSection({
  title,
  titleColor,
  news,
  onToggleFeatured,
}: {
  title: string;
  titleColor: string;
  news: News[];
  onToggleFeatured: (id: string, current: boolean) => void;
}) {
  if (news.length === 0) return null;
  return (
    <section>
      <h2 className={`text-base font-bold mb-3 ${titleColor}`}>
        {title}{' '}
        <span className="text-gray-400 font-normal text-sm">({news.length}건)</span>
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {news.map((item) => (
          <NewsCard
            key={item.id}
            news={item}
            onToggleFeatured={onToggleFeatured}
          />
        ))}
      </div>
    </section>
  );
}
