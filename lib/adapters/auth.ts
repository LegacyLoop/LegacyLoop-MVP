import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "../db";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production");
}
if (process.env.NODE_ENV !== "production" && !process.env.JWT_SECRET) {
  console.warn("[auth] JWT_SECRET not set — using insecure default. Do NOT use in production.");
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

export const authAdapter = {
  async signup(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) throw new Error("User already exists");

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: { email: cleanEmail, passwordHash, tier: 1 },
    });

    // auto-login after signup
    await this.login(cleanEmail, password);
  },

  async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) throw new Error("Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid credentials");

    const token = await new SignJWT({ userId: user.id, tier: user.tier })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const jar = await cookies();
    jar.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  },

  async getSession() {
    const jar = await cookies();
    const token = jar.get("auth-token")?.value;
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.userId as string | undefined;
      if (!userId) return null;

      return await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, tier: true, heroVerified: true },
      });
    } catch {
      return null;
    }
  },

  async logout() {
    const jar = await cookies();
    jar.delete("auth-token");
  },

  /** Login with extended session (30 days) when "remember me" is checked */
  async loginWithRemember(email: string, password: string, remember: boolean) {
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) throw new Error("Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid credentials");

    const expiry = remember ? "30d" : "7d";
    const maxAge = remember ? 2592000 : 604800;

    const token = await new SignJWT({ userId: user.id, tier: user.tier })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(secret);

    const jar = await cookies();
    jar.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  },

  /** Issue a session for an OAuth/phone/magic-link user (no password needed) */
  async issueSession(userId: string, tier: number, remember?: boolean) {
    const expiry = remember ? "30d" : "7d";
    const maxAge = remember ? 2592000 : 604800;

    const token = await new SignJWT({ userId, tier })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(secret);

    const jar = await cookies();
    jar.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  },
};