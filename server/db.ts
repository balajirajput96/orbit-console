import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { agentTasks, auditEntries, InsertAgentTask, InsertUser, integrationStates, repositoryInventory, users } from "../drizzle/schema";
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

export async function listAgentTasks(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentTasks).where(eq(agentTasks.ownerId, ownerId)).orderBy(desc(agentTasks.updatedAt)).limit(30);
}

export async function createAgentTask(task: InsertAgentTask) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(agentTasks).values(task);
  return Number(result[0].insertId);
}

export async function updateAgentTaskStatus(ownerId: number, id: number, status: "draft" | "queued" | "blocked" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(agentTasks).set({ status }).where(and(eq(agentTasks.id, id), eq(agentTasks.ownerId, ownerId)));
  return { ownerId, id, status };
}

export async function listAuditEntries(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditEntries).where(eq(auditEntries.ownerId, ownerId)).orderBy(desc(auditEntries.createdAt)).limit(20);
}

export async function logAuditEntry(ownerId: number, category: string, action: string, detail: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEntries).values({ ownerId, category, action, detail });
}

export async function listRepositoryInventory() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repositoryInventory).orderBy(desc(repositoryInventory.observedAt)).limit(100);
}

export async function getRepositoryByFullName(fullName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repositoryInventory).where(eq(repositoryInventory.fullName, fullName)).limit(1);
  return result[0];
}

export async function listIntegrationStates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrationStates).orderBy(integrationStates.label).limit(30);
}

export async function upsertRepositoryMetadata(input: {
  fullName: string;
  description: string | null;
  visibility: "public" | "private";
  primaryLanguage: string | null;
  sourceUrl: string;
  observedAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(repositoryInventory).values(input).onDuplicateKeyUpdate({
    set: {
      description: input.description,
      visibility: input.visibility,
      primaryLanguage: input.primaryLanguage,
      sourceUrl: input.sourceUrl,
      observedAt: input.observedAt,
    },
  });
}

export async function upsertIntegrationState(input: {
  integrationKey: string;
  label: string;
  status: "connected" | "available" | "limited" | "blocked";
  mode: string;
  detail: string;
  verifiedAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(integrationStates).values(input).onDuplicateKeyUpdate({
    set: {
      label: input.label,
      status: input.status,
      mode: input.mode,
      detail: input.detail,
      verifiedAt: input.verifiedAt,
    },
  });
}
