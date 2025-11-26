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

describe("knowledge router", () => {
  it("should add knowledge successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.knowledge.add({
      title: "Test Knowledge",
      content: "This is test content",
      category: "documentation",
    });

    expect(result).toEqual({ success: true });
  });

  it("should get all knowledge", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.knowledge.getAll();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should search knowledge", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.knowledge.search({ query: "test" });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("errorLogs router", () => {
  it("should add error log successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.errorLogs.add({
      errorType: "ConnectionError",
      errorMessage: "ECONNREFUSED",
      severity: "high",
    });

    expect(result.success).toBe(true);
    expect(result.analysis).toBeDefined();
    expect(result.analysis.type).toBe("connection_error");
  });

  it("should get all error logs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.errorLogs.getAll();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should analyze error correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.errorLogs.analyze({
      errorMessage: "404 Not Found",
    });

    expect(result.type).toBe("not_found");
    expect(result.severity).toBe("medium");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("should analyze server error correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.errorLogs.analyze({
      errorMessage: "500 Internal Server Error",
    });

    expect(result.type).toBe("server_error");
    expect(result.severity).toBe("critical");
  });
});
