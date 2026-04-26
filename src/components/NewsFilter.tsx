'use client';
// ============================================================
// 뉴스 필터 컴포넌트 (카테고리 + 기간 + 검색)
// ============================================================
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { CATEGORY_LABELS, PERIOD_LABELS } from '@/types';
import type { NewsFilter } from '@/types';

interface NewsFilterProps {
  filter: NewsFilter;
  onChange: (filter: NewsFilter) => void;
}

export default function NewsFilterBar({ filter, onChange }: NewsFilterProps) {
  const categories: Array<keyof typeof CATEGORY_LABELS> = ['all', 'domestic', 'global', 'report'];
  const periods: Array<keyof typeof PERIOD_LABELS> = ['today', 'week', 'month'];

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      {/* 기간 탭 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => onChange({ ...filter, period })}
            className={clsx(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              filter.period === period
                ? 'bg-white text-navy-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {PERIOD_LABELS[period]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* 카테고리 필터 */}
        <div className="flex gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange({ ...filter, category: cat })}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                filter.category === cat
                  ? cat === 'all' ? 'bg-navy-800 text-white'
                    : cat === 'domestic' ? 'bg-blue-600 text-white'
                    : cat === 'global' ? 'bg-emerald-600 text-white'
                    : 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="제목, 출처, 내용 검색..."
            value={filter.search || ''}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
