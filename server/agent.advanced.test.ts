import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Advanced AI Agent Features", () => {
  it("should save and retrieve API settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // حفظ الإعدادات
    const saveResult = await caller.agent.saveSettings({
      openaiApiKey: "test-key",
      githubToken: "test-token",
      githubUsername: "testuser",
      preferredModel: "gpt-4",
      enableWebSearch: true,
      enableGithubSearch: true,
    });

    expect(saveResult).toEqual({ success: true });

    // جلب الإعدادات
    const settings = await caller.agent.getSettings();
    expect(settings).toBeDefined();
    expect(settings?.openaiApiKey).toBe("test-key");
    expect(settings?.githubUsername).toBe("testuser");
    expect(settings?.enableWebSearch).toBe(true);
  });

  it("should send message and get AI response", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This test will use Gemini API as fallback if OpenAI key is not valid
    const result = await caller.agent.sendMessage({
      message: "مرحبا",
      enableSearch: false,
    });

    expect(result).toBeDefined();
    expect(result.reply).toBeTruthy();
    expect(typeof result.reply).toBe("string");
    expect(result.timestamp).toBeTruthy();
    expect(result).toHaveProperty("hasSearchResults");
  }, 30000); // 30 second timeout for API call

  it("should retrieve conversation history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.agent.getHistory();

    expect(Array.isArray(history)).toBe(true);
    // History might be empty for new users, so we just check the structure
    if (history.length > 0) {
      expect(history[0]).toHaveProperty("message");
      expect(history[0]).toHaveProperty("response");
      expect(history[0]).toHaveProperty("createdAt");
    }
  });

  it("should check agent health status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const health = await caller.agent.health();

    expect(health).toEqual({
      status: "healthy",
      timestamp: expect.any(String),
    });
  });
});
