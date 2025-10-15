import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy analytics/engagement/trends to NestJS backend

export async function GET(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: "api/v2/analytics/engagement/trends",
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === "development",
  });
}
