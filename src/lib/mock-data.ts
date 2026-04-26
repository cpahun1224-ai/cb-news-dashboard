// ============================================================
// 데모용 목업 데이터 (Supabase 미연결 시 사용)
// ============================================================
import type { News } from '@/types';

export const MOCK_NEWS: News[] = [
  {
    id: '1',
    title: '금융위원회, AI 기반 기업신용평가 가이드라인 발표…중소기업 여신심사 혁신 예고',
    source: '금융위원회',
    url: 'https://www.fsc.go.kr',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    summary:
      '금융위원회가 AI·빅데이터를 활용한 기업신용평가 가이드라인을 발표했다. 비재무 데이터(ERP, 매출채권, 현금흐름 등)를 신용평가에 반영해 중소기업의 여신 접근성을 높이는 것이 핵심이다. 오는 1월부터 시범 운영에 들어간다.',
    category: 'domestic',
    relevance_score: 0.95,
    insight:
      '비재무 대안데이터 기반 CB 모형 전환의 제도적 근거가 마련됐다. 기존 재무제표 중심 평가의 한계를 넘어 실시간 현금흐름·거래 데이터 활용이 공식화되는 전환점.',
    action_idea:
      'ERP 데이터 연계 신용평가 모형 PoC 일정 앞당기기 검토. 가이드라인 내 허용 데이터 항목 정밀 분석 후 모형 Feature 매핑 작업 착수.',
    raw_content: null,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: '중소기업 조기경보시스템(EWS) 고도화…머신러닝으로 부도 6개월 전 예측 정확도 87%',
    source: '한국은행',
    url: 'https://www.bok.or.kr',
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    summary:
      '한국은행이 머신러닝 기반 중소기업 조기경보시스템(EWS) 연구 결과를 발표했다. XGBoost 모델이 부도 6개월 전 예측 정확도 87%를 기록하며 기존 재무비율 모델(64%) 대비 크게 개선됐다.',
    category: 'domestic',
    relevance_score: 0.91,
    insight:
      '당행 EWS 모형의 ML 전환 시 6개월 선행 예측력 확보 가능성 확인. 현금흐름 변동성, 매출채권 회수기간 등 비재무 Feature의 예측력이 재무 Feature보다 2.3배 높다는 점이 주목됨.',
    action_idea:
      '현행 EWS 모형에 XGBoost/LightGBM 앙상블 레이어 추가 실험. 비재무 Feature(카드매출, 세금계산서 발행액) 데이터 확보 경로 검토.',
    raw_content: null,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: '금감원, 대안신용평가 활용 여신 확대…마이데이터·통신·건강보험 데이터 허용',
    source: '금융감독원',
    url: 'https://www.fss.or.kr',
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    summary:
      '금융감독원이 대안신용평가 데이터 활용 범위를 마이데이터, 통신이용 패턴, 건강보험료 납부 이력까지 확대하는 방안을 발표했다. 씬파일러(금융이력 부족) 중소법인의 신용평가 기회가 대폭 넓어질 전망이다.',
    category: 'domestic',
    relevance_score: 0.88,
    insight:
      '씬파일러 중소법인 시장이 새로운 여신 타겟으로 부상. 통신·건보 데이터 허용으로 비금융 대안데이터 CB 모형의 법적 근거가 강화됐으며 경쟁 은행의 선점 움직임도 예상됨.',
    action_idea:
      '마이데이터 API 연계 중소기업 신용평가 파일럿 설계. 통신데이터 활용 가능 여부 데이터 파트너십 검토.',
    raw_content: null,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: '은행연합회, 기업여신 심사 AI 도입 현황 조사…시중은행 73% "2년 내 AI 심사 전환"',
    source: '은행연합회',
    url: 'https://www.kfb.or.kr',
    published_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    summary:
      '은행연합회 조사에 따르면 시중은행 73%가 2년 내 AI 기반 기업여신 심사 시스템 전환을 계획 중이다. 주요 도입 영역은 ①자동 재무분석 ②이상거래 감지 ③EWS 고도화 순이다.',
    category: 'domestic',
    relevance_score: 0.83,
    insight:
      '업계 전반의 AI 여신심사 전환이 빠르게 진행 중. 당행의 AI 심사 도입 속도가 경쟁에서 뒤처질 경우 심사 비용·속도 면에서 열위 발생 위험.',
    action_idea: 'AI 여신심사 로드맵 대비 현황 점검. 타행 도입 사례 벤치마킹 스터디 일정 수립.',
    raw_content: null,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: '중소기업 연체율 3년 만에 최고…경기 침체에 EWS 신호등 황색 전환',
    source: '금융감독원',
    url: 'https://www.fss.or.kr',
    published_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    summary:
      '중소기업 대출 연체율이 전분기 대비 0.4%p 상승하며 3년 만에 최고치를 기록했다. 건설·숙박·음식업종 중심으로 연체가 급증하고 있어 선제적 EWS 관리가 시급한 상황이다.',
    category: 'domestic',
    relevance_score: 0.79,
    insight:
      '특정 업종(건설·숙박·음식) 집중 리스크로 포트폴리오 재점검 필요. EWS 조기경보 임계값 하향 조정 검토 시점.',
    action_idea:
      '건설·숙박업종 여신 포트폴리오 긴급 점검. EWS 알람 임계값 민감도 상향 조정 검토.',
    raw_content: null,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: "Goldman Sachs Launches AI-Powered SME Credit Scoring Platform with Real-Time Cash Flow Analysis",
    source: 'Financial Times',
    url: 'https://ft.com',
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    summary:
      "Goldman Sachs has unveiled an AI-driven SME credit assessment platform that analyzes real-time cash flow, ERP data, and payment history to deliver credit decisions in under 5 minutes. The system uses a transformer-based model trained on 10M+ business transactions.",
    category: 'global',
    relevance_score: 0.92,
    insight:
      '글로벌 IB의 실시간 현금흐름 기반 AI 심사가 상용화 단계 진입. 5분 내 심사 결정이 시장 표준이 될 경우 국내 은행의 기존 심사 프로세스(평균 3~5일) 경쟁력 압박 우려.',
    action_idea:
      '실시간 심사 인프라(API 기반 CB 모형) 도입 타당성 검토. 현재 심사 소요시간 및 비용 벤치마킹 데이터 수집.',
    raw_content: null,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    title: "Moody's Analytics Expands Alternative Credit Data Suite for Emerging Market SMEs",
    source: "Moody's Analytics",
    url: 'https://moodysanalytics.com',
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    summary:
      "Moody's Analytics has expanded its CreditLens platform to incorporate alternative data sources including supply chain payment flows, utility bills, and digital footprint scores for SME credit assessment in emerging markets.",
    category: 'global',
    relevance_score: 0.87,
    insight:
      '공급망 결제 데이터가 글로벌 CB의 핵심 대안데이터로 부상. 국내 B2B 결제 플랫폼과의 데이터 연계 가능성 탐색 필요.',
    action_idea:
      '공급망 결제 데이터(전자세금계산서, 기업간 이체) 활용 신용평가 Feature 설계 착수.',
    raw_content: null,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    title: "McKinsey: Embedded Finance Could Unlock $7 Trillion in SME Lending by 2030",
    source: 'McKinsey & Company',
    url: 'https://mckinsey.com',
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    summary:
      "McKinsey's latest report estimates embedded finance platforms—where lending is integrated into ERP, e-commerce, and B2B marketplaces—could serve $7 trillion in SME credit demand by 2030, primarily through AI-driven, real-time underwriting.",
    category: 'global',
    relevance_score: 0.84,
    insight:
      '임베디드 파이낸스가 기업여신의 새로운 주요 채널로 부상. 전통 은행의 여신 역할이 플랫폼 기업으로 이전되는 구조적 위협. 당행의 플랫폼 파트너십 전략 검토 시급.',
    action_idea:
      '국내 주요 B2B 플랫폼(ERP, 물류, 이커머스)과 임베디드 여신 파트너십 가능성 타진.',
    raw_content: null,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    title: 'BIS Working Paper: Cash Flow-Based Lending Reduces SME Default Rates by 34% vs Asset-Based Lending',
    source: 'BIS (국제결제은행)',
    url: 'https://bis.org',
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    summary:
      'A BIS working paper analyzing 2M+ SME loans across 15 countries finds cash flow-based lending models reduce default rates by 34% compared to traditional asset-based models, while expanding credit access to underserved businesses.',
    category: 'report',
    relevance_score: 0.93,
    insight:
      '현금흐름 기반 여신의 부도율 34% 감소는 당행 CB 모형 재설계의 강력한 학술적 근거. 담보 중심 여신에서 현금흐름 중심으로의 전환을 뒷받침하는 국제적 증거.',
    action_idea:
      'BIS 논문 원문 확보 후 CB팀 내부 세미나 개최. 현금흐름 기반 여신 파일럿 대상 포트폴리오 선정 검토.',
    raw_content: null,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    title: 'Deloitte 보고서: 국내 기업 AI 신용평가 도입 장벽 1위 "데이터 품질 및 거버넌스"',
    source: 'Deloitte',
    url: 'https://www2.deloitte.com',
    published_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    summary:
      'Deloitte가 국내 금융기관 50개사를 대상으로 한 AI 신용평가 도입 현황 조사에서 최대 장벽으로 "데이터 품질 및 거버넌스"(68%)가 꼽혔다. 이어 "모형 해석 가능성"(54%), "규제 불확실성"(47%) 순이었다.',
    category: 'report',
    relevance_score: 0.82,
    insight:
      '데이터 거버넌스가 AI CB 도입의 실질적 병목. 내부 데이터 품질 관리 체계와 모형 설명 가능성(XAI) 확보가 선결 과제임을 확인.',
    action_idea:
      '기업 CB 데이터 품질 진단 프로젝트 계획 수립. XAI 적용 가능한 모형(SHAP, LIME) 파일럿 검토.',
    raw_content: null,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
];
