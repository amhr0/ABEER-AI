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

describe("Server Control Features", () => {
  it("should save server settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.server.saveSettings({
      sshHost: "test.example.com",
      sshPort: 22,
      sshUser: "testuser",
    });

    expect(result).toEqual({ success: true });
  });

  it("should get server settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First save settings
    await caller.server.saveSettings({
      sshHost: "test.example.com",
      sshPort: 22,
      sshUser: "testuser",
    });

    // Then retrieve them
    const settings = await caller.server.getSettings();

    expect(settings).toBeDefined();
    expect(settings?.sshHost).toBe("test.example.com");
    expect(settings?.sshPort).toBe(22);
    expect(settings?.sshUser).toBe("testuser");
  });
});

describe("Chat History Features", () => {
  it("should get conversation history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.agent.getHistory();

    expect(Array.isArray(history)).toBe(true);
  });

  it("should handle health check", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const health = await caller.agent.health();

    expect(health).toHaveProperty("status");
    expect(health).toHaveProperty("timestamp");
    expect(health.status).toBe("healthy");
  });
});

describe("API Settings Features", () => {
  it("should save API settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agent.saveSettings({
      preferredModel: "gpt-4",
      enableWebSearch: true,
      enableGithubSearch: true,
    });

    expect(result).toEqual({ success: true });
  });

  it("should get API settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First save settings
    await caller.agent.saveSettings({
      preferredModel: "gpt-4",
      enableWebSearch: true,
    });

    // Then retrieve them
    const settings = await caller.agent.getSettings();

    expect(settings).toBeDefined();
    expect(settings?.preferredModel).toBe("gpt-4");
    expect(settings?.enableWebSearch).toBe(true);
  });
});
