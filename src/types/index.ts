// ============================================================
// CB 뉴스 대시보드 - TypeScript 타입 정의
// ============================================================

/** 뉴스 아이템 */
export interface News {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  category: 'domestic' | 'global' | 'report';
  relevance_score: number;
  insight: string | null;
  action_idea: string | null;
  raw_content: string | null;
  is_featured: boolean;
  created_at: string;
}

/** RSS 피드 소스 */
export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: 'domestic' | 'global' | 'report';
  is_active: boolean;
  last_collected_at: string | null;
  created_at: string;
}

/** 검색 키워드 */
export interface Keyword {
  id: string;
  keyword: string;
  weight: number;
  is_active: boolean;
  created_at: string;
}

/** 뉴스레터 발송 로그 */
export interface NewsletterLog {
  id: string;
  sent_at: string;
  recipient: string;
  subject: string;
  news_count: number;
  status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

/** 앱 설정 */
export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

/** RSS 수집 결과 */
export interface CollectResult {
  success: boolean;
  collected: number;
  skipped: number;
  errors: string[];
  sources_processed: number;
}

/** 대시보드 통계 */
export interface DashboardStats {
  today_count: number;
  week_count: number;
  month_count: number;
  top_news: News[];
  domestic_news: News[];
  global_news: News[];
  report_news: News[];
}

/** AI 분석 결과 */
export interface AIAnalysis {
  summary: string;
  insight: string;
  action_idea: string;
}

/** 뉴스 필터 옵션 */
export type NewsFilter = {
  category?: 'all' | 'domestic' | 'global' | 'report';
  period?: 'today' | 'week' | 'month';
  search?: string;
  minScore?: number;
};

/** 카테고리 라벨 */
export const CATEGORY_LABELS = {
  domestic: '국내',
  global: '글로벌',
  report: '리포트/공시',
  all: '전체',
} as const;

/** 기간 라벨 */
export const PERIOD_LABELS = {
  today: '오늘',
  week: '이번주',
  month: '이번달',
} as const;
