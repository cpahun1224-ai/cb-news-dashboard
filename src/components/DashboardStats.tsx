'use client';
// ============================================================
// 대시보드 통계 카드 컴포넌트
// ============================================================
import { TrendingUp, Newspaper, Globe, FileBarChart } from 'lucide-react';

interface StatsProps {
  todayCount: number;
  domesticCount: number;
  globalCount: number;
  reportCount: number;
  avgScore: number;
}

export default function DashboardStats({
  todayCount,
  domesticCount,
  globalCount,
  reportCount,
  avgScore,
}: StatsProps) {
  const stats = [
    {
      label: '오늘 수집',
      value: todayCount,
      unit: '건',
      icon: Newspaper,
      color: 'bg-navy-800 text-white',
      iconColor: 'text-gold-400',
    },
    {
      label: '국내 뉴스',
      value: domesticCount,
      unit: '건',
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-900',
      iconColor: 'text-blue-500',
    },
    {
      label: '글로벌 뉴스',
      value: globalCount,
      unit: '건',
      icon: Globe,
      color: 'bg-emerald-50 text-emerald-900',
      iconColor: 'text-emerald-500',
    },
    {
      label: '리포트',
      value: reportCount,
      unit: '건',
      icon: FileBarChart,
      color: 'bg-purple-50 text-purple-900',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, unit, icon: Icon, color, iconColor }) => (
        <div key={label} className={`rounded-xl p-4 ${color}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium opacity-80">{label}</span>
            <Icon size={18} className={iconColor} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-sm opacity-70">{unit}</span>
          </div>
          {label === '오늘 수집' && avgScore > 0 && (
            <p className="mt-1 text-xs opacity-60">
              평균 관련성 {(avgScore * 100).toFixed(0)}점
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
