'use client';
// ============================================================
// 뉴스 카드 컴포넌트
// ============================================================
import Link from 'next/link';
import { ExternalLink, Star, Building2, Globe, FileText } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { News } from '@/types';

interface NewsCardProps {
  news: News;
  compact?: boolean; // 컴팩트 모드 (TOP 뉴스 등)
  onToggleFeatured?: (id: string, current: boolean) => void;
}

/** 카테고리 스타일 */
const CATEGORY_STYLES = {
  domestic: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Building2,
    label: '국내',
  },
  global: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: Globe,
    label: '글로벌',
  },
  report: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: FileText,
    label: '리포트',
  },
};

/** 관련성 점수 색상 */
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 0.7 ? 'bg-red-100 text-red-700' :
    score >= 0.5 ? 'bg-orange-100 text-orange-700' :
    'bg-gray-100 text-gray-500';
  return (
    <span className={clsx('text-xs px-1.5 py-0.5 rounded font-mono font-bold', color)}>
      {(score * 100).toFixed(0)}점
    </span>
  );
}

export default function NewsCard({ news, compact = false, onToggleFeatured }: NewsCardProps) {
  const style = CATEGORY_STYLES[news.category] || CATEGORY_STYLES.domestic;
  const Icon = style.icon;

  const publishedDate = news.published_at
    ? format(new Date(news.published_at), 'MM.dd HH:mm', { locale: ko })
    : '';

  if (compact) {
    // 간략 카드 (TOP 뉴스, 사이드바용)
    return (
      <div className={clsx(
        'p-3 rounded-lg border transition-shadow hover:shadow-md',
        style.bg, style.border
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={11} className={style.text} />
              <span className={clsx('text-xs font-medium', style.text)}>{style.label}</span>
              <span className="text-xs text-gray-400">· {news.source}</span>
            </div>
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-800 hover:text-navy-700 line-clamp-2 block"
            >
              {news.title}
            </a>
          </div>
          <ScoreBadge score={news.relevance_score} />
        </div>
        {news.summary && (
          <p className="mt-1.5 text-xs text-gray-600 line-clamp-2">{news.summary}</p>
        )}
        {publishedDate && (
          <p className="mt-1 text-xs text-gray-400">{publishedDate}</p>
        )}
      </div>
    );
  }

  // 풀 카드
  return (
    <article className={clsx(
      'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200',
      news.is_featured && 'ring-2 ring-gold-400'
    )}>
      {/* 카드 헤더 */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 카테고리 배지 */}
            <span className={clsx(
              'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
              style.bg, style.text
            )}>
              <Icon size={10} />
              {style.label}
            </span>

            {/* 출처 */}
            <span className="text-xs text-gray-500 font-medium">{news.source}</span>

            {/* 주요 뉴스 배지 */}
            {news.is_featured && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-500">
                <Star size={9} fill="currentColor" />
                주요
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ScoreBadge score={news.relevance_score} />
            {onToggleFeatured && (
              <button
                onClick={() => onToggleFeatured(news.id, news.is_featured)}
                className={clsx(
                  'p-1 rounded hover:bg-gray-100',
                  news.is_featured ? 'text-gold-400' : 'text-gray-300'
                )}
                title={news.is_featured ? '주요 뉴스 해제' : '주요 뉴스로 설정'}
              >
                <Star size={14} fill={news.is_featured ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h3 className="font-bold text-gray-900 leading-snug mb-1">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-navy-700 hover:underline inline-flex items-start gap-1"
          >
            {news.title}
            <ExternalLink size={12} className="mt-1 shrink-0 text-gray-400" />
          </a>
        </h3>

        {/* 발행일 */}
        {publishedDate && (
          <p className="text-xs text-gray-400">{publishedDate}</p>
        )}
      </div>

      {/* 요약 */}
      {news.summary && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{news.summary}</p>
        </div>
      )}

      {/* CB 인사이트 */}
      {news.insight && (
        <div className="mx-4 mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-xs font-semibold text-blue-700 mb-1">💡 CB 관점</p>
          <p className="text-sm text-blue-800 leading-relaxed">{news.insight}</p>
        </div>
      )}

      {/* 액션 아이디어 */}
      {news.action_idea && (
        <div className="mx-4 mb-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-xs font-semibold text-green-700 mb-1">✅ 액션 아이디어</p>
          <p className="text-sm text-green-800 leading-relaxed">{news.action_idea}</p>
        </div>
      )}

      {/* 원문 링크 */}
      <div className="px-4 pb-4">
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy-700 transition-colors"
        >
          <ExternalLink size={11} />
          원문 보기
        </a>
      </div>
    </article>
  );
}
