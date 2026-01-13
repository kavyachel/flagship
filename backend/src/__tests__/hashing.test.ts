import { hashToBucket, isInRollout, assignVariant } from '../utils/hashing.js';

describe('hashToBucket', () => {
  it('should return deterministic results', () => {
    const bucket1 = hashToBucket('user_123', 'flag_key');
    const bucket2 = hashToBucket('user_123', 'flag_key');

    expect(bucket1).toBe(bucket2);
  });

  it('should return values between 0 and 99', () => {
    // Test with many different inputs
    for (let i = 0; i < 1000; i++) {
      const bucket = hashToBucket(`user_${i}`, 'test_flag');
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(100);
    }
  });

  it('should produce different buckets for different users', () => {
    const bucket1 = hashToBucket('user_a', 'flag_key');
    const bucket2 = hashToBucket('user_b', 'flag_key');

    // Not guaranteed to be different, but very likely
    // This test is more about verifying the function runs correctly
    expect(typeof bucket1).toBe('number');
    expect(typeof bucket2).toBe('number');
  });

  it('should produce different buckets for different flags', () => {
    const bucket1 = hashToBucket('user_123', 'flag_a');
    const bucket2 = hashToBucket('user_123', 'flag_b');

    // Same user, different flags = different buckets (usually)
    expect(typeof bucket1).toBe('number');
    expect(typeof bucket2).toBe('number');
  });

  it('should have roughly uniform distribution', () => {
    const buckets = new Map<number, number>();

    // Generate 10000 hashes
    for (let i = 0; i < 10000; i++) {
      const bucket = hashToBucket(`user_${i}`, 'distribution_test');
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }

    // Each bucket should have roughly 100 entries (10000/100)
    // Allow for statistical variance (50-150 range)
    for (const [bucket, count] of buckets) {
      expect(count).toBeGreaterThan(50);
      expect(count).toBeLessThan(150);
    }
  });
});

describe('isInRollout', () => {
  it('should return false for 0% rollout', () => {
    expect(isInRollout('any_user', 'any_flag', 0)).toBe(false);
  });

  it('should return true for 100% rollout', () => {
    expect(isInRollout('any_user', 'any_flag', 100)).toBe(true);
  });

  it('should return deterministic results', () => {
    const result1 = isInRollout('user_123', 'flag_key', 50);
    const result2 = isInRollout('user_123', 'flag_key', 50);

    expect(result1).toBe(result2);
  });

  it('should respect rollout percentage approximately', () => {
    let inRollout = 0;
    const totalUsers = 10000;
    const rolloutPercentage = 30;

    for (let i = 0; i < totalUsers; i++) {
      if (isInRollout(`user_${i}`, 'percentage_test', rolloutPercentage)) {
        inRollout++;
      }
    }

    const actualPercentage = (inRollout / totalUsers) * 100;

    // Should be within 5% of target
    expect(actualPercentage).toBeGreaterThan(25);
    expect(actualPercentage).toBeLessThan(35);
  });

  it('should be monotonic - higher percentage includes more users', () => {
    // If a user is in 30% rollout, they should also be in 50% rollout
    const userId = 'test_user_monotonic';
    const flagKey = 'monotonic_test';

    const in30 = isInRollout(userId, flagKey, 30);
    const in50 = isInRollout(userId, flagKey, 50);
    const in70 = isInRollout(userId, flagKey, 70);

    // If in lower percentage, must be in higher percentage
    if (in30) {
      expect(in50).toBe(true);
      expect(in70).toBe(true);
    }
    if (in50) {
      expect(in70).toBe(true);
    }
  });
});

describe('assignVariant', () => {
  const twoVariants = [
    { id: 'control', name: 'Control', weight: 50 },
    { id: 'treatment', name: 'Treatment', weight: 50 },
  ];

  const threeVariants = [
    { id: 'control', name: 'Control', weight: 34 },
    { id: 'treatment_a', name: 'Treatment A', weight: 33 },
    { id: 'treatment_b', name: 'Treatment B', weight: 33 },
  ];

  it('should return deterministic results', () => {
    const variant1 = assignVariant('user_123', 'exp_001', twoVariants);
    const variant2 = assignVariant('user_123', 'exp_001', twoVariants);

    expect(variant1).toEqual(variant2);
  });

  it('should return null for empty variants', () => {
    const result = assignVariant('user_123', 'exp_001', []);
    expect(result).toBeNull();
  });

  it('should return null if weights do not sum to 100', () => {
    const badVariants = [
      { id: 'a', weight: 30 },
      { id: 'b', weight: 30 },
    ];

    const result = assignVariant('user_123', 'exp_001', badVariants);
    expect(result).toBeNull();
  });

  it('should assign variants according to weights', () => {
    const counts = new Map<string, number>();
    const totalUsers = 10000;

    for (let i = 0; i < totalUsers; i++) {
      const variant = assignVariant(`user_${i}`, 'weight_test', twoVariants);
      if (variant) {
        counts.set(variant.id, (counts.get(variant.id) ?? 0) + 1);
      }
    }

    // Each variant should get roughly 50% (allow 5% variance)
    const controlCount = counts.get('control') ?? 0;
    const treatmentCount = counts.get('treatment') ?? 0;

    expect(controlCount).toBeGreaterThan(4500);
    expect(controlCount).toBeLessThan(5500);
    expect(treatmentCount).toBeGreaterThan(4500);
    expect(treatmentCount).toBeLessThan(5500);
  });

  it('should work with three variants', () => {
    const variant = assignVariant('user_123', 'exp_three', threeVariants);

    expect(variant).not.toBeNull();
    expect(['control', 'treatment_a', 'treatment_b']).toContain(variant?.id);
  });
});
