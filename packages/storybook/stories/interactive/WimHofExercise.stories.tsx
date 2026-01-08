import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { WimHofExercise } from '@/features/breathing';

/**
 * Wim Hof Method breathing exercise component with round-based structure.
 *
 * Features:
 * - Round-based breathing (3 rounds by default)
 * - Rapid breathing phase with breath counter (30 breaths)
 * - User-controlled retention phase with stopwatch
 * - Recovery phases between rounds
 * - Auto-paced and manual breathing modes
 * - Session statistics tracking
 * - Safety notices for first-time users
 *
 * The Wim Hof Method is an advanced breathing technique that differs from
 * continuous breathing patterns with its unique round structure and
 * breath retention focus.
 */
const meta: Meta<typeof WimHofExercise> = {
  title: 'Interactive/WimHofExercise',
  component: WimHofExercise,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'wellness' },
    docs: {
      description: {
        component: `
Interactive Wim Hof Method breathing exercise component.

## Features
- **Round-based structure**: 3 rounds of rapid breathing + retention
- **Breath counter**: Track progress through 30 rapid breaths
- **Retention stopwatch**: User-controlled breath holding with target time
- **Recovery phases**: Guided recovery between rounds
- **Flexible pacing**: Auto-paced or manual breathing control
- **Session stats**: Track retention times and improvements

## Safety
The Wim Hof Method involves hyperventilation and breath retention. Users should:
- Practice sitting or lying down
- Stop if feeling excessively dizzy
- Have prior breathing exercise experience

## Usage
This component is embedded within chat messages when the AI suggests Wim Hof breathing for energy, immune support, or stress relief.
        `,
      },
    },
  },
  argTypes: {
    isFirstTime: {
      control: 'boolean',
      description: 'Whether to show first-time safety tutorial',
    },
    introduction: {
      control: 'text',
      description: 'Optional introduction text from the AI',
    },
  },
  args: {
    technique: {
      id: 'wim_hof',
      name: 'Wim Hof Method',
      type: 'wim_hof',
      description: 'Rapid breathing followed by breath retention. Boosts energy and resilience.',
      best_for: ['energy boost', 'immune support', 'stress relief', 'mental clarity'],
      rounds: 3,
      breaths_per_round: 30,
      breath_tempo_ms: 1500,
      retention_target_seconds: 90,
      recovery_pause_seconds: 15,
      inhale_hold_seconds: 15,
    },
    introduction: 'Welcome to the Wim Hof Method! This powerful technique will boost your energy.',
    isFirstTime: false,
    onComplete: fn(),
    onStop: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof WimHofExercise>;

/**
 * Default Wim Hof exercise with standard configuration.
 * 3 rounds × 30 breaths with 90-second retention target.
 */
export const Default: Story = {
  args: {
    introduction:
      "Time for Wim Hof breathing! Let's energize with 3 rounds of powerful breathing and retention.",
    isFirstTime: false,
  },
};

/**
 * First-time user experience with safety tutorial.
 * Shows safety warnings and detailed instructions.
 */
export const FirstTimeUser: Story = {
  args: {
    introduction: `Welcome to the Wim Hof Method! This is an energizing technique that combines rapid breathing with breath retention.

**What to expect:**
- 3 rounds of 30 rapid breaths each
- Hold your breath after exhaling (as long as comfortable)
- Recovery breath between rounds

**Safety:** You may feel tingling or slight lightheadedness - this is normal. If you feel dizzy, slow down or stop. Always practice sitting or lying down.

Ready to boost your energy? Click Start when comfortable.`,
    isFirstTime: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'First-time Wim Hof experience with comprehensive safety tutorial and instructions.',
      },
    },
  },
};

/**
 * Short version for quick testing.
 * Reduced rounds and breaths for faster demonstration.
 */
export const QuickDemo: Story = {
  args: {
    technique: {
      id: 'wim_hof',
      name: 'Wim Hof Method (Quick Demo)',
      type: 'wim_hof',
      description: 'Shortened version for demonstration',
      best_for: ['demo'],
      rounds: 2,
      breaths_per_round: 5, // Reduced for quick demo
      breath_tempo_ms: 1000,
      retention_target_seconds: 10,
      recovery_pause_seconds: 5,
      inhale_hold_seconds: 5,
    },
    introduction: 'Quick demo with 2 rounds of 5 breaths each.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shortened Wim Hof exercise for quick demonstration. Only 2 rounds with 5 breaths each for faster testing.',
      },
    },
  },
};

/**
 * Manual breathing mode.
 * User clicks or presses spacebar to advance each breath.
 */
