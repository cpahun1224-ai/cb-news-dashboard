// ============================================================
// RSS 뉴스 수집 모듈
// rss-parser를 사용하여 여러 RSS 피드에서 뉴스를 수집합니다.
// ============================================================
import Parser from 'rss-parser';
import { calculateRelevanceScore, shouldExcludeNews, DEFAULT_KEYWORDS } from './relevance';
import type { RssSource } from '@/types';

// RSS 파서 설정
const parser = new Parser({
  timeout: 30000, // 30초 타임아웃
  headers: {
    // 브라우저에 가까운 User-Agent — Google News 등 봇 차단 우회
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
    ],
  },
});

/** RSS에서 파싱된 뉴스 아이템 */
export interface ParsedNewsItem {
  title: string;
  url: string;
  source: string;
  category: 'domestic' | 'global' | 'report';
  published_at: string | null;
  raw_content: string;
  relevance_score: number;
}

/**
 * 단일 RSS 소스에서 뉴스를 수집합니다.
 */
async function collectFromSource(
  source: RssSource,
  keywords: { keyword: string; weight: number }[]
): Promise<ParsedNewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items: ParsedNewsItem[] = [];

    for (const item of feed.items || []) {
      const title = item.title?.trim() || '';
      const url = item.link?.trim() || '';

      // 제목이나 URL이 없으면 스킵
      if (!title || !url) continue;

      // 제외 패턴에 해당하면 스킵
      if (shouldExcludeNews(title)) continue;

      // 원문 내용 추출 (요약에 사용)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemAny = item as any;
      const rawContent = [
        title,
        item.contentSnippet || '',
        itemAny.contentEncoded as string || '',
        item.content || '',
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/<[^>]*>/g, '') // HTML 태그 제거
        .slice(0, 2000); // 최대 2000자

      // 관련성 점수 계산
      const relevanceScore = calculateRelevanceScore(rawContent, keywords);

      // 발행일 파싱
      let publishedAt: string | null = null;
      if (item.pubDate || item.isoDate) {
        try {
          publishedAt = new Date(item.pubDate || item.isoDate || '').toISOString();
        } catch {
          publishedAt = null;
        }
      }

      items.push({
        title,
        url,
        source: source.name,
        category: source.category,
        published_at: publishedAt,
        raw_content: rawContent,
        relevance_score: relevanceScore,
      });
    }

    return items;
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error(`[rss] 수집 오류 [${source.name}] ${source.url}: ${msg}`);
    return [];
  }
}

/**
 * 여러 RSS 소스에서 병렬로 뉴스를 수집합니다.
 */
export async function collectAllFeeds(
  sources: RssSource[],
  keywords?: { keyword: string; weight: number }[]
): Promise<{
  items: ParsedNewsItem[];
  errors: string[];
  processedSources: number;
}> {
  const activeKeywords = keywords && keywords.length > 0 ? keywords : DEFAULT_KEYWORDS;
  const activeSources = sources.filter((s) => s.is_active);
  const errors: string[] = [];

  // 모든 소스를 병렬 수집 (최대 5개씩 배치 처리)
  const BATCH_SIZE = 5;
  const allItems: ParsedNewsItem[] = [];
  let processedSources = 0;

  for (let i = 0; i < activeSources.length; i += BATCH_SIZE) {
    const batch = activeSources.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((source) => collectFromSource(source, activeKeywords))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
        processedSources++;
      } else {
        errors.push(`${batch[j].name}: ${result.reason?.message || '알 수 없는 오류'}`);
      }
    }
  }

  // URL 기준 중복 제거
  const seen = new Set<string>();
  const uniqueItems = allItems.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // 관련성 점수 기준으로 정렬
  uniqueItems.sort((a, b) => b.relevance_score - a.relevance_score);

  return { items: uniqueItems, errors, processedSources };
}

/**
 * 텍스트에서 기본 요약을 생성합니다 (AI 없이 사용 가능).
 * 첫 3문장을 추출합니다.
 */
export function generateBasicSummary(rawContent: string): string {
  const sentences = rawContent
    .replace(/\s+/g, ' ')
    .split(/[.!?。]\s+/)
    .filter((s) => s.trim().length > 10)
    .slice(0, 3);

  return sentences.join('. ').trim() + (sentences.length > 0 ? '.' : '');
}
