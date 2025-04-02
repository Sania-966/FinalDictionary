import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  const ip = request.ip || "unknown";

  const now = Date.now();
  const WINDOW_MS = 60000;
  const LIMIT = 50;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter((time: number) => now - time < WINDOW_MS);
  timestamps.push(now);

  rateLimitMap.set(ip, timestamps);

  if (timestamps.length > LIMIT) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
