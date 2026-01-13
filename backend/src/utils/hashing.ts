import { createHash } from 'crypto';

/**
 * Deterministic Hashing Utility
 *
 * This module provides deterministic hashing for feature flag rollouts
 * and experiment variant assignment. The key properties are:
 *
 * 1. DETERMINISTIC: Same inputs always produce the same output
 * 2. UNIFORM: Hash values are evenly distributed across the range
 * 3. CONSISTENT: A user's assignment doesn't change unless inputs change
 *
 * Algorithm:
 * - Use SHA-256 to hash the concatenated inputs
 * - Take the first 8 bytes of the hash
 * - Convert to a number and mod by the desired range
 *
 * This ensures that:
 * - user123 + flag_checkout_redesign always gets the same bucket
 * - Changing the flag key changes the user's bucket (independent rollouts)
 * - The distribution is uniform across all 100 buckets
 */

/**
 * Generate a deterministic hash bucket (0-99) for a user and identifier.
 *
 * @param userId - The user identifier (must be stable per user)
 * @param identifier - The flag key or experiment ID
 * @returns A number between 0 and 99 (inclusive)
 *
 * @example
 * // Feature flag rollout
 * const bucket = hashToBucket('user_123', 'checkout_redesign');
 * const isEnabled = bucket < rolloutPercentage;
 *
 * @example
 * // Experiment variant assignment
 * const bucket = hashToBucket('user_123', experimentId);
 * // Map bucket to variant based on cumulative weights
 */
export function hashToBucket(userId: string, identifier: string): number {
  // Concatenate with a separator to avoid collisions
  // e.g., "user1" + "23" vs "user12" + "3"
  const input = `${userId}:${identifier}`;

  // Create SHA-256 hash
  const hash = createHash('sha256').update(input).digest();

  // Take first 4 bytes and convert to unsigned 32-bit integer
  // This gives us a number between 0 and 4,294,967,295
  const hashValue = hash.readUInt32BE(0);

  // Mod by 100 to get bucket 0-99
  return hashValue % 100;
}

/**
 * Check if a user should be included in a rollout based on percentage.
 *
 * @param userId - The user identifier
 * @param flagKey - The feature flag key
 * @param rolloutPercentage - The percentage of users to include (0-100)
 * @returns true if the user should see the feature
 *
 * @example
 * // 50% rollout
 * if (isInRollout('user_123', 'new_checkout', 50)) {
 *   // Show new checkout
 * }
 */
export function isInRollout(
  userId: string,
  flagKey: string,
  rolloutPercentage: number
): boolean {
  // Edge cases
  if (rolloutPercentage <= 0) return false;
  if (rolloutPercentage >= 100) return true;

  const bucket = hashToBucket(userId, flagKey);
  return bucket < rolloutPercentage;
}

/**
 * Assign a user to an experiment variant based on weights.
 *
 * @param userId - The user identifier
 * @param experimentId - The experiment identifier
 * @param variants - Array of variants with their weights (must sum to 100)
 * @returns The assigned variant, or null if weights don't sum to 100
 *
 * @example
 * const variant = assignVariant('user_123', 'exp_001', [
 *   { id: 'control', name: 'Control', weight: 50 },
 *   { id: 'treatment', name: 'Treatment', weight: 50 }
 * ]);
 */
export function assignVariant<T extends { weight: number }>(
  userId: string,
  experimentId: string,
  variants: T[]
): T | null {
  if (variants.length === 0) return null;

  // Validate weights sum to 100
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight !== 100) {
    return null;
  }

  const bucket = hashToBucket(userId, experimentId);

  // Find variant by cumulative weight
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant (shouldn't happen if weights sum to 100)
  return variants[variants.length - 1] ?? null;
}

/**
 * Generate a hash string for debugging/logging purposes.
 * This is NOT used for bucketing - just for visibility.
 */
export function getHashDebugInfo(userId: string, identifier: string): {
  input: string;
  bucket: number;
  hashHex: string;
} {
  const input = `${userId}:${identifier}`;
  const hash = createHash('sha256').update(input).digest();

  return {
    input,
    bucket: hash.readUInt32BE(0) % 100,
    hashHex: hash.toString('hex').substring(0, 16), // First 16 chars
  };
}
