/**
 * GitHub API Integration
 * Provides access to GitHub repositories and code search
 */

interface GitHubRepo {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
}

interface GitHubCodeResult {
  name: string;
  path: string;
  repository: string;
  url: string;
}

/**
 * Search GitHub repositories
 */
export async function searchGitHubRepos(params: {
  query: string;
  token?: string;
}): Promise<GitHubRepo[]> {
  const { query, token } = params;

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.items.map((item: any) => ({
      name: item.full_name,
      description: item.description || "لا يوجد وصف",
      url: item.html_url,
      stars: item.stargazers_count,
      language: item.language || "غير محدد",
    }));
  } catch (error) {
    console.error("[GitHub] Error searching repos:", error);
    return [];
  }
}

/**
 * Search code in GitHub
 */
export async function searchGitHubCode(params: {
  query: string;
  token?: string;
}): Promise<GitHubCodeResult[]> {
  const { query, token } = params;

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=5`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.items.map((item: any) => ({
      name: item.name,
      path: item.path,
      repository: item.repository.full_name,
      url: item.html_url,
    }));
  } catch (error) {
    console.error("[GitHub] Error searching code:", error);
    return [];
  }
}

/**
 * Get user repositories
 */
export async function getUserRepos(params: {
  username: string;
  token?: string;
}): Promise<GitHubRepo[]> {
  const { username, token } = params;

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      name: item.full_name,
      description: item.description || "لا يوجد وصف",
      url: item.html_url,
      stars: item.stargazers_count,
      language: item.language || "غير محدد",
    }));
  } catch (error) {
    console.error("[GitHub] Error fetching user repos:", error);
    return [];
  }
}

/**
 * Format GitHub results as text
 */
export function formatGitHubResults(repos: GitHubRepo[]): string {
  if (repos.length === 0) {
    return "لم يتم العثور على مستودعات.";
  }

  return repos
    .map(
      (repo, index) =>
        `${index + 1}. ${repo.name} ⭐ ${repo.stars}
اللغة: ${repo.language}
الوصف: ${repo.description}
الرابط: ${repo.url}
`
    )
    .join("\n---\n");
}
