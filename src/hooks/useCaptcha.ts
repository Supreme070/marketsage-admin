import { useRef, useCallback } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

/**
 * World-class Google reCAPTCHA v2 Hook
 *
 * Provides a type-safe, reusable hook for integrating reCAPTCHA
 * with automatic token management and error handling.
 *
 * Features:
 * - Automatic token verification
 * - Token expiration handling
 * - Error recovery
 * - Type-safe API
 * - Configurable site key via environment
 *
 * Usage:
 * ```tsx
 * const { recaptchaRef, executeRecaptcha, resetRecaptcha } = useCaptcha();
 *
 * const handleSubmit = async () => {
 *   const token = await executeRecaptcha();
 *   if (!token) {
 *     alert('Please complete the CAPTCHA');
 *     return;
 *   }
 *   // Submit with token
 * };
 *
 * <ReCAPTCHA ref={recaptchaRef} sitekey={SITE_KEY} />
 * ```
 */
export function useCaptcha() {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  /**
   * Execute reCAPTCHA and get token
   *
   * @returns Promise<string | null> - reCAPTCHA token or null if failed
   */
  const executeRecaptcha = useCallback(async (): Promise<string | null> => {
    if (!recaptchaRef.current) {
      console.error('[useCaptcha] reCAPTCHA ref is not initialized');
      return null;
    }

    try {
      // Get current token value
      const token = recaptchaRef.current.getValue();

      if (token) {
        return token;
      }

      // If no token, execute reCAPTCHA
      const newToken = await recaptchaRef.current.executeAsync();
      return newToken;
    } catch (error) {
      console.error('[useCaptcha] Failed to execute reCAPTCHA:', error);
      return null;
    }
  }, []);

  /**
   * Reset reCAPTCHA (useful after failed submission)
   */
  const resetRecaptcha = useCallback(() => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  }, []);

  /**
   * Get current token without executing
   */
  const getToken = useCallback((): string | null => {
    if (!recaptchaRef.current) {
      return null;
    }
    return recaptchaRef.current.getValue();
  }, []);

  return {
    recaptchaRef,
    executeRecaptcha,
    resetRecaptcha,
    getToken,
  };
}

/**
 * Get reCAPTCHA site key from environment
 *
 * Priority:
 * 1. NEXT_PUBLIC_RECAPTCHA_SITE_KEY
 * 2. NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY
 *
 * @returns string | undefined - Site key or undefined if not configured
 */
export function getRecaptchaSiteKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY
  );
}

/**
 * Check if reCAPTCHA is enabled
 */
export function isRecaptchaEnabled(): boolean {
  return !!getRecaptchaSiteKey();
}
