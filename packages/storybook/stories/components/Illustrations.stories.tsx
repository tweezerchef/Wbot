import type { Meta, StoryObj } from '@storybook/react-vite';

import { OrganicBlob, FloatingShapes, WelcomeIllustration } from '@/components/illustrations';

/**
 * Organic blob illustrations for wellness UI.
 */
const meta: Meta<typeof OrganicBlob> = {
  title: 'Components/Illustrations',
  component: OrganicBlob,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Abstract organic shape components used throughout the wellness app. Includes animated blobs, floating shapes, and composed illustrations.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrganicBlob>;

/**
 * Single organic blob with default settings.
 */
export const SingleBlob: Story = {
  args: {
    size: 200,
    colorStart: '#7ec8e3',
    colorEnd: '#9b8fd4',
    opacity: 0.6,
    animated: true,
    animationDuration: 8,
  },
};

/**
 * Static blob without animation.
 */
export const StaticBlob: Story = {
  args: {
    size: 150,
    colorStart: '#7ed4a6',
    colorEnd: '#6b9e7d',
    opacity: 0.8,
    animated: false,
  },
};

/**
 * Warm colored blob.
 */
export const WarmBlob: Story = {
  args: {
    size: 180,
    colorStart: '#f8b4a9',
    colorEnd: '#e6a87c',
    opacity: 0.7,
    animated: true,
    animationDuration: 10,
  },
};

/**
 * Multiple floating shapes composition.
 */
export const FloatingShapesExample: StoryObj<typeof FloatingShapes> = {
  render: () => (
    <div style={{ width: 300, height: 300, position: 'relative' }}>
      <FloatingShapes />
    </div>
  ),
};

/**
 * Welcome illustration with breathing animation.
 */
export const WelcomeIllustrationExample: StoryObj<typeof WelcomeIllustration> = {
  render: () => (
    <div style={{ width: 300, height: 200 }}>
      <WelcomeIllustration />
    </div>
  ),
};

/**
 * Color variations of organic blobs.
 */
export const ColorVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <OrganicBlob size={100} colorStart="#7ec8e3" colorEnd="#4a90a4" />
      <OrganicBlob size={100} colorStart="#9b8fd4" colorEnd="#6b5b95" />
      <OrganicBlob size={100} colorStart="#7ed4a6" colorEnd="#6b9e7d" />
      <OrganicBlob size={100} colorStart="#f8b4a9" colorEnd="#e6a87c" />
      <OrganicBlob size={100} colorStart="#1a1a2e" colorEnd="#0f3460" />
    </div>
  ),
};
