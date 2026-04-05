import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildPrisma(): PrismaClient {
  const tursoUrl = process.env.TURSO_CONNECTION_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // Use Turso (hosted libSQL) if configured, otherwise fall back to local SQLite
  if (tursoUrl && tursoToken) {
    const libsql = createClient({ url: tursoUrl, authToken: tursoToken });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaLibSQL(libsql as any);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    } as any);
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? buildPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
