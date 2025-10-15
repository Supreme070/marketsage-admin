import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy customer-health/organization/:id to NestJS backend

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToNestJS(request, {
    backendPath: `api/v2/customer-health/organization/${params.id}`,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === "development",
  });
}
