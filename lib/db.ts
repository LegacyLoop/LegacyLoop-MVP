import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// CMD-DEV-PROD-DB-ISOLATION V18 · DOC-DEV-PROD-DB-ISOLATION (#13)
//
// Vercel runtime auto-injects VERCEL=1 (and VERCEL_ENV=production|preview|
// development). Local Mac processes do NOT have this var unless deliberately
// exported. We use VERCEL presence as the "am I in Vercel deployment context?"
// signal.
//
// Rule:
//   - Vercel context  + TURSO_* present  → use Turso (production path).
//   - Vercel context  + TURSO_* absent   → throw (misconfiguration).
//   - Local context   + TURSO_* absent   → use SQLite (correct DEV path).
//   - Local context   + TURSO_* present  → THROW LOUDLY (env-var bleed).
//
// Override (intentional local-prod work, e.g., audit scripts):
//   set ALLOW_LOCAL_TURSO=1 in the shell for that single invocation.
//   This is a deliberate, conscious act — not a passive mistake.
//
// FIX 3 · DATABASE_URL fallback assertion:
//   When SQLite fallback engages in non-Vercel runtime, DATABASE_URL must
//   resolve to a `file:` path. Catches the case where DATABASE_URL was
//   accidentally pointed at a hosted Postgres/MySQL/etc.
function buildPrisma(): PrismaClient {
  const tursoUrl = process.env.TURSO_CONNECTION_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const isVercel = Boolean(process.env.VERCEL);
  const allowLocalTurso = process.env.ALLOW_LOCAL_TURSO === "1";

  // Bleed guard — local context with TURSO_* present.
  if (!isVercel && (tursoUrl || tursoToken) && !allowLocalTurso) {
    throw new Error(
      "[lib/db.ts] DEV/PROD ISOLATION VIOLATION: TURSO_* env vars are " +
      "set in non-Vercel runtime. Local processes must NOT write to " +
      "production Turso. Strip TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN " +
      "from .env.local. To override for a single audit invocation, set " +
      "ALLOW_LOCAL_TURSO=1 in the shell. " +
      "See CMD-DEV-PROD-DB-ISOLATION V18 / DOC-DEV-PROD-DB-ISOLATION."
    );
  }

  // Vercel misconfig guard — deployed runtime missing TURSO_*.
  if (isVercel && (!tursoUrl || !tursoToken)) {
    throw new Error(
      "[lib/db.ts] VERCEL MISCONFIGURATION: VERCEL=1 detected but " +
      "TURSO_CONNECTION_URL / TURSO_AUTH_TOKEN are missing. Production " +
      "deploy cannot fall back to local SQLite. Verify Vercel Project " +
      "Settings → Environment Variables."
    );
  }

  // Production / explicitly-allowed local audit path.
  if (tursoUrl && tursoToken) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    } as any);
    return new PrismaClient({ adapter } as any);
  }

  // SQLite fallback assertion (FIX 3) — DATABASE_URL must resolve to a
  // `file:` path in non-Vercel runtime. dotenv strips quote wrappers, so
  // `DATABASE_URL="file:./dev.db"` reads as `file:./dev.db` here.
  if (!isVercel) {
    const dbUrl = process.env.DATABASE_URL || "";
    if (dbUrl && !dbUrl.startsWith("file:")) {
      throw new Error(
        "[lib/db.ts] DEV ISOLATION ASSERTION: DATABASE_URL in non-Vercel " +
        "runtime must start with 'file:' (SQLite). Got: " +
        dbUrl.substring(0, 20) + "... " +
        "See CMD-DEV-PROD-DB-ISOLATION V18 FIX 3."
      );
    }
  }

  // Local DEV path — SQLite via DATABASE_URL=file:./dev.db.
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? buildPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
