import { Environment } from '../models/featureFlag.js';
import {
  EvaluationRequest,
  EvaluationResponse,
  EvaluationReason,
  createDefaultResponse,
} from '../models/evaluation.js';
import { featureFlagRepository } from '../repositories/featureFlagRepository.js';
import { isInRollout } from '../utils/hashing.js';
import { logger } from '../utils/logger.js';

/**
 * Flag Evaluation Service
 *
 * This is the HOT PATH of the system. Design priorities:
 * 1. Fast response time (<200ms target)
 * 2. Fail-safe behavior (return disabled on error)
 * 3. Deterministic results (same user always gets same result)
 * 4. Clear reasoning for debugging
 */
export class EvaluationService {
  /**
   * Evaluate a feature flag for a specific user.
   *
   * Algorithm:
   * 1. Look up flag by key + environment
   * 2. If not found → return disabled (fail-safe)
   * 3. If disabled → return disabled
   * 4. If enabled:
   *    a. 100% rollout → return enabled
   *    b. 0% rollout → return disabled
   *    c. Otherwise → hash(userId + flagKey) % 100 < rollout_percentage
   *
   * @param request - The evaluation request containing flagKey, userId, environment
   * @returns EvaluationResponse with enabled status and reason
   */
  async evaluate(request: EvaluationRequest): Promise<EvaluationResponse> {
    const startTime = Date.now();

    try {
      const { flagKey, userId, environment } = request;

      // Look up the flag
      const flag = await featureFlagRepository.findByKey(flagKey, environment);

      // Flag not found - fail safe
      if (!flag) {
        logger.debug('Flag not found', { flagKey, environment });
        return createDefaultResponse(flagKey, 'FLAG_NOT_FOUND');
      }

      // Flag is disabled
      if (!flag.enabled) {
        logger.debug('Flag is disabled', { flagKey });
        return this.createResponse(flagKey, false, 'FLAG_DISABLED');
      }

      // Flag is enabled - check rollout percentage
      const { rolloutPercentage } = flag;

      // 100% rollout - everyone gets it
      if (rolloutPercentage >= 100) {
        return this.createResponse(flagKey, true, 'FLAG_ENABLED_FULL_ROLLOUT');
      }

      // 0% rollout - no one gets it
      if (rolloutPercentage <= 0) {
        return this.createResponse(flagKey, false, 'FLAG_ENABLED_NOT_IN_ROLLOUT');
      }

      // Partial rollout - use deterministic hash
      const inRollout = isInRollout(userId, flagKey, rolloutPercentage);

      if (inRollout) {
        return this.createResponse(flagKey, true, 'FLAG_ENABLED_IN_ROLLOUT');
      } else {
        return this.createResponse(flagKey, false, 'FLAG_ENABLED_NOT_IN_ROLLOUT');
      }
    } catch (error) {
      logger.error('Evaluation error', { error, request });
      return createDefaultResponse(request.flagKey, 'ERROR');
    } finally {
      const duration = Date.now() - startTime;
      logger.debug('Evaluation completed', {
        flagKey: request.flagKey,
        userId: request.userId,
        durationMs: duration,
      });
    }
  }

  /**
   * Batch evaluate multiple flags for a user.
   * Useful for client SDKs that need all flags at once.
   */
  async evaluateBatch(
    flagKeys: string[],
    userId: string,
    environment: Environment
  ): Promise<EvaluationResponse[]> {
    const results = await Promise.all(
      flagKeys.map((flagKey) =>
        this.evaluate({ flagKey, userId, environment })
      )
    );

    return results;
  }

  /**
   * Evaluate all flags for a user in an environment.
   * Returns a map of flagKey → enabled status.
   */
  async evaluateAll(
    userId: string,
    environment: Environment
  ): Promise<Record<string, EvaluationResponse>> {
    const flags = await featureFlagRepository.findAll(environment);

    const results = await Promise.all(
      flags.map((flag) =>
        this.evaluate({ flagKey: flag.key, userId, environment })
      )
    );

    const resultMap: Record<string, EvaluationResponse> = {};
    for (const result of results) {
      resultMap[result.flagKey] = result;
    }

    return resultMap;
  }

  private createResponse(
    flagKey: string,
    enabled: boolean,
    reason: EvaluationReason
  ): EvaluationResponse {
    return {
      flagKey,
      enabled,
      variant: null, // Will be used when experiments are implemented
      reason,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const evaluationService = new EvaluationService();
