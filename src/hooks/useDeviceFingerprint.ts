'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  generateDeviceFingerprint,
  getCachedFingerprint,
  getCachedFingerprintId,
  getFingerprintWithFallback,
  clearFingerprintCache,
  isValidFingerprint,
  getConfidenceLevel,
  isFingerprintReliable,
  type FingerprintResult,
} from '@/lib/security/device-fingerprint';

// ============================================================================
// Types
// ============================================================================

export interface UseFingerprintOptions {
  /**
   * Auto-generate fingerprint on mount
   * @default true
   */
  autoGenerate?: boolean;

  /**
   * Use cached fingerprint (5-minute cache)
   * @default true
   */
  useCached?: boolean;

  /**
   * Use fallback fingerprint if FingerprintJS fails
   * @default true
   */
  useFallback?: boolean;

  /**
   * Get extended fingerprint components
   * @default false
   */
  extendedResult?: boolean;

  /**
   * Callback when fingerprint is generated
   */
  onGenerated?: (result: FingerprintResult) => void;

  /**
   * Callback when fingerprint generation fails
   */
  onError?: (error: Error) => void;
}

export interface UseFingerprintResult {
  /** Full fingerprint result */
  fingerprint: FingerprintResult | null;

  /** Fingerprint ID (visitorId) - use this for authentication */
  fingerprintId: string | null;

  /** Request ID */
  requestId: string | null;

  /** Confidence score (0-1) */
  confidenceScore: number | null;

  /** Confidence level (high/medium/low) */
  confidenceLevel: 'high' | 'medium' | 'low' | null;

  /** Is fingerprint reliable? (confidence >= 0.5) */
  isReliable: boolean;

  /** Loading state */
  loading: boolean;

  /** Error message */
  error: string | null;

  /** Regenerate fingerprint (force fresh) */
  regenerate: () => Promise<void>;

  /** Clear fingerprint cache */
  clearCache: () => void;
}

// ============================================================================
// Hook: useDeviceFingerprint
// ============================================================================

/**
 * World-Class Device Fingerprinting Hook (FingerprintJS)
 *
 * Automatically generates device fingerprint on mount using FingerprintJS.
 * Provides 99.5% accuracy with advanced browser fingerprinting techniques.
 *
 * **Use Cases:**
 * - Login authentication (detect suspicious logins)
 * - Registration (prevent duplicate accounts)
 * - Session validation (detect session hijacking)
 * - Fraud detection (identify malicious users)
 *
 * **Example Usage:**
 * ```tsx
 * const { fingerprintId, loading, isReliable } = useDeviceFingerprint();
 *
 * const onSubmit = async (data) => {
 *   if (!isReliable) {
 *     console.warn('Fingerprint confidence is low');
 *   }
 *   await login({ ...data, deviceFingerprint: fingerprintId });
 * };
 * ```
 *
 * @param options - Configuration options
 * @returns Fingerprint state and actions
 */
