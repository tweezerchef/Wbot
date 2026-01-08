/**
 * Test fixture techniques for BreathingExercise tests
 * Short durations make tests run faster
 */

import type { BreathingTechnique } from '../../../../types';

/** Short technique for faster tests - 1 second per phase */
export const testTechniqueShort: BreathingTechnique = {
  id: 'test_short',
  name: 'Test Short',
  durations: [1, 1, 1, 1],
  description: 'Short technique for testing',
  cycles: 2,
};

/** Technique with zero-duration phases (tests skip logic) */
export const testTechniqueWithZeros: BreathingTechnique = {
  id: 'test_zeros',
  name: 'Test With Zeros',
  durations: [2, 0, 2, 0], // No hold phases
  description: 'Technique with zero-duration holds',
  cycles: 2,
};

/** Technique with all zero-duration hold phases */
export const testTechniqueAllZeroHolds: BreathingTechnique = {
  id: 'test_all_zero_holds',
  name: 'Test All Zero Holds',
  durations: [1, 0, 0, 0], // Only inhale has duration
  description: 'Test multiple consecutive zero-duration phases',
  cycles: 2,
};

/** Standard box breathing for comparison */
export const testTechniqueBox: BreathingTechnique = {
  id: 'test_box',
  name: 'Test Box',
  durations: [4, 4, 4, 4],
  description: 'Standard box breathing',
  cycles: 4,
};

/** Very short technique for testing rapid cycles */
export const testTechniqueVeryShort: BreathingTechnique = {
  id: 'test_very_short',
  name: 'Test Very Short',
  durations: [0.5, 0.5, 0.5, 0.5],
  description: 'Very short for rapid testing',
  cycles: 1,
};

/** Single cycle technique */
export const testTechniqueSingleCycle: BreathingTechnique = {
  id: 'test_single',
  name: 'Test Single Cycle',
  durations: [1, 1, 1, 1],
  description: 'Single cycle for completion testing',
  cycles: 1,
};
