/**
 * World-Class Device Fingerprinting Utility
 *
 * Uses industry-standard FingerprintJS library for authentication security.
 * Provides unique browser/device identification for:
 * - Login flows (password + SSO)
 * - Registration
 * - Session validation
 * - Suspicious activity detection
 * - Fraud prevention
 *
 * FingerprintJS provides 99.5% accuracy with advanced techniques:
 * - Canvas fingerprinting
 * - WebGL fingerprinting
 * - Audio fingerprinting
 * - Font detection
 * - Hardware concurrency
 * - Screen parameters
 * - Browser plugins
 * - And 50+ other signals
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

// ============================================================================
// Types
// ============================================================================

export interface DeviceFingerprint {
  visitorId: string;                    // Unique visitor identifier (primary)
  requestId: string;                    // Request identifier
  confidence: {
    score: number;                      // Confidence score (0-1)
    comment?: string;                   // Additional info
  };
  components: Record<string, any>;      // Raw fingerprint components
  timestamp: number;                    // Generation timestamp
}

export interface FingerprintResult {
  fingerprintId: string;                // Main fingerprint ID (visitorId)
  requestId: string;                    // Request ID
  confidenceScore: number;              // Confidence score (0-1)
  timestamp: number;                    // Timestamp
  components: Record<string, any>;      // Raw components for debugging
}

export interface FingerprintOptions {
  extendedResult?: boolean;             // Get extended component details
  debug?: boolean;                      // Enable debug mode
}

// ============================================================================
// FingerprintJS Agent (Singleton)
// ============================================================================

let fpAgent: any = null;
let fpAgentPromise: Promise<any> | null = null;

/**
 * Get or initialize FingerprintJS agent (singleton)
 */
async function getFingerprintAgent() {
  // Return existing agent if already loaded
  if (fpAgent) {
    return fpAgent;
  }

  // Return existing promise if loading
  if (fpAgentPromise) {
    return fpAgentPromise;
  }

  // Load FingerprintJS agent
  fpAgentPromise = FingerprintJS.load({
    monitoring: false, // Disable monitoring in production
  });

  try {
    fpAgent = await fpAgentPromise;
    return fpAgent;
  } catch (error) {
    console.error('[FingerprintJS] Failed to load agent:', error);
    fpAgentPromise = null; // Reset promise so we can retry
    throw error;
  }
}

// ============================================================================
// Core Fingerprinting Functions
// ============================================================================

/**
 * Generate device fingerprint using FingerprintJS
 *
 * This is the primary function for generating fingerprints.
 * Returns a unique visitorId that identifies the browser/device.
 *
 * @param options - Fingerprint options
 * @returns Fingerprint result with visitorId and confidence
 */
export async function generateDeviceFingerprint(
  options: FingerprintOptions = {}
): Promise<FingerprintResult> {
  try {
    // Get FingerprintJS agent
    const agent = await getFingerprintAgent();

    // Generate fingerprint
    const result = await agent.get({
      extendedResult: options.extendedResult || false,
    });

    if (options.debug) {
      console.log('[FingerprintJS] Result:', result);
    }

    // Extract fingerprint data
    const fingerprint: FingerprintResult = {
      fingerprintId: result.visitorId,
      requestId: result.requestId,
      confidenceScore: result.confidence?.score || 0,
      timestamp: Date.now(),
      components: result.components || {},
    };

    return fingerprint;
  } catch (error) {
    console.error('[FingerprintJS] Generation failed:', error);
    throw new Error('Failed to generate device fingerprint');
  }
}

/**
 * Get fingerprint ID only (simplified)
 *
 * Convenience function that returns only the fingerprint ID string.
 * Use this when you don't need the full result object.
 *
 * @returns Fingerprint ID string
 */
export async function getFingerprintId(): Promise<string> {
  const result = await generateDeviceFingerprint();
  return result.fingerprintId;
}

/**
 * Get fingerprint with extended components
 *
 * Returns fingerprint with detailed component breakdown.
 * Useful for debugging or analyzing fingerprint composition.
 *
 * @returns Extended fingerprint result
 */
export async function getExtendedFingerprint(): Promise<FingerprintResult> {
  return generateDeviceFingerprint({ extendedResult: true });
}

