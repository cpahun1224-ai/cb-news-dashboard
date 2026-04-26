// ============================================================
// 뉴스 관련성 점수 계산 모듈
// 키워드 기반으로 각 뉴스의 관련성을 0~1 사이 점수로 계산
// ============================================================

/** 관련성 계산에 사용할 키워드와 가중치 */
interface KeywordWeight {
  keyword: string;
  weight: number;
}

/**
 * 뉴스 텍스트에서 키워드 관련성 점수를 계산합니다.
 * @param text - 뉴스 제목 + 내용 합친 텍스트
 * @param keywords - 키워드 목록 (DB에서 가져옴)
 * @returns 0.00 ~ 1.00 사이의 관련성 점수
 */
export function calculateRelevanceScore(
  text: string,
  keywords: KeywordWeight[]
): number {
  const lowerText = text.toLowerCase();
  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const { keyword, weight } of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    maxPossibleScore += weight;

    // 키워드가 텍스트에 포함되면 점수 추가
    if (lowerText.includes(lowerKeyword)) {
      // 제목에 있으면 2배 가중치
      const titleMultiplier = lowerText.slice(0, 200).includes(lowerKeyword) ? 2 : 1;
      totalScore += weight * titleMultiplier;
    }
  }

  if (maxPossibleScore === 0) return 0;

  // 0~1 사이로 정규화 (최대 2배 가중치 고려)
  const normalizedScore = Math.min(totalScore / (maxPossibleScore * 1.5), 1.0);
  return Math.round(normalizedScore * 100) / 100;
}

/**
 * 제외할 뉴스인지 확인합니다.
 * 단순 금리/주가 뉴스는 제외합니다.
 */
export function shouldExcludeNews(title: string): boolean {
  const excludePatterns = [
    /^코스피|^코스닥|^나스닥|^다우/,  // 주가지수 단순 보도
    /원·달러 환율/,                   // 단순 환율
    /부동산 시장.*급등|아파트.*매매가/, // 부동산 가격 단순 보도
    /로또|복권/,
  ];

  return excludePatterns.some((pattern) => pattern.test(title));
}

/**
 * 기본 키워드 목록 (DB 연결 없이도 사용 가능한 폴백)
 */
export const DEFAULT_KEYWORDS: KeywordWeight[] = [
  { keyword: '기업신용평가', weight: 2.0 },
  { keyword: '기업여신', weight: 2.0 },
  { keyword: '중소기업 금융', weight: 1.8 },
  { keyword: '대안신용평가', weight: 2.0 },
  { keyword: '신용평가모형', weight: 1.8 },
  { keyword: '조기경보시스템', weight: 1.8 },
  { keyword: 'EWS', weight: 1.5 },
  { keyword: '금융 AI', weight: 1.8 },
  { keyword: 'AI 대출심사', weight: 1.8 },
  { keyword: '여신심사', weight: 1.8 },
  { keyword: 'SME credit', weight: 1.8 },
  { keyword: 'alternative credit scoring', weight: 2.0 },
  { keyword: 'cash flow based lending', weight: 1.8 },
  { keyword: 'ERP data credit', weight: 1.8 },
  { keyword: 'embedded finance', weight: 1.5 },
  { keyword: 'credit risk', weight: 1.3 },
  { keyword: 'AI underwriting', weight: 1.8 },
  { keyword: '신용리스크', weight: 1.5 },
  { keyword: '부도예측', weight: 1.8 },
  { keyword: '마이데이터', weight: 1.5 },
  { keyword: '오픈뱅킹', weight: 1.2 },
  { keyword: 'NPL', weight: 1.3 },
  { keyword: '부실채권', weight: 1.5 },
];
