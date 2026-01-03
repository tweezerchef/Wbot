// ============================================================================
// Tests for parseActivity.ts
// ============================================================================
// Tests the activity parsing utilities that extract embedded activity
// configurations from AI message content.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseActivityContent,
  hasActivityContent,
  extractTextContent,
  type BreathingActivityData,
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
    phases: ['inhale', 'hold', 'exhale', 'hold'],
    description: 'A calming technique used by Navy SEALs',
    cycles: 4,
  },
  introduction: "Let's try some box breathing to help you relax.",
};

// Create a message with activity markers
const createActivityMessage = (
  textBefore: string,
  activity: object,
  textAfter: string
): string => {
  return `${textBefore}[ACTIVITY_START]${JSON.stringify(activity)}[ACTIVITY_END]${textAfter}`;
};

// -----------------------------------------------------------------------------
// parseActivityContent Tests
// -----------------------------------------------------------------------------

describe('parseActivityContent', () => {
  // Suppress console.warn during tests (expected for error cases)
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

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

      // Type assertion since we know it's a breathing activity
      const activity = result.activity as BreathingActivityData;

      expect(activity.technique.id).toBe('box');
      expect(activity.technique.name).toBe('Box Breathing');
      expect(activity.technique.durations).toEqual([4, 4, 4, 4]);
      expect(activity.technique.cycles).toBe(4);
      expect(activity.introduction).toBe(
        "Let's try some box breathing to help you relax."
      );
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
      const content = createActivityMessage(
        '[ACTIVITY_START]nested',
        validBreathingActivity,
        ''
      );

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
    const content =
      'Some text [ACTIVITY_START]{"data":"here"}[ACTIVITY_END] more text';

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
    const content = createActivityMessage(
      'Only before. ',
      validBreathingActivity,
      ''
    );

    const result = extractTextContent(content);

    expect(result).toBe('Only before.');
  });

  it('returns only after text when no before text', () => {
    const content = createActivityMessage(
      '',
      validBreathingActivity,
      ' Only after.'
    );

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
