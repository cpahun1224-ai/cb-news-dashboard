// ============================================================
// AI 분석 모듈 (OpenAI / Claude API 연동)
// API Key가 없어도 기본 요약으로 동작합니다.
// ============================================================

import { generateBasicSummary } from './rss';

/** AI 분석 결과 */
export interface AIAnalysis {
  summary: string;
  insight: string;
  action_idea: string;
}

/**
 * AI를 사용하여 뉴스를 분석합니다.
 * API Key가 없으면 기본 텍스트 처리를 사용합니다.
 */
export async function analyzeNewsWithAI(
  title: string,
  rawContent: string
): Promise<AIAnalysis> {
  const aiProvider = process.env.AI_PROVIDER;

  // AI API Key 확인
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  // AI를 사용할 수 없으면 기본 분석 반환
  if (!hasOpenAI && !hasAnthropic) {
    return generateFallbackAnalysis(title, rawContent);
  }

  const prompt = buildAnalysisPrompt(title, rawContent);

  try {
    if (aiProvider === 'openai' && hasOpenAI) {
      return await analyzeWithOpenAI(prompt);
    } else if (hasAnthropic) {
      return await analyzeWithClaude(prompt);
    } else if (hasOpenAI) {
      return await analyzeWithOpenAI(prompt);
    }
  } catch (error) {
    console.error('AI 분석 오류, 기본 분석으로 대체:', error);
  }

  return generateFallbackAnalysis(title, rawContent);
}

/** 분석 프롬프트 생성 */
function buildAnalysisPrompt(title: string, rawContent: string): string {
  return `당신은 기업신용평가(CB) 전문가입니다. 다음 뉴스를 분석하여 JSON 형태로 응답해주세요.

뉴스 제목: ${title}
뉴스 내용: ${rawContent.slice(0, 1500)}

다음 세 가지를 분석하여 JSON으로만 응답하세요 (다른 텍스트 없이):
{
  "summary": "3~4문장으로 핵심 내용 요약 (한국어)",
  "insight": "CB 본부장 관점에서의 시사점과 해석 (2~3문장, 한국어)",
  "action_idea": "내부적으로 검토할 수 있는 액션 아이디어 1~2개 (한국어)"
}

주의: 기업신용평가, 대안신용평가, AI 여신심사, EWS, 금융 AI 관점에서 해석하세요.`;
}

/** OpenAI로 분석 */
async function analyzeWithOpenAI(prompt: string): Promise<AIAnalysis> {
  const { OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini', // 비용 효율적인 모델
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content || '';
  return parseAIResponse(content);
}

/** Claude(Anthropic)로 분석 */
async function analyzeWithClaude(prompt: string): Promise<AIAnalysis> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', // 비용 효율적인 모델
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return parseAIResponse(content);
}

/** AI 응답 파싱 */
function parseAIResponse(content: string): AIAnalysis {
  try {
    // JSON 블록 추출
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
    // JSON 파싱 실패 시 텍스트 그대로 반환
  }
  return { summary: content, insight: '', action_idea: '' };
}

/**
 * AI 없이 기본 분석을 생성합니다.
 */
function generateFallbackAnalysis(title: string, rawContent: string): AIAnalysis {
  const summary = generateBasicSummary(rawContent) || title;

  return {
    summary,
    insight: '',  // AI 없이는 인사이트 생성 불가
    action_idea: '', // AI 없이는 액션 아이디어 생성 불가
  };
}

/**
 * 여러 뉴스의 오늘 핵심 요약을 생성합니다.
 */
export async function generateDailySummary(
  newsTitles: string[]
): Promise<string> {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (!hasOpenAI && !hasAnthropic) {
    return `오늘 총 ${newsTitles.length}건의 관련 뉴스가 수집되었습니다.`;
  }

  const prompt = `다음은 오늘 수집된 기업신용평가/금융 AI 관련 뉴스 제목들입니다:

${newsTitles.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join('\n')}

CB 본부장에게 보고하는 형식으로 오늘의 핵심 트렌드를 3~4문장으로 요약해주세요.
특히 기업신용평가, 대안신용평가, AI 여신, EWS 관점에서 중요한 사항을 강조하세요.`;

  try {
    const aiProvider = process.env.AI_PROVIDER;
    if (aiProvider === 'openai' && hasOpenAI) {
      const { OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });
      return response.choices[0]?.message?.content || '';
    } else if (hasAnthropic) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content[0]?.type === 'text' ? response.content[0].text : '';
    }
  } catch (error) {
    console.error('일일 요약 생성 오류:', error);
  }

  return `오늘 총 ${newsTitles.length}건의 관련 뉴스가 수집되었습니다.`;
}
