import { NextRequest } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, resetIn } = checkRateLimit("signup", ip);
  if (!allowed) {
    return new Response(
      "Too many attempts. Please wait a minute and try again.",
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response("Please enter your email and password.", {
        status: 400,
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return new Response("Please enter a valid email address.", {
        status: 400,
      });
    }

    if (String(password).length < 8) {
      return new Response("Password must be at least 8 characters.", {
        status: 400,
      });
    }

    await authAdapter.signup(trimmedEmail, String(password));
    return new Response("OK", { status: 200 });
  } catch (err: any) {
    const msg = err?.message || "";
    if (msg.includes("already exists")) {
      return new Response(
        "That email is already registered. Try signing in instead.",
        { status: 400 }
      );
    }
    return new Response(
      "Something went wrong. Please try again.",
      { status: 400 }
    );
  }
}
