import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy customer-health/at-risk to NestJS backend

export async function GET(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: "api/v2/customer-health/at-risk",
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === "development",
  });
}
