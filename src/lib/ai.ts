// ============================================================
// AI 분석 모듈 (Groq API — llama-3.1-8b-instant)
// GROQ_API_KEY가 없으면 기본 텍스트 처리로 동작합니다.
// ============================================================

import { generateBasicSummary } from './rss';

export interface AIAnalysis {
  summary: string;
  insight: string;
  action_idea: string;
}

/**
 * Groq로 뉴스를 분석합니다.
 * GROQ_API_KEY가 없으면 기본 분석을 반환합니다.
 */
export async function analyzeNewsWithAI(
  title: string,
  rawContent: string
): Promise<AIAnalysis> {
  if (!process.env.GROQ_API_KEY) {
    return generateFallbackAnalysis(title, rawContent);
  }

  try {
    return await analyzeWithGroq(title, rawContent);
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const is429 = msg.includes('429') || msg.toLowerCase().includes('rate limit');
    console.error(`[ai] Groq 분석 실패(${is429 ? '429 rate limit' : '오류'}) — ${msg.slice(0, 120)} | title="${title.slice(0, 40)}"`);
    return generateFallbackAnalysis(title, rawContent);
  }
}

/** 뉴스 분석 프롬프트 */
function buildAnalysisPrompt(title: string, rawContent: string): string {
  return `당신은 기업신용평가(CB) 전문가입니다. 뉴스를 분석하고 아래 JSON만 출력하세요.

뉴스 제목: ${title}
뉴스 내용: ${rawContent.slice(0, 1500)}

출력 형식 (JSON 외 텍스트 없이):
{
  "summary": "핵심 내용 3~4문장 요약 (한국어)",
  "insight": "① CB 사업 연관성 첫 번째 인사이트\\n② CB 사업 연관성 두 번째 인사이트\\n③ CB 사업 연관성 세 번째 인사이트\\n분류: [리스크/기회] - 한 줄 근거",
  "action_idea": "① 실무 액션 아이디어 첫 번째\\n② 실무 액션 아이디어 두 번째"
}

분석 관점: 기업신용평가, 대안신용평가, AI 여신심사, EWS, 금융 AI, 기업여신`;
}

/** Groq llama-3.1-8b-instant로 단일 뉴스 분석 */
async function analyzeWithGroq(title: string, rawContent: string): Promise<AIAnalysis> {
  const Groq = (await import('groq-sdk')).default;
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: buildAnalysisPrompt(title, rawContent) }],
    temperature: 0.3,
    max_tokens: 600,
  });

  const content = completion.choices[0]?.message?.content || '';
  return parseAIResponse(content);
}

/** JSON 응답 파싱 */
function parseAIResponse(content: string): AIAnalysis {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || '',
        insight: parsed.insight || '',
        action_idea: parsed.action_idea || '',
      };
    }
  } catch {
    // JSON 파싱 실패 시 raw 텍스트 반환
  }
  return { summary: content.slice(0, 500), insight: '', action_idea: '' };
}

/** API Key 없을 때 기본 분석 */
function generateFallbackAnalysis(title: string, rawContent: string): AIAnalysis {
  return {
    summary: generateBasicSummary(rawContent) || title,
    insight: '',
    action_idea: '',
  };
}

/**
 * 오늘 수집된 뉴스 제목 목록으로 일일 트렌드 요약을 생성합니다.
 */
export async function generateDailySummary(newsTitles: string[]): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return `오늘 총 ${newsTitles.length}건의 관련 뉴스가 수집되었습니다.`;
  }

  const prompt = `다음은 오늘 수집된 기업신용평가/금융 AI 관련 뉴스 제목들입니다:

${newsTitles.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join('\n')}

CB 본부장에게 보고하는 형식으로 오늘의 핵심 트렌드를 3~4문장으로 요약하세요.
기업신용평가, 대안신용평가, AI 여신심사, EWS 관점에서 중요한 사항을 강조하세요.`;

  try {
    const Groq = (await import('groq-sdk')).default;
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || `오늘 총 ${newsTitles.length}건의 관련 뉴스가 수집되었습니다.`;
  } catch (error) {
    console.error('[ai] 일일 요약 생성 오류:', error);
    return `오늘 총 ${newsTitles.length}건의 관련 뉴스가 수집되었습니다.`;
  }
}