export const ManualMode: Story = {
  args: {
    technique: {
      id: 'wim_hof',
      name: 'Wim Hof Method (Manual)',
      type: 'wim_hof',
      description: 'Manual breath control',
      best_for: ['control'],
      rounds: 2,
      breaths_per_round: 10,
      breath_tempo_ms: 1500,
      retention_target_seconds: 30,
      recovery_pause_seconds: 10,
      inhale_hold_seconds: 10,
    },
    introduction: 'Manual mode - click the circle or press spacebar to advance each breath.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Manual breathing mode where user controls the pace. Check the "Manual breath control" toggle before starting.',
      },
    },
  },
};

/**
 * Single round configuration.
 * Just one round for quick practice.
 */
export const SingleRound: Story = {
  args: {
    technique: {
      id: 'wim_hof',
      name: 'Wim Hof Method (Single Round)',
      type: 'wim_hof',
      description: 'Single round practice',
      best_for: ['quick practice'],
      rounds: 1,
      breaths_per_round: 20,
      breath_tempo_ms: 1200,
      retention_target_seconds: 60,
      recovery_pause_seconds: 10,
      inhale_hold_seconds: 10,
    },
    introduction: "Let's do a single round to start - 20 breaths followed by retention.",
  },
  parameters: {
    docs: {
      description: {
        story: 'Single round configuration for beginners or quick practice sessions.',
      },
    },
  },
};

// ==============================================================================
// Test Stories with Play Functions
// ==============================================================================

/**
 * Test: Starting the exercise
 * Verifies that clicking Start transitions to active state
 */
export const TestStartExercise: Story = {
  args: {
    technique: {
      id: 'wim_hof',
      name: 'Wim Hof Method',
      type: 'wim_hof',
      description: 'Test configuration',
      best_for: ['test'],
      rounds: 1,
      breaths_per_round: 3,
      breath_tempo_ms: 1000,
      retention_target_seconds: 5,
      recovery_pause_seconds: 2,
      inhale_hold_seconds: 2,
    },
    introduction: 'Test story for automated interaction testing',
    isFirstTime: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify idle state
    await expect(canvas.getByText('Start Exercise')).toBeInTheDocument();
    await expect(canvas.getByText('Wim Hof Method')).toBeInTheDocument();

    // Click start button
    const startButton = canvas.getByText('Start Exercise');
    await userEvent.click(startButton);

    // Verify active state - should show round indicator
    await expect(canvas.getByText(/Round 1 of/)).toBeInTheDocument();
    await expect(canvas.getByText('Stop')).toBeInTheDocument();
  },
};

/**
 * Test: Breath counter displays correctly
 * Verifies breath counting during rapid breathing phase
 */
export const TestBreathCounter: Story = {
  args: {
    technique: {
      id: 'wim_hof',
      name: 'Wim Hof Method',
      type: 'wim_hof',
      description: 'Test configuration',
      best_for: ['test'],
      rounds: 1,
      breaths_per_round: 5,
      breath_tempo_ms: 500, // Fast for testing
      retention_target_seconds: 5,
      recovery_pause_seconds: 2,
      inhale_hold_seconds: 2,
    },
    isFirstTime: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Start exercise
    await userEvent.click(canvas.getByText('Start Exercise'));

    // Wait for the rapid breathing phase to start
    // The breath counter shows current/total where each number is in a separate span
    // So we check for the phase indicator text instead, which is more reliable
    const phaseIndicator = await canvas.findByText('Breathe rapidly', {}, { timeout: 3000 });
    await expect(phaseIndicator).toBeInTheDocument();

    // Verify the breath separator exists (the "/" between current and total breaths)
    const breathSeparator = await canvas.findByText('/', {}, { timeout: 3000 });
    await expect(breathSeparator).toBeInTheDocument();

    // Verify the total breaths shows "5"
    const totalBreaths = await canvas.findByText('5', {}, { timeout: 3000 });
    await expect(totalBreaths).toBeInTheDocument();

    // Verify round indicator
    const roundIndicator = await canvas.findByText(/Round.*1.*of.*1/, {}, { timeout: 3000 });
    await expect(roundIndicator).toBeInTheDocument();
  },
};

/**
 * Test: Safety notice for first-time users
 * Verifies safety warnings are displayed
 */
export const TestSafetyNotice: Story = {
  args: {
    isFirstTime: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify safety notice is shown
    await expect(canvas.getByText('Safety First:')).toBeInTheDocument();
    await expect(canvas.getByText(/Practice sitting or lying down/)).toBeInTheDocument();
    await expect(canvas.getByText(/Never practice while driving/)).toBeInTheDocument();
  },
};

/**
 * Test: Mode toggle
 * Verifies auto/manual mode toggle works
 */
export const TestModeToggle: Story = {
  args: {
    isFirstTime: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify mode toggle exists
    const modeToggle = canvas.getByText(/Manual breath control/);
    await expect(modeToggle).toBeInTheDocument();

    // Check checkbox state
    const checkbox = canvas.getByRole('checkbox');
    await expect(checkbox).not.toBeChecked();

    // Toggle to manual mode
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};
