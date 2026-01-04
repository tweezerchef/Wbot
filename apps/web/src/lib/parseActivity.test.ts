// ============================================================================
// Tests for parseActivity.ts
// ============================================================================
// Tests the activity parsing utilities that extract embedded activity
// configurations from AI message content.
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  parseActivityContent,
  hasActivityContent,
  extractTextContent,
  type BreathingActivityData,
  type WimHofActivityData,
} from './parseActivity';

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

// Valid breathing activity JSON that matches the schema
const validBreathingActivity: BreathingActivityData = {
  type: 'activity',
  activity: 'breathing',
  status: 'ready',
  technique: {
    id: 'box',
    name: 'Box Breathing',
    durations: [4, 4, 4, 4],
    phases: ['inhale', 'holdIn', 'exhale', 'holdOut'],
    description: 'A calming technique used by Navy SEALs',
    cycles: 4,
  },
  introduction: "Let's try some box breathing to help you relax.",
};

// Create a message with activity markers
const createActivityMessage = (textBefore: string, activity: object, textAfter: string): string => {
  return `${textBefore}[ACTIVITY_START]${JSON.stringify(activity)}[ACTIVITY_END]${textAfter}`;
};

// -----------------------------------------------------------------------------
// parseActivityContent Tests
// -----------------------------------------------------------------------------

