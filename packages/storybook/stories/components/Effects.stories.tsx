import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Confetti, SuccessAnimation } from '@/components/effects';

/**
 * Visual effect components for celebrations.
 */
const meta: Meta<typeof Confetti> = {
  title: 'Components/Effects',
  component: Confetti,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Visual celebration effects including confetti bursts and success animations. Used for milestone achievements and goal completions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Confetti>;

/**
 * Confetti burst effect.
 */
export const ConfettiEffect: Story = {
  args: {
    active: true,
    duration: 3000,
    onComplete: fn(),
  },
  render: function ConfettiStory(args) {
    const [active, setActive] = useState(false);
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <button
          onClick={() => {
            setActive(true);
          }}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            background: '#2d7a78',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Trigger Confetti
        </button>
        <Confetti
          {...args}
          active={active}
          onComplete={() => {
            setActive(false);
          }}
        />
      </div>
    );
  },
};

/**
 * Success checkmark animation.
 */
export const SuccessAnimationEffect: StoryObj<typeof SuccessAnimation> = {
  render: function SuccessStory() {
    const [active, setActive] = useState(false);
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <button
          onClick={() => {
            setActive(true);
          }}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Trigger Success
        </button>
        {active && (
          <SuccessAnimation
            active={active}
            size={80}
            onComplete={() => {
              setActive(false);
            }}
          />
        )}
      </div>
    );
  },
};

/**
 * Different sizes of success animation.
 */
export const SuccessSizes: StoryObj<typeof SuccessAnimation> = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <SuccessAnimation active size={32} />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Small (32px)</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <SuccessAnimation active size={64} />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Default (64px)</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <SuccessAnimation active size={96} />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Large (96px)</p>
      </div>
    </div>
  ),
};
