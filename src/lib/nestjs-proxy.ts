import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

interface ProxyOptions {
  backendPath: string;
  requireAuth?: boolean;
  enableLogging?: boolean;
  timeout?: number;
}

/**
 * Proxy requests from Next.js API routes to NestJS backend
 *
 * Handles:
 * - Authentication token forwarding
 * - Request method passthrough (GET, POST, PUT, DELETE, PATCH)
 * - Query parameters
 * - Request body
 * - Headers forwarding
 * - Error handling and logging
 *
 * @param request - Next.js request object
 * @param options - Proxy configuration options
 * @returns NextResponse with backend response or error
 */
export async function proxyToNestJS(
  request: NextRequest,
  options: ProxyOptions
): Promise<NextResponse> {
  const {
    backendPath,
    requireAuth = true,
    enableLogging = false,
    timeout = 30000,
  } = options;

  const startTime = Date.now();

  try {
    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3006';

    // Check authentication if required
    let authToken: string | undefined;
    if (requireAuth) {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        if (enableLogging) {
          console.error(`[nestjs-proxy] Unauthorized request to ${backendPath}`);
        }
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        );
      }

      // Get access token from session
      authToken = (session as any).accessToken || (session as any).user?.accessToken;

      if (!authToken) {
        if (enableLogging) {
          console.error(`[nestjs-proxy] No access token found for ${backendPath}`);
        }
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_TOKEN',
              message: 'Access token not found in session',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        );
      }
    }

    // Build full URL with query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const fullBackendUrl = `${backendUrl}/${backendPath}${searchParams ? `?${searchParams}` : ''}`;

    if (enableLogging) {
      console.log(`[nestjs-proxy] ${request.method} ${fullBackendUrl}`);
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authentication header
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Forward additional headers (exclude host, connection, etc.)
    const forwardHeaders = ['user-agent', 'accept-language', 'referer'];
    forwardHeaders.forEach(headerName => {
      const value = request.headers.get(headerName);
      if (value) {
        headers[headerName] = value;
      }
    });

    // Prepare request body for methods that support it
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const jsonBody = await request.json();
          body = JSON.stringify(jsonBody);
          if (enableLogging) {
            console.log(`[nestjs-proxy] Request body:`, jsonBody);
          }
        }
      } catch (error) {
        // Body might already be consumed or not JSON
        if (enableLogging) {
          console.warn(`[nestjs-proxy] Could not parse request body:`, error);
        }
      }
    }

    // Make request to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(fullBackendUrl, {
        method: request.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Get response body
      const responseText = await response.text();
      let responseData: any;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      const duration = Date.now() - startTime;

      if (enableLogging) {
        console.log(
          `[nestjs-proxy] Response ${response.status} in ${duration}ms:`,
          responseData
        );
      }

      // Return response with same status code
      return NextResponse.json(responseData, {
        status: response.status,
        headers: {
          'X-Proxy-Duration': `${duration}ms`,
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        if (enableLogging) {
          console.error(`[nestjs-proxy] Request timeout after ${timeout}ms`);
        }
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: `Backend request timeout after ${timeout}ms`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (enableLogging) {
      console.error(
        `[nestjs-proxy] Error proxying to ${backendPath} after ${duration}ms:`,
        error
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: error.message || 'Failed to proxy request to backend',
          details: enableLogging ? { error: error.toString() } : undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 502 }
    );
  }
}

/**
 * Create a simple proxy handler for a specific backend path
 *
 * @param backendPath - Path on the NestJS backend
 * @param options - Optional proxy configuration
 * @returns Object with HTTP method handlers (GET, POST, etc.)
 */
export function createProxyHandler(
  backendPath: string,
  options?: Omit<ProxyOptions, 'backendPath'>
) {
  const proxyOptions: ProxyOptions = {
    backendPath,
    ...options,
  };

  return {
    GET: (request: NextRequest) => proxyToNestJS(request, proxyOptions),
    POST: (request: NextRequest) => proxyToNestJS(request, proxyOptions),
    PUT: (request: NextRequest) => proxyToNestJS(request, proxyOptions),
    PATCH: (request: NextRequest) => proxyToNestJS(request, proxyOptions),
    DELETE: (request: NextRequest) => proxyToNestJS(request, proxyOptions),
  };
}
