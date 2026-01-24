/**
 * JournalEntryViewer Stories
 *
 * Modal overlay for viewing past journal entries.
 * Displays entry content with category badge, date, prompt, content, and metadata.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { MOCK_JOURNAL_ENTRY_1, MOCK_JOURNAL_ENTRY_2, MOCK_JOURNAL_ENTRY_3 } from '../mocks';

import { JournalEntryViewer } from '@/features/chat/components/JournalEntryViewer/JournalEntryViewer';

/**
 * JournalEntryViewer displays a modal dialog for viewing a complete journal entry.
 * Shows category badge, date, original prompt, full entry text, and metadata.
 */
const meta: Meta<typeof JournalEntryViewer> = {
  title: 'Components/Journaling/JournalEntryViewer',
  component: JournalEntryViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Modal overlay for viewing journal entries. Supports click-outside and Escape key to close. Shows category, date, prompt, content, word count, and favorite status.',
      },
    },
  },
  args: {
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof JournalEntryViewer>;

// =============================================================================
// Category Variants
// =============================================================================

/**
 * Gratitude entry with favorite indicator.
 */
export const GratitudeEntry: Story = {
  args: {
    entry: MOCK_JOURNAL_ENTRY_1,
  },
};

/**
 * Processing entry (emotional processing).
 */
export const ProcessingEntry: Story = {
  args: {
    entry: MOCK_JOURNAL_ENTRY_2,
  },
};

/**
 * Growth entry with favorite.
 */
export const GrowthEntry: Story = {
  args: {
    entry: MOCK_JOURNAL_ENTRY_3,
  },
};

/**
 * Reflection entry.
 */
export const ReflectionEntry: Story = {
  args: {
    entry: {
      ...MOCK_JOURNAL_ENTRY_1,
      id: 'reflection-entry',
      prompt_category: 'reflection',
      prompt_text: 'What moment from today stands out to you?',
      entry_text:
        "Today's meeting with my mentor stood out to me. We discussed my career goals and she offered insights I hadn't considered before. Her perspective on work-life balance made me realize I've been too focused on productivity metrics. I want to remember to appreciate the journey, not just the destination.",
      is_favorite: false,
    },
  },
};

/**
 * Self-compassion entry.
 */
export const SelfCompassionEntry: Story = {
  args: {
    entry: {
      ...MOCK_JOURNAL_ENTRY_1,
      id: 'self-compassion-entry',
      prompt_category: 'self_compassion',
      prompt_text: "Write a kind letter to yourself about something you've been struggling with.",
      entry_text:
        "Dear self, I know you've been hard on yourself lately about not exercising as much as you planned. But I want you to know it's okay. You've been dealing with a lot at work, and sometimes rest is what you need most. You're doing your best, and that's enough. Tomorrow is a new day, and you don't have to be perfect to be worthy of kindness.",
      mood_before: 2,
      mood_after: 4,
      is_favorite: true,
    },
  },
};

// =============================================================================
// Content Length Variants
// =============================================================================

/**
 * Short entry with minimal content.
 */
export const ShortEntry: Story = {
  args: {
    entry: {
      ...MOCK_JOURNAL_ENTRY_1,
      id: 'short-entry',
      entry_text: 'Today was good. I felt peaceful.',
      word_count: 6,
    },
  },
};

/**
 * Long entry with multiple paragraphs.
 */
export const LongEntry: Story = {
  args: {
    entry: {
      ...MOCK_JOURNAL_ENTRY_1,
      id: 'long-entry',
      entry_text: `Today I'm reflecting on a conversation I had with an old friend who reached out unexpectedly. We hadn't spoken in years, but the moment we started talking, it felt like no time had passed at all.

She told me about the challenges she's been facing - career changes, relationship difficulties, health concerns. And as I listened, I realized how much we all carry silently. From the outside, her life looked perfect on social media, but the reality was so different.

This made me think about my own tendency to compare my inside to others' outside. I've been doing this a lot lately, especially when I feel stuck or uncertain about my path. But everyone is fighting their own battles.

What struck me most was her vulnerability in sharing these struggles. It reminded me that true connection comes from authenticity, not from appearing to have it all together.

I want to carry this lesson forward. To be more open about my own challenges. To remember that the polished images I see don't represent the full picture. And to reach out to friends I've lost touch with - not to catch up on achievements, but to genuinely connect.

Tomorrow I'm going to call another old friend. Not because I need anything, but because maintaining these connections matters more than I realized.`,
      word_count: 234,
      writing_duration_seconds: 900,
    },
  },
};

// =============================================================================
// State Variants
// =============================================================================

/**
 * Entry without mood tracking.
 */
export const NoMoodTracking: Story = {
  args: {
    entry: {
      ...MOCK_JOURNAL_ENTRY_2,
      mood_before: null,
      mood_after: null,
    },
  },
};

/**
 * Entry that was shared with AI.
 */
export const SharedWithAI: Story = {
  args: {
    entry: {
      ...MOCK_JOURNAL_ENTRY_1,
      shared_with_ai: true,
    },
  },
};

/**
 * Entry without favorite status.
 */
export const NotFavorite: Story = {
  args: {
    entry: {
      ...MOCK_JOURNAL_ENTRY_1,
      is_favorite: false,
    },
  },
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Mobile viewport.
 */
export const Mobile: Story = {
  args: {
    entry: MOCK_JOURNAL_ENTRY_1,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile with long entry.
 */
export const MobileLongEntry: Story = {
  args: {
    entry: {
      ...MOCK_JOURNAL_ENTRY_1,
      entry_text: `Today I'm reflecting on gratitude in a deeper way. Not just the big things, but the small moments that make life meaningful.

The morning light through my window. The taste of my first coffee. A kind word from a stranger. These tiny gifts that I often overlook.

I want to be more present to these moments. To not rush past them on my way to something else.`,
      word_count: 70,
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// =============================================================================
// Interactive Test Stories
// =============================================================================

/**
 * Test: Close button works.
 */
export const TestCloseButton: Story = {
  args: {
    entry: MOCK_JOURNAL_ENTRY_1,
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click close button
    const closeButton = canvas.getByRole('button', { name: /close journal entry/i });
    await expect(closeButton).toBeInTheDocument();
    await userEvent.click(closeButton);

    // Verify callback was called
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/**
 * Test: Accessibility attributes.
 */
export const TestAccessibility: Story = {
  args: {
    entry: MOCK_JOURNAL_ENTRY_1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Dialog should have proper role
    const dialog = canvas.getByRole('dialog');
    await expect(dialog).toBeInTheDocument();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-label', 'Journal entry viewer');

    // Close button should be accessible
    const closeButton = canvas.getByRole('button', { name: /close journal entry/i });
    await expect(closeButton).toBeInTheDocument();
  },
};

/**
 * Test: Content is displayed correctly.
 */
export const TestContentDisplay: Story = {
  args: {
    entry: MOCK_JOURNAL_ENTRY_1,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Category badge should be visible
    const categoryBadge = canvas.getByText(/gratitude/i);
    await expect(categoryBadge).toBeInTheDocument();

    // Prompt should be visible
    const prompt = canvas.getByText(args.entry.prompt_text);
    await expect(prompt).toBeInTheDocument();

    // Word count should be displayed
    const wordCount = canvas.getByText(/85 words/i);
    await expect(wordCount).toBeInTheDocument();

    // Favorite indicator should be visible
    const favorite = canvas.getByText(/favorite/i);
    await expect(favorite).toBeInTheDocument();
  },
};
