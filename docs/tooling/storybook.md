---
sidebar_position: 1
---

# Storybook

Storybook is used to develop, test, and document React components in isolation.

## Quick Start

```bash
# Development mode (with hot reload)
pnpm storybook

# Build static version for deployment
pnpm storybook:build
```

Open http://localhost:6006 to view Storybook.

## Project Structure

```
packages/storybook/
├── .storybook/
│   ├── main.ts        # Storybook configuration
│   └── preview.ts     # Global decorators and styles
├── stories/
│   ├── buttons/       # Icon component stories
│   ├── components/    # Standalone UI components
│   ├── interactive/   # Complex component stories
│   └── pages/         # Full page components
├── package.json
└── tsconfig.json
```

## Writing Stories

Stories are files that describe the different states of a component. They live in `packages/storybook/stories/`.

### Basic Story Structure

```tsx
// packages/storybook/stories/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from '@/components/MyComponent/MyComponent';

// Metadata for the component
const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent', // Sidebar location
  component: MyComponent,
  parameters: {
    layout: 'centered', // 'centered' | 'fullscreen' | 'padded'
  },
  // Define controls for props
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
  // Default prop values
  args: {
    children: 'Click me',
  },
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

// Individual stories (variants)
export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};
```

### Story with Custom Render

```tsx
export const CustomLayout: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <MyComponent variant="primary">First</MyComponent>
      <MyComponent variant="secondary">Second</MyComponent>
    </div>
  ),
};
```

### Story with Actions

```tsx
import { fn } from '@storybook/test';

const meta: Meta<typeof Button> = {
  // ...
  args: {
    onClick: fn(), // Creates a logged action
  },
};
```

## Importing Components

The Storybook config includes path aliases so you can import components like this:

```tsx
// Import from web app using @ alias
import { BreathingExercise } from '@/components/BreathingExercise/BreathingExercise';

// Import from shared package
import type { Message } from '@wbot/shared';
```

## Adding Documentation

Use JSDoc comments and the `docs` parameter:

````tsx
/**
 * A button component that triggers actions.
 *
 * ## Usage
 * ```tsx
 * <Button onClick={handleClick}>Click me</Button>
 * ```
 */
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Primary UI button for user actions.',
      },
    },
  },
};

export const Primary: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The primary button style for main actions.',
      },
    },
  },
};
````

## With React Query

For components that use React Query:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof YourComponent> = {
  // ...
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
```

## Existing Stories

| Story File                                     | Components Covered                         |
| ---------------------------------------------- | ------------------------------------------ |
| `buttons/Icons.stories.tsx`                    | MenuIcon, CloseIcon, ChevronLeftIcon, etc. |
| `components/BreathingConfirmation.stories.tsx` | Breathing exercise confirmation modal      |
| `components/ConversationHistory.stories.tsx`   | Conversation history sidebar               |
| `components/NotFound.stories.tsx`              | 404 error page                             |
| `interactive/BreathingExercise.stories.tsx`    | Full breathing exercise component          |
| `pages/LandingPage.stories.tsx`                | Main landing page                          |
| `pages/ChatPage.stories.tsx`                   | Chat interface                             |
| `pages/SignupPage.stories.tsx`                 | User registration                          |

## Title Naming Convention

- **Components**: `Components/ComponentName`
- **Pages**: `Pages/PageName`
- **Interactive**: `Interactive/ComponentName`
- **Buttons/Icons**: `Components/Icons`

## Troubleshooting

**Component not rendering:**

- Check import paths (use `@/` alias)
- Verify CSS modules are being imported
- Check browser console for errors

**Styles missing:**

- Ensure `variables.css` is imported in `preview.ts`
- Check that CSS module class names match

**Hot reload not working:**

- Restart Storybook: `Ctrl+C` then `pnpm storybook`

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
