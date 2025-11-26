import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * جدول المحادثات - يحفظ جميع الرسائل بين المستخدمين والذكاء الاصطناعي
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * جدول إعدادات API - يحفظ مفاتيح API للمستخدمين
 */
export const apiSettings = mysqlTable("apiSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  openaiApiKey: text("openaiApiKey"),
  githubToken: text("githubToken"),
  githubUsername: varchar("githubUsername", { length: 255 }),
  preferredModel: varchar("preferredModel", { length: 50 }).default("gpt-4"),
  enableWebSearch: int("enableWebSearch").default(1), // 1 = true, 0 = false
  enableGithubSearch: int("enableGithubSearch").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiSettings = typeof apiSettings.$inferSelect;
export type InsertApiSettings = typeof apiSettings.$inferInsert;

/**
 * جدول إعدادات السيرفر
 */
export const serverSettings = mysqlTable("server_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  sshHost: varchar("sshHost", { length: 255 }),
  sshPort: int("sshPort").default(22),
  sshUser: varchar("sshUser", { length: 100 }),
  sshPrivateKey: text("sshPrivateKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServerSettings = typeof serverSettings.$inferSelect;
export type InsertServerSettings = typeof serverSettings.$inferInsert;
/**
 * جدول قاعدة المعرفة - لحفظ وثائق المشروع والمعلومات التقنية
 */
export const knowledgeBase = mysqlTable("knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", [
    "documentation",
    "code",
    "config",
    "error",
    "solution",
    "note",
  ]).notNull(),
  tags: text("tags"), // JSON array of tags
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * جدول الذاكرة طويلة الأمد - لحفظ سياق المحادثات والمعلومات المهمة
 */
export const longTermMemory = mysqlTable("long_term_memory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId"),
  memoryType: mysqlEnum("memoryType", [
    "project_detail",
    "user_preference",
    "technical_context",
    "solution_history",
  ]).notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(),
  importance: int("importance").default(1), // 1-10
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastAccessedAt: timestamp("lastAccessedAt").defaultNow().notNull(),
});

export type LongTermMemory = typeof longTermMemory.$inferSelect;
export type InsertLongTermMemory = typeof longTermMemory.$inferInsert;

/**
 * جدول سجلات الأخطاء - لتحليل وتتبع المشاكل
 */
export const errorLogs = mysqlTable("error_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  errorType: varchar("errorType", { length: 100 }).notNull(),
  errorMessage: text("errorMessage").notNull(),
  stackTrace: text("stackTrace"),
  filePath: varchar("filePath", { length: 500 }),
  lineNumber: int("lineNumber"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  status: mysqlEnum("status", ["new", "analyzing", "resolved", "ignored"]).default("new").notNull(),
  solution: text("solution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;
