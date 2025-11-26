import { and, eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, InsertConversation, apiSettings, InsertApiSettings, serverSettings, InsertServerSettings, knowledgeBase, InsertKnowledgeBase, longTermMemory, InsertLongTermMemory, errorLogs, InsertErrorLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * حفظ محادثة جديدة
 */
export async function saveConversation(conversation: InsertConversation) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save conversation: database not available");
    return null;
  }

  try {
    const result = await db.insert(conversations).values(conversation);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save conversation:", error);
    throw error;
  }
}

/**
 * جلب محادثات مستخدم معين
 */
export async function getUserConversations(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get conversations: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get conversations:", error);
    return [];
  }
}

/**
 * حذف محادثة
 */
export async function deleteConversation(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete conversation: database not available");
    return;
  }

  try {
    await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      );
  } catch (error) {
    console.error("[Database] Failed to delete conversation:", error);
    throw error;
  }
}

/**
 * حفظ أو تحديث إعدادات API للمستخدم
 */
export async function upsertApiSettings(settings: InsertApiSettings) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert API settings: database not available");
    return null;
  }

  try {
    await db.insert(apiSettings).values(settings).onDuplicateKeyUpdate({
      set: {
        openaiApiKey: settings.openaiApiKey,
        githubToken: settings.githubToken,
        githubUsername: settings.githubUsername,
        preferredModel: settings.preferredModel,
        enableWebSearch: settings.enableWebSearch,
        enableGithubSearch: settings.enableGithubSearch,
        updatedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("[Database] Failed to upsert API settings:", error);
    throw error;
  }
}

/**
 * جلب إعدادات API للمستخدم
 */
export async function getApiSettings(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get API settings: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(apiSettings)
      .where(eq(apiSettings.userId, userId))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get API settings:", error);
    return null;
  }
}

/**
 * حفظ أو تحديث إعدادات السيرفر للمستخدم
 */
export async function upsertServerSettings(settings: InsertServerSettings) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert server settings: database not available");
    return;
  }

  try {
    await db
      .insert(serverSettings)
      .values(settings)
      .onDuplicateKeyUpdate({
        set: {
          sshHost: settings.sshHost,
          sshPort: settings.sshPort,
          sshUser: settings.sshUser,
          sshPrivateKey: settings.sshPrivateKey,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert server settings:", error);
    throw error;
  }
}

/**
 * جلب إعدادات السيرفر للمستخدم
 */
export async function getServerSettings(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get server settings: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(serverSettings)
      .where(eq(serverSettings.userId, userId))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get server settings:", error);
    return null;
  }
}


// ==================== Knowledge Base Functions ====================

export async function addKnowledge(knowledge: InsertKnowledgeBase) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add knowledge: database not available");
    return;
  }

  await db.insert(knowledgeBase).values(knowledge);
}

export async function getKnowledgeByUser(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get knowledge: database not available");
    return [];
  }

  return await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, userId))
    .orderBy(desc(knowledgeBase.updatedAt));
}

export async function searchKnowledge(userId: number, searchTerm: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search knowledge: database not available");
    return [];
  }

  // Simple search in title and content
  const results = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, userId))
    .orderBy(desc(knowledgeBase.updatedAt));

  return results.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export async function deleteKnowledge(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete knowledge: database not available");
    return;
  }

  await db
    .delete(knowledgeBase)
    .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)));
}

// ==================== Long-term Memory Functions ====================

export async function addMemory(memory: InsertLongTermMemory) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add memory: database not available");
    return;
  }

  await db.insert(longTermMemory).values(memory);
}

export async function getMemoriesByUser(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get memories: database not available");
    return [];
  }

  return await db
    .select()
    .from(longTermMemory)
    .where(eq(longTermMemory.userId, userId))
    .orderBy(desc(longTermMemory.importance), desc(longTermMemory.lastAccessedAt));
}

export async function getMemoryByKey(userId: number, key: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get memory: database not available");
    return undefined;
  }

  const results = await db
    .select()
    .from(longTermMemory)
    .where(and(eq(longTermMemory.userId, userId), eq(longTermMemory.key, key)))
    .limit(1);

  // Update last accessed time
  if (results.length > 0 && results[0]) {
    await db
      .update(longTermMemory)
      .set({ lastAccessedAt: new Date() })
      .where(eq(longTermMemory.id, results[0].id));
  }

  return results.length > 0 ? results[0] : undefined;
}

// ==================== Error Logs Functions ====================

export async function addErrorLog(errorLog: InsertErrorLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add error log: database not available");
    return;
  }

  await db.insert(errorLogs).values(errorLog);
}

export async function getErrorLogsByUser(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get error logs: database not available");
    return [];
  }

  return await db
    .select()
    .from(errorLogs)
    .where(eq(errorLogs.userId, userId))
    .orderBy(desc(errorLogs.createdAt));
}

export async function updateErrorLogStatus(
  id: number,
  userId: number,
  status: "new" | "analyzing" | "resolved" | "ignored",
  solution?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update error log: database not available");
    return;
  }

  const updateData: any = { status };
  if (solution) {
    updateData.solution = solution;
  }
  if (status === "resolved") {
    updateData.resolvedAt = new Date();
  }

  await db
    .update(errorLogs)
    .set(updateData)
    .where(and(eq(errorLogs.id, id), eq(errorLogs.userId, userId)));
}
