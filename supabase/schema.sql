-- ============================================================
-- CB 뉴스 대시보드 - Supabase 데이터베이스 스키마
-- Supabase 대시보드 → SQL Editor에서 이 쿼리를 실행하세요
-- ============================================================

-- 1. 뉴스 테이블
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,                    -- 뉴스 제목
  source TEXT NOT NULL,                   -- 출처 (예: 금융위원회, Reuters)
  url TEXT NOT NULL UNIQUE,               -- 원문 링크 (중복 방지)
  published_at TIMESTAMPTZ,               -- 발행일시
  summary TEXT,                           -- AI 요약 또는 원문 첫 문단
  category TEXT DEFAULT 'domestic',       -- domestic(국내)/global(글로벌)/report(리포트)
  relevance_score DECIMAL(3,2) DEFAULT 0, -- 관련성 점수 0.00~1.00
  insight TEXT,                           -- CB 관점 해석
  action_idea TEXT,                       -- 내부 액션 아이디어
  raw_content TEXT,                       -- 원문 내용 (AI 처리용)
  is_featured BOOLEAN DEFAULT false,      -- 주요 뉴스 TOP5 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 뉴스 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_relevance ON news(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- 2. RSS 소스 테이블
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,           -- 소스 이름 (예: 금융위원회)
  url TEXT NOT NULL UNIQUE,     -- RSS 피드 URL
  category TEXT NOT NULL,       -- domestic/global/report
  is_active BOOLEAN DEFAULT true, -- 활성화 여부
  last_collected_at TIMESTAMPTZ,  -- 마지막 수집 시각
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 키워드 테이블
CREATE TABLE IF NOT EXISTS keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE, -- 키워드
  weight DECIMAL(3,2) DEFAULT 1.0, -- 가중치 (1.0 = 기본, 2.0 = 중요)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 뉴스레터 발송 로그
CREATE TABLE IF NOT EXISTS newsletter_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  news_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending/success/failed
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 설정 테이블
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 기본 데이터 삽입
-- ============================================================

-- 기본 RSS 소스
-- 아래 URL은 실제 HTTP 요청으로 200 + XML 응답 확인된 것만 포함
-- (연합뉴스/Reuters/이데일리 등은 연결 거부 또는 봇 차단으로 제외)

-- 국내 언론사 직접 RSS
INSERT INTO rss_sources (name, url, category) VALUES
  ('한국경제 금융',   'https://www.hankyung.com/feed/finance', 'domestic'),
  ('한국경제 경제',   'https://www.hankyung.com/feed/economy', 'domestic'),
  ('매일경제 금융',   'https://www.mk.co.kr/rss/30100041/', 'domestic'),
  ('매일경제 경제',   'https://www.mk.co.kr/rss/40300001/', 'domestic')
ON CONFLICT (url) DO NOTHING;

-- 구글뉴스 한국어 (URL 인코딩 검증 완료)
INSERT INTO rss_sources (name, url, category) VALUES
  ('구글뉴스-기업신용평가', 'https://news.google.com/rss/search?q=%EA%B8%B0%EC%97%85%EC%8B%A0%EC%9A%A9%ED%8F%89%EA%B0%80&hl=ko&gl=KR&ceid=KR:ko', 'domestic'),
  ('구글뉴스-기업여신',     'https://news.google.com/rss/search?q=%EA%B8%B0%EC%97%85%EC%97%AC%EC%8B%A0+%EC%8B%A0%EC%9A%A9%ED%8F%89%EA%B0%80&hl=ko&gl=KR&ceid=KR:ko', 'domestic'),
  ('구글뉴스-중소기업금융', 'https://news.google.com/rss/search?q=%EC%A4%91%EC%86%8C%EA%B8%B0%EC%97%85+%EA%B8%88%EC%9C%B5&hl=ko&gl=KR&ceid=KR:ko', 'domestic'),
  ('구글뉴스-AI여신심사',   'https://news.google.com/rss/search?q=AI+%EC%97%AC%EC%8B%A0%EC%8B%AC%EC%82%AC&hl=ko&gl=KR&ceid=KR:ko', 'domestic')
ON CONFLICT (url) DO NOTHING;

-- 구글뉴스 영문 (글로벌)
INSERT INTO rss_sources (name, url, category) VALUES
  ('구글뉴스-SME Credit',  'https://news.google.com/rss/search?q=SME+credit+scoring&hl=en&gl=US&ceid=US:en', 'global'),
  ('구글뉴스-AI Credit',   'https://news.google.com/rss/search?q=AI+credit+risk&hl=en&gl=US&ceid=US:en', 'global')
ON CONFLICT (url) DO NOTHING;

-- 기본 키워드
INSERT INTO keywords (keyword, weight) VALUES
  ('기업신용평가', 2.0),
  ('기업여신', 2.0),
  ('중소기업 금융', 1.8),
  ('대안신용평가', 2.0),
  ('신용평가모형', 1.8),
  ('조기경보시스템', 1.8),
  ('EWS', 1.5),
  ('금융 AI', 1.8),
  ('AI 대출심사', 1.8),
  ('SME credit', 1.8),
  ('alternative credit scoring', 2.0),
  ('business credit', 1.5),
  ('embedded finance', 1.5),
  ('cash flow based lending', 1.8),
  ('ERP data credit', 1.8),
  ('credit risk', 1.3),
  ('fintech', 1.2),
  ('AI underwriting', 1.8),
  ('machine learning credit', 1.5),
  ('신용리스크', 1.5),
  ('여신심사', 1.8),
  ('금융데이터', 1.3),
  ('오픈뱅킹', 1.2),
  ('마이데이터', 1.5),
  ('부실채권', 1.5),
  ('NPL', 1.3),
  ('부도예측', 1.8),
  ('신용등급', 1.3)
ON CONFLICT (keyword) DO NOTHING;

-- 기본 설정값
INSERT INTO settings (key, value, description) VALUES
  ('recipient_emails', 'ceo@company.com', '뉴스레터 수신 이메일 목록 (쉼표 구분)'),
  ('send_time', '07:00', '뉴스레터 발송 시각 (HH:MM)'),
  ('max_news_per_day', '30', '하루 최대 수집 뉴스 수'),
  ('min_relevance_score', '0.3', '최소 관련성 점수 (0~1)'),
  ('top_news_count', '5', 'TOP 뉴스 개수'),
  ('ai_enabled', 'true', 'AI 요약 활성화 여부'),
  ('newsletter_enabled', 'true', '뉴스레터 발송 활성화 여부'),
  ('newsletter_subject_prefix', '[CB Daily Brief]', '뉴스레터 제목 접두사')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- RLS (Row Level Security) 설정 - 필요시 활성화
-- ============================================================
-- 개발 환경에서는 비활성화, 프로덕션에서는 활성화 권장
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 서비스 롤은 모든 권한 허용
CREATE POLICY "Service role full access" ON news FOR ALL USING (true);
CREATE POLICY "Service role full access" ON rss_sources FOR ALL USING (true);
CREATE POLICY "Service role full access" ON keywords FOR ALL USING (true);
CREATE POLICY "Service role full access" ON newsletter_logs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON settings FOR ALL USING (true);

-- 익명 사용자 읽기 허용 (웹사이트에서 조회)
CREATE POLICY "Public read news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read sources" ON rss_sources FOR SELECT USING (true);
CREATE POLICY "Public read keywords" ON keywords FOR SELECT USING (true);
