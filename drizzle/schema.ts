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

export const agentTasks = mysqlTable("agent_tasks", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  brief: text("brief").notNull(),
  type: mysqlEnum("type", ["code", "analysis", "image", "video", "automation"]).notNull(),
  status: mysqlEnum("status", ["draft", "queued", "blocked", "completed"]).default("draft").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "review_required"]).default("review_required").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditEntries = mysqlTable("audit_entries", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  action: varchar("action", { length: 160 }).notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const repositoryInventory = mysqlTable("repository_inventory", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 240 }).notNull().unique(),
  description: text("description"),
  visibility: mysqlEnum("visibility", ["public", "private"]).notNull(),
  primaryLanguage: varchar("primaryLanguage", { length: 80 }),
  sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
  observedAt: timestamp("observedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const integrationStates = mysqlTable("integration_states", {
  id: int("id").autoincrement().primaryKey(),
  integrationKey: varchar("integrationKey", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["connected", "available", "limited", "blocked"]).notNull(),
  mode: varchar("mode", { length: 120 }).notNull(),
  detail: text("detail").notNull(),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = typeof agentTasks.$inferInsert;
export type AuditEntry = typeof auditEntries.$inferSelect;
export type RepositoryInventory = typeof repositoryInventory.$inferSelect;
export type IntegrationState = typeof integrationStates.$inferSelect;