export function useDeviceFingerprint(
  options: UseFingerprintOptions = {}
): UseFingerprintResult {
  const {
    autoGenerate = true,
    useCached = true,
    useFallback = true,
    extendedResult = false,
    onGenerated,
    onError,
  } = options;

  const [fingerprint, setFingerprint] = useState<FingerprintResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate fingerprint
   */
  const generate = useCallback(async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: FingerprintResult;

      // Use cached or fresh fingerprint
      if (useCached) {
        result = await getCachedFingerprint();
      } else {
        result = await generateDeviceFingerprint({ extendedResult });
      }

      setFingerprint(result);

      // Call success callback
      if (onGenerated) {
        onGenerated(result);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate device fingerprint';
      setError(errorMsg);
      console.error('[useDeviceFingerprint] Error:', err);

      // Try fallback if enabled
      if (useFallback) {
        try {
          const fallbackResult = await getFingerprintWithFallback();
          setFingerprint(fallbackResult);

          if (onGenerated) {
            onGenerated(fallbackResult);
          }
        } catch (fallbackErr: any) {
          console.error('[useDeviceFingerprint] Fallback failed:', fallbackErr);

          // Call error callback
          if (onError) {
            onError(fallbackErr);
          }
        }
      } else {
        // Call error callback
        if (onError) {
          onError(err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [useCached, extendedResult, useFallback, onGenerated, onError]);

  /**
   * Regenerate fingerprint (force fresh)
   */
  const regenerate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateDeviceFingerprint({ extendedResult });
      setFingerprint(result);

      if (onGenerated) {
        onGenerated(result);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to regenerate device fingerprint';
      setError(errorMsg);
      console.error('[useDeviceFingerprint] Regenerate error:', err);

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [extendedResult, onGenerated, onError]);

  /**
   * Clear fingerprint cache
   */
  const clearCache = useCallback(() => {
    clearFingerprintCache();
    setFingerprint(null);
  }, []);

  /**
   * Auto-generate on mount
   */
  useEffect(() => {
    if (autoGenerate) {
      generate();
    }
  }, [autoGenerate, generate]);

  // Compute derived values
  const fingerprintId = fingerprint?.fingerprintId || null;
  const confidenceScore = fingerprint?.confidenceScore || null;
  const confidenceLevel = confidenceScore !== null ? getConfidenceLevel(confidenceScore) : null;
  const isReliable = fingerprint ? isFingerprintReliable(fingerprint) : false;

  return {
    fingerprint,
    fingerprintId,
    requestId: fingerprint?.requestId || null,
    confidenceScore,
    confidenceLevel,
    isReliable,
    loading,
    error,
    regenerate,
    clearCache,
  };
}

// ============================================================================
// Hook: useDeviceFingerprintOnce
// ============================================================================

/**
 * Simplified hook that returns only the fingerprint ID
 *
 * Use this for common use case where you only need the fingerprint ID
 * for authentication without other details.
 *
 * **Example:**
 * ```tsx
 * const { fingerprintId, loading } = useDeviceFingerprintOnce();
 *
 * // Use in login/register
 * await login({ email, password, deviceFingerprint: fingerprintId });
 * ```
 */
export function useDeviceFingerprintOnce(): {
  fingerprintId: string | null;
  loading: boolean;
  error: string | null;
  isReliable: boolean;
} {
  const { fingerprintId, loading, error, isReliable } = useDeviceFingerprint({
    autoGenerate: true,
    useCached: true,
    useFallback: true,
  });

  return { fingerprintId, loading, error, isReliable };
}

// ============================================================================
// Hook: useDeviceFingerprintDetails
// ============================================================================

/**
 * Get detailed fingerprint information with components
 *
 * Useful for debugging or displaying device information to users.
 *
 * **Example:**
 * ```tsx
 * const { fingerprint, confidenceLevel, components } = useDeviceFingerprintDetails();
 *
 * return (
 *   <div>
 *     <p>Fingerprint ID: {fingerprint?.fingerprintId}</p>
 *     <p>Confidence: {confidenceLevel}</p>
 *     <p>Score: {fingerprint?.confidenceScore}</p>
 *     <pre>{JSON.stringify(components, null, 2)}</pre>
 *   </div>
 * );
 * ```
 */
export function useDeviceFingerprintDetails(): {
  fingerprint: FingerprintResult | null;
  confidenceLevel: 'high' | 'medium' | 'low' | null;
  components: Record<string, any> | null;
  loading: boolean;
  isReliable: boolean;
} {
  const { fingerprint, confidenceLevel, loading, isReliable } = useDeviceFingerprint({
    autoGenerate: true,
    useCached: true,
    extendedResult: true,
  });

  return {
    fingerprint,
    confidenceLevel,
    components: fingerprint?.components || null,
    loading,
    isReliable,
  };
}

// ============================================================================
// Hook: useDeviceFingerprintValidation
// ============================================================================

/**
 * Hook for validating fingerprints
 *
 * Useful for forms where you want to validate fingerprint before submission.
 *
 * **Example:**
 * ```tsx
 * const { isValid, isReliable, error } = useDeviceFingerprintValidation();
 *
 * const onSubmit = async (data) => {
 *   if (!isValid) {
 *     alert('Could not generate device fingerprint');
 *     return;
 *   }
 *   if (!isReliable) {
 *     console.warn('Low confidence fingerprint');
 *   }
 *   // Proceed with login...
 * };
 * ```
 */
export function useDeviceFingerprintValidation(): {
  fingerprintId: string | null;
  isValid: boolean;
  isReliable: boolean;
  error: string | null;
  loading: boolean;
} {
  const { fingerprintId, isReliable, error, loading } = useDeviceFingerprint({
    autoGenerate: true,
    useCached: true,
    useFallback: true,
  });

  const isValid = isValidFingerprint(fingerprintId);

  return {
    fingerprintId,
    isValid,
    isReliable,
    error,
    loading,
  };
}