// ============================================================================
// Caching Layer
// ============================================================================

let cachedFingerprint: FingerprintResult | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached fingerprint (5-minute cache)
 *
 * Use this for performance optimization. The fingerprint is cached
 * for 5 minutes to avoid unnecessary regeneration during a session.
 *
 * @returns Cached or fresh fingerprint result
 */
export async function getCachedFingerprint(): Promise<FingerprintResult> {
  const now = Date.now();

  // Return cached fingerprint if still valid
  if (cachedFingerprint && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedFingerprint;
  }

  // Generate new fingerprint
  cachedFingerprint = await generateDeviceFingerprint();
  cacheTimestamp = now;

  return cachedFingerprint;
}

/**
 * Get cached fingerprint ID only
 *
 * Convenience function that returns only the cached fingerprint ID.
 *
 * @returns Cached fingerprint ID
 */
export async function getCachedFingerprintId(): Promise<string> {
  const result = await getCachedFingerprint();
  return result.fingerprintId;
}

/**
 * Clear fingerprint cache
 *
 * Call this after logout or when you want to force regeneration.
 */
export function clearFingerprintCache(): void {
  cachedFingerprint = null;
  cacheTimestamp = 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate fingerprint format
 *
 * Checks if a fingerprint ID is valid (non-empty string).
 *
 * @param fingerprintId - Fingerprint ID to validate
 * @returns True if valid
 */
export function isValidFingerprint(fingerprintId: string | null | undefined): boolean {
  return typeof fingerprintId === 'string' && fingerprintId.length > 0;
}

/**
 * Get fingerprint confidence level
 *
 * Converts confidence score to human-readable level.
 *
 * @param score - Confidence score (0-1)
 * @returns Confidence level
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

/**
 * Check if fingerprint is reliable
 *
 * Returns true if confidence score is >= 0.5 (medium or high).
 *
 * @param result - Fingerprint result
 * @returns True if reliable
 */
export function isFingerprintReliable(result: FingerprintResult): boolean {
  return result.confidenceScore >= 0.5;
}

// ============================================================================
// Browser Compatibility Check
// ============================================================================

/**
 * Check if browser supports fingerprinting
 *
 * FingerprintJS works in all modern browsers, but this checks
 * if we're in a browser environment (not SSR).
 *
 * @returns True if supported
 */
export function isFingerprintingSupported(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Get fallback fingerprint
 *
 * Returns a basic fallback fingerprint when FingerprintJS fails.
 * Uses simple browser characteristics.
 *
 * WARNING: This is NOT secure and should only be used as a fallback.
 *
 * @returns Fallback fingerprint result
 */
export async function getFallbackFingerprint(): Promise<FingerprintResult> {
  console.warn('[FingerprintJS] Using fallback fingerprint (not secure)');

  // Generate simple hash from browser characteristics
  const userAgent = navigator.userAgent || 'unknown';
  const language = navigator.language || 'unknown';
  const platform = navigator.platform || 'unknown';
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fallbackString = `${userAgent}-${language}-${platform}-${screenResolution}-${timezone}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fallbackString.length; i++) {
    const char = fallbackString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const fallbackId = `fallback-${Math.abs(hash).toString(16)}`;

  return {
    fingerprintId: fallbackId,
    requestId: `fallback-${Date.now()}`,
    confidenceScore: 0.1, // Very low confidence
    timestamp: Date.now(),
    components: {
      userAgent,
      language,
      platform,
      screenResolution,
      timezone,
      isFallback: true,
    },
  };
}

/**
 * Get fingerprint with automatic fallback
 *
 * Tries to use FingerprintJS, falls back to basic fingerprint on error.
 *
 * @returns Fingerprint result (FingerprintJS or fallback)
 */
export async function getFingerprintWithFallback(): Promise<FingerprintResult> {
  try {
    return await generateDeviceFingerprint();
  } catch (error) {
    console.error('[FingerprintJS] Failed, using fallback:', error);
    return await getFallbackFingerprint();
  }
}

// ============================================================================
// Export for backward compatibility
// ============================================================================

export type { DeviceFingerprint as DeviceFingerprintComponents };
