/**
 * Flag Evaluation Models
 *
 * These types represent the request and response for flag evaluation,
 * which is the hot path of the system.
 */

import { Environment } from './featureFlag.js';

export interface EvaluationRequest {
  flagKey: string;
  userId: string;
  environment: Environment;
}

export interface EvaluationResponse {
  flagKey: string;
  enabled: boolean;
  variant: string | null;
  experimentId?: string;
  variantId?: string;
  reason: EvaluationReason;
  evaluatedAt: string;
}

export type EvaluationReason =
  | 'FLAG_ENABLED_FULL_ROLLOUT'    // Flag enabled, 100% rollout
  | 'FLAG_ENABLED_IN_ROLLOUT'      // Flag enabled, user is in rollout percentage
  | 'FLAG_ENABLED_NOT_IN_ROLLOUT'  // Flag enabled, but user is outside rollout
  | 'FLAG_DISABLED'                // Flag exists but is disabled
  | 'FLAG_NOT_FOUND'               // Flag doesn't exist (fail-safe: disabled)
  | 'ERROR';                       // Evaluation error (fail-safe: disabled)

/**
 * Default response when a flag cannot be evaluated
 * Fail-safe: always return disabled
 */
export function createDefaultResponse(flagKey: string, reason: EvaluationReason): EvaluationResponse {
  return {
    flagKey,
    enabled: false,
    variant: null,
    reason,
    evaluatedAt: new Date().toISOString(),
  };
}