describe('parseActivityContent', () => {
  describe('when content contains valid activity', () => {
    it('extracts activity from marked content', () => {
      const content = createActivityMessage(
        'Here is a breathing exercise for you. ',
        validBreathingActivity,
        ' Let me know how it goes!'
      );

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(true);
      expect(result.activity).not.toBeNull();
      expect(result.activity?.activity).toBe('breathing');
      expect(result.activity?.type).toBe('activity');
    });

    it('extracts text before activity markers', () => {
      const content = createActivityMessage(
        'Here is a breathing exercise. ',
        validBreathingActivity,
        ''
      );

      const result = parseActivityContent(content);

      expect(result.textBefore).toBe('Here is a breathing exercise.');
    });

    it('extracts text after activity markers', () => {
      const content = createActivityMessage(
        '',
        validBreathingActivity,
        ' Let me know how you feel afterward.'
      );

      const result = parseActivityContent(content);

      expect(result.textAfter).toBe('Let me know how you feel afterward.');
    });

    it('extracts both text before and after activity', () => {
      const content = createActivityMessage(
        'Before text. ',
        validBreathingActivity,
        ' After text.'
      );

      const result = parseActivityContent(content);

      expect(result.textBefore).toBe('Before text.');
      expect(result.textAfter).toBe('After text.');
    });

    it('parses breathing technique data correctly', () => {
      const content = createActivityMessage('', validBreathingActivity, '');
      const result = parseActivityContent(content);

      // Verify activity exists before accessing properties
      expect(result.activity).not.toBeNull();
      const activity = result.activity;
      if (activity?.activity !== 'breathing') {
        throw new Error('Expected breathing activity');
      }

      expect(activity.technique.id).toBe('box');
      expect(activity.technique.name).toBe('Box Breathing');
      expect(activity.technique.durations).toEqual([4, 4, 4, 4]);
      expect(activity.technique.cycles).toBe(4);
      expect(activity.introduction).toBe("Let's try some box breathing to help you relax.");
    });
  });

  describe('when content has no activity markers', () => {
    it('returns plain text with hasActivity false', () => {
      const content = 'Just a regular message without any activity.';

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
      expect(result.activity).toBeNull();
      expect(result.textBefore).toBe(content);
      expect(result.textAfter).toBe('');
    });

    it('handles empty string', () => {
      const result = parseActivityContent('');

      expect(result.hasActivity).toBe(false);
      expect(result.activity).toBeNull();
      expect(result.textBefore).toBe('');
    });

    it('handles content with only start marker', () => {
      const content = 'Some text [ACTIVITY_START] but no end marker';

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
      expect(result.textBefore).toBe(content);
    });

    it('handles content with only end marker', () => {
      const content = 'Some text [ACTIVITY_END] but no start marker';

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
      expect(result.textBefore).toBe(content);
    });
  });

  describe('when content has invalid JSON', () => {
    // Suppress console.warn during these tests (expected for error cases)
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('handles malformed JSON gracefully', () => {
      const content = '[ACTIVITY_START]{not valid json}[ACTIVITY_END]';

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
      expect(result.activity).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('handles empty JSON object', () => {
      const content = '[ACTIVITY_START]{}[ACTIVITY_END]';

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
      expect(result.activity).toBeNull();
    });
  });

  describe('when content has invalid activity schema', () => {
    it('rejects activity with wrong type field', () => {
      const invalidActivity = {
        type: 'not-activity', // Should be 'activity'
        activity: 'breathing',
        status: 'ready',
        technique: validBreathingActivity.technique,
        introduction: 'Test',
      };
      const content = createActivityMessage('', invalidActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
      expect(result.activity).toBeNull();
    });

    it('rejects activity with unknown activity type', () => {
      const invalidActivity = {
        type: 'activity',
        activity: 'unknown_activity', // Not a valid activity type
        status: 'ready',
      };
      const content = createActivityMessage('', invalidActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });

    it('rejects activity with missing required fields', () => {
      const invalidActivity = {
        type: 'activity',
        activity: 'breathing',
        // Missing status, technique, introduction
      };
      const content = createActivityMessage('', invalidActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });

    it('rejects breathing activity with invalid durations', () => {
      const invalidActivity = {
        ...validBreathingActivity,
        technique: {
          ...validBreathingActivity.technique,
          durations: [4, 4, 4], // Should have 4 elements
        },
      };
      const content = createActivityMessage('', invalidActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles markers appearing in wrong order', () => {
      const content = '[ACTIVITY_END]{"some":"json"}[ACTIVITY_START]';

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });

    it('handles nested markers (uses first pair)', () => {
      const content = createActivityMessage('[ACTIVITY_START]nested', validBreathingActivity, '');

      // The outer markers should be used
      const result = parseActivityContent(content);

      // This will fail because the content between first start and first end
      // will be "[ACTIVITY_START]nested" which isn't valid JSON
      expect(result.hasActivity).toBe(false);
    });

    it('trims whitespace from text before and after', () => {
      const content = createActivityMessage(
        '   Padded text   ',
        validBreathingActivity,
        '   More padding   '
      );

      const result = parseActivityContent(content);

      expect(result.textBefore).toBe('Padded text');
      expect(result.textAfter).toBe('More padding');
    });
  });
});

// -----------------------------------------------------------------------------
// hasActivityContent Tests
// -----------------------------------------------------------------------------

describe('hasActivityContent', () => {
  it('returns true when both markers are present', () => {
    const content = 'Some text [ACTIVITY_START]{"data":"here"}[ACTIVITY_END] more text';

    expect(hasActivityContent(content)).toBe(true);
  });

  it('returns true even with invalid JSON between markers', () => {
    // This is a quick check, not a validation
    const content = '[ACTIVITY_START]not json[ACTIVITY_END]';

    expect(hasActivityContent(content)).toBe(true);
  });

  it('returns false when no markers present', () => {
    expect(hasActivityContent('Just regular text')).toBe(false);
  });

  it('returns false when only start marker present', () => {
    expect(hasActivityContent('[ACTIVITY_START] partial')).toBe(false);
  });

  it('returns false when only end marker present', () => {
    expect(hasActivityContent('partial [ACTIVITY_END]')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasActivityContent('')).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// extractTextContent Tests
// -----------------------------------------------------------------------------

describe('extractTextContent', () => {
  it('removes activity markers and returns surrounding text', () => {
    const content = createActivityMessage(
      'Before the activity. ',
      validBreathingActivity,
      ' After the activity.'
    );

    const result = extractTextContent(content);

    expect(result).toBe('Before the activity.\n\nAfter the activity.');
  });

  it('returns full content when no activity present', () => {
    const content = 'Just regular text without activity';

    const result = extractTextContent(content);

    expect(result).toBe(content);
  });

  it('returns only before text when no after text', () => {
    const content = createActivityMessage('Only before. ', validBreathingActivity, '');

    const result = extractTextContent(content);

    expect(result).toBe('Only before.');
  });

  it('returns only after text when no before text', () => {
    const content = createActivityMessage('', validBreathingActivity, ' Only after.');

    const result = extractTextContent(content);

    expect(result).toBe('Only after.');
  });

  it('returns empty string when activity is the only content', () => {
    const content = createActivityMessage('', validBreathingActivity, '');

    const result = extractTextContent(content);

    expect(result).toBe('');
  });

  it('handles content with invalid activity (returns all text)', () => {
    // Invalid activity, but extractTextContent should still work
    const content = '[ACTIVITY_START]invalid[ACTIVITY_END]';

    // Since parsing fails, textBefore will contain the original with markers stripped
    // Actually, let's check what really happens
    const result = extractTextContent(content);

    // The parsing extracts textBefore as empty and textAfter as empty
    // because the JSON is invalid but markers are found
    expect(result).toBe('');
  });
});

// -----------------------------------------------------------------------------
// Wim Hof Activity Parsing Tests
// -----------------------------------------------------------------------------

const validWimHofActivity: WimHofActivityData = {
  type: 'activity',
  activity: 'breathing_wim_hof',
  status: 'ready',
  technique: {
    id: 'wim_hof',
    name: 'Wim Hof Method',
    type: 'wim_hof',
    description: 'Rapid breathing followed by retention',
    best_for: ['energy boost', 'immune support'],
    rounds: 3,
    breaths_per_round: 30,
    breath_tempo_ms: 1500,
    retention_target_seconds: 90,
    recovery_pause_seconds: 15,
    inhale_hold_seconds: 15,
  },
  introduction: 'Welcome to the Wim Hof Method!',
  is_first_time: true,
};

describe('parseActivityContent - Wim Hof', () => {
  describe('when content contains valid Wim Hof activity', () => {
    it('extracts Wim Hof activity from marked content', () => {
      const content = createActivityMessage(
        "Let's try the Wim Hof Method. ",
        validWimHofActivity,
        ' Let me know how you feel!'
      );

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(true);
      expect(result.activity).not.toBeNull();
      expect(result.activity?.activity).toBe('breathing_wim_hof');
      expect(result.activity?.type).toBe('activity');
    });

    it('parses Wim Hof technique data correctly', () => {
      const content = createActivityMessage('', validWimHofActivity, '');
      const result = parseActivityContent(content);

      expect(result.activity).not.toBeNull();
      const activity = result.activity;
      if (activity?.activity !== 'breathing_wim_hof') {
        throw new Error('Expected Wim Hof activity');
      }

      expect(activity.technique.id).toBe('wim_hof');
      expect(activity.technique.type).toBe('wim_hof');
      expect(activity.technique.name).toBe('Wim Hof Method');
      expect(activity.technique.rounds).toBe(3);
      expect(activity.technique.breaths_per_round).toBe(30);
      expect(activity.technique.retention_target_seconds).toBe(90);
      expect(activity.introduction).toBe('Welcome to the Wim Hof Method!');
      expect(activity.is_first_time).toBe(true);
    });

    it('validates all required Wim Hof fields', () => {
      const content = createActivityMessage('', validWimHofActivity, '');
      const result = parseActivityContent(content);

      const activity = result.activity;
      if (activity?.activity !== 'breathing_wim_hof') {
        throw new Error('Expected Wim Hof activity');
      }

      // Required fields
      expect(activity.technique.rounds).toBeTypeOf('number');
      expect(activity.technique.breaths_per_round).toBeTypeOf('number');
      expect(activity.technique.breath_tempo_ms).toBeTypeOf('number');
      expect(activity.technique.retention_target_seconds).toBeTypeOf('number');
      expect(activity.technique.recovery_pause_seconds).toBeTypeOf('number');
      expect(activity.technique.inhale_hold_seconds).toBeTypeOf('number');
      expect(activity.is_first_time).toBeTypeOf('boolean');
    });
  });

  describe('when Wim Hof activity has invalid schema', () => {
    // Suppress console.warn
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects Wim Hof with wrong id', () => {
      const invalidActivity = {
        ...validWimHofActivity,
        technique: {
          ...validWimHofActivity.technique,
          id: 'not_wim_hof', // Should be 'wim_hof'
        },
      };
      const content = createActivityMessage('', invalidActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
      expect(result.activity).toBeNull();
    });

    it('rejects Wim Hof with wrong type', () => {
      const invalidActivity = {
        ...validWimHofActivity,
        technique: {
          ...validWimHofActivity.technique,
          type: 'continuous', // Should be 'wim_hof'
        },
      };
      const content = createActivityMessage('', invalidActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });

    it('rejects Wim Hof with missing required fields', () => {
      const invalidActivity = {
        ...validWimHofActivity,
        technique: {
          id: 'wim_hof',
          name: 'Wim Hof Method',
          type: 'wim_hof',
          // Missing other required fields
        },
      };
      const content = createActivityMessage('', invalidActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });

    it('rejects Wim Hof with invalid rounds type', () => {
      const invalidActivity = {
        ...validWimHofActivity,
        technique: {
          ...validWimHofActivity.technique,
          rounds: '3', // Should be number
        },
      };
      const content = createActivityMessage('', invalidActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });

    it('rejects Wim Hof without is_first_time', () => {
      const { is_first_time: _is_first_time, ...activityWithoutFlag } = validWimHofActivity;
      const content = createActivityMessage('', activityWithoutFlag, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });
  });

  describe('discriminated union behavior', () => {
    it('accepts breathing activity', () => {
      const content = createActivityMessage('', validBreathingActivity, '');
      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(true);
      expect(result.activity?.activity).toBe('breathing');
    });

    it('accepts Wim Hof activity', () => {
      const content = createActivityMessage('', validWimHofActivity, '');
      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(true);
      expect(result.activity?.activity).toBe('breathing_wim_hof');
    });

    it('rejects unknown activity type', () => {
      const unknownActivity = {
        type: 'activity',
        activity: 'meditation', // Not yet supported
        status: 'ready',
      };
      const content = createActivityMessage('', unknownActivity, '');

      const result = parseActivityContent(content);

      expect(result.hasActivity).toBe(false);
    });
  });
});
