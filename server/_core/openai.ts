/**
 * OpenAI API Integration
 * Provides direct access to OpenAI GPT models
 */

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Call OpenAI API with custom API key
 */
export async function callOpenAI(params: {
  messages: OpenAIMessage[];
  apiKey: string;
  model?: string;
}): Promise<OpenAIResponse> {
  const { messages, apiKey, model = "gpt-4" } = params;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      console.error("[OpenAI] API Error:", error);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    console.error("[OpenAI] Request failed:", error.message);
    throw new Error("Failed to connect to OpenAI");
  }
}

/**
 * Call OpenAI with web search capability
 */
export async function callOpenAIWithSearch(params: {
  query: string;
  apiKey: string;
  searchResults?: string;
}): Promise<string> {
  const { query, apiKey, searchResults } = params;

  const systemPrompt = searchResults
    ? `أنت وكيل تقني ذكي ومتقدم. لديك معلومات من البحث في الإنترنت. استخدم هذه المعلومات للإجابة بدقة:

نتائج البحث:
${searchResults}

قدم إجابة شاملة ودقيقة بناءً على المعلومات المتاحة.`
    : "أنت وكيل تقني ذكي ومتقدم متخصص في البرمجة والتقنية. ساعد المستخدمين في حل المشاكل التقنية وتقديم حلول برمجية.";

  const response = await callOpenAI({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: query,
      },
    ],
    apiKey,
  });

  return response.choices[0]?.message?.content || "عذراً، لم أتمكن من الرد.";
}
