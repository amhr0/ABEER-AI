import { describe, expect, it, vi } from "vitest";
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

describe("agent.health", () => {
  it("returns healthy status", async () => {
    const caller = appRouter.createCaller({
      user: undefined,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    const result = await caller.agent.health();

    expect(result.status).toBe("healthy");
    expect(result.timestamp).toBeDefined();
  });
});

describe("agent.sendMessage", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller({
      user: undefined,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(
      caller.agent.sendMessage({ message: "Hello" })
    ).rejects.toThrow();
  });

  it(
    "sends message and receives reply when authenticated",
    async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.agent.sendMessage({
        message: "مرحباً",
      });

      expect(result.reply).toBeDefined();
      expect(typeof result.reply).toBe("string");
      expect(result.timestamp).toBeDefined();
    },
    15000
  ); // 15 seconds timeout for API call

  it("rejects empty messages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.agent.sendMessage({ message: "" })
    ).rejects.toThrow();
  });
});

describe("agent.getHistory", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller({
      user: undefined,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.agent.getHistory()).rejects.toThrow();
  });

  it("returns conversation history for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agent.getHistory();

    expect(Array.isArray(result)).toBe(true);
  });
});
