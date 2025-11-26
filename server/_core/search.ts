/**
 * Web Search Integration
 * Provides search capabilities using DuckDuckGo (no API key required)
 */

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Search the web using DuckDuckGo Instant Answer API
 */
export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    // Using DuckDuckGo Instant Answer API (free, no key required)
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );

    if (!response.ok) {
      throw new Error("Search API request failed");
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    // Extract abstract
    if (data.Abstract) {
      results.push({
        title: data.Heading || "نتيجة رئيسية",
        snippet: data.Abstract,
        url: data.AbstractURL || "",
      });
    }

    // Extract related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.substring(0, 100),
            snippet: topic.Text,
            url: topic.FirstURL,
          });
        }
      });
    }

    return results;
  } catch (error) {
    console.error("[Search] Error:", error);
    return [];
  }
}

/**
 * Format search results as text for LLM context
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "لم يتم العثور على نتائج بحث.";
  }

  return results
    .map(
      (result, index) =>
        `${index + 1}. ${result.title}
${result.snippet}
المصدر: ${result.url}
`
    )
    .join("\n---\n");
}
