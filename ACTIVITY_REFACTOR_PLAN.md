# Activity Components Refactor Plan

## Full-Screen Immersive Wellness Experience

**Date:** January 4, 2026
**Status:** Planning Phase

---

## Executive Summary

This document outlines a comprehensive plan to refactor the wellness activity components (GuidedMeditation, MeditationLibrary, MeditationSeries, BreathingConfirmation, BreathingExercise) from their current inline card-based rendering to **full-screen immersive experiences** that temporarily replace the chat interface.

The goal is to create a **distraction-free, spa-like environment** where users can fully engage with breathing exercises and meditation sessions—similar to how Headspace and Calm design their immersive experiences.

---

## Current State Analysis

### How Activities Currently Render

| Component             | Location                 | Style        | Max Width |
| --------------------- | ------------------------ | ------------ | --------- |
| BreathingExercise     | Inline in message bubble | Card (400px) | 400px     |
| BreathingConfirmation | Inline in message bubble | Card (400px) | 400px     |
| GuidedMeditation      | Inline in message bubble | Card (400px) | 400px     |
| MeditationLibrary     | Own page/route           | Grid layout  | 1200px    |
| MeditationSeries      | Own page/route           | Card layout  | Variable  |

### Current Limitations

1. **Constrained to message bubbles** — Activities are embedded in chat, competing with other messages for attention
2. **Limited visual real estate** — 400px max-width doesn't allow for immersive animations
3. **Chat remains visible** — Users can see other messages, reducing focus
4. **No entrance/exit animations** — Activities appear/disappear abruptly
5. **Mobile feels cramped** — On small screens, the card-based UI feels restrictive

---

## Design Inspiration & Research

### Key Patterns from Leading Wellness Apps

Based on research from [Headspace](https://www.headspace.com), [Calm](https://www.calm.com), and industry case studies:

#### 1. **Full-Screen Immersion**

- Activities take over the entire viewport
- Background becomes a calming gradient or subtle animation
- All UI chrome (headers, navigation) fades away
- Source: [Headspace UX Case Study](https://raw.studio/blog/how-headspace-designs-for-mindfulness/)

#### 2. **Soft, Rounded Visual Language**

- No sharp edges — everything uses generous border-radius
- Pulsing circles as the primary visual metaphor for breathing
- Layered gradients create depth without distraction
- Source: [NeoInteraction Headspace Analysis](https://www.neointeraction.com/blogs/headspace-a-case-study-on-successful-emotion-driven-ui-ux-design)

#### 3. **Animation-First Design**

- Every state transition is animated (fade, scale, slide)
- Breathing circles expand/contract smoothly with easing
- Entry animations set the tone (slow fade-in = calm)
- Source: [CSS-Tricks Apple Watch Breathe Recreation](https://css-tricks.com/recreating-apple-watch-breathe-app-animation/)

#### 4. **Minimal Controls During Active Sessions**

- During breathing/meditation: only essential controls visible
- Pause/Stop controls appear with subtle transparency
- Progress indicators are unobtrusive (dots, thin lines)
- Source: [Purrweb Meditation App Design Guide](https://www.purrweb.com/blog/designing-a-meditation-app-tips-step-by-step-guide/)

---

## Proposed Architecture

### Option A: Activity Overlay Pattern (Recommended)

**ChatPage remains the layout container.** When an activity starts, an overlay component slides/fades in, covering the chat area while preserving the underlying state.

```
┌─────────────────────────────────────────────┐
│  ChatPage (layout container)                │
│  ┌────────────────────────────────────────┐ │
│  │  Sidebar (hidden during activity)      │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │  Chat Main Area                        │ │
│  │  ┌──────────────────────────────────┐  │ │
│  │  │                                  │  │ │
│  │  │   ActivityOverlay (full-screen)  │  │ │
│  │  │   - BreathingExercise            │  │ │
│  │  │   - GuidedMeditation             │  │ │
│  │  │   - MeditationLibrary            │  │ │
│  │  │                                  │  │ │
│  │  └──────────────────────────────────┘  │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Pros:**

- Chat state preserved — user returns to exact scroll position
- Clean separation of concerns
- Easier to implement entrance/exit animations
- Natural "close" gesture returns to chat

**Cons:**

- Additional component layer
- Need to manage z-index carefully

### Option B: Route-Based Takeover

Activities become their own routes (e.g., `/chat/activity/breathing`). ChatPage completely unmounts when navigating to an activity.

**Pros:**

- Clean URL history (back button works naturally)
- Complete isolation of activity state

**Cons:**

- Chat state potentially lost (needs careful state preservation)
- More complex routing setup
- Slower transitions (route changes vs. component swap)

### Recommendation: **Option A — Activity Overlay Pattern**

This approach offers the smoothest user experience with rich animations while keeping the chat context intact.

---

## Component Architecture

### New Component Structure

```
components/
├── ActivityOverlay/
│   ├── ActivityOverlay.tsx          # Main container with transitions
│   ├── ActivityOverlay.module.css   # Full-screen styles & animations
│   ├── useActivityTransition.ts     # Animation state management
│   └── types.ts
│
├── ImmersiveBreathing/              # Refactored BreathingExercise
│   ├── ImmersiveBreathing.tsx       # Full-screen breathing UI
│   ├── ImmersiveBreathing.module.css
│   ├── BreathingCircle.tsx          # Large animated circle
│   ├── BreathingBackground.tsx      # Animated gradient background
│   ├── BreathingControls.tsx        # Minimal floating controls
│   ├── BreathingProgress.tsx        # Unobtrusive progress indicator
│   └── hooks/
│       ├── useBreathingLoop.ts      # Existing hook (enhanced)
│       └── useBreathingAudio.ts     # Existing hook
│
├── ImmersiveMeditation/             # Refactored GuidedMeditation
│   ├── ImmersiveMeditation.tsx      # Full-screen meditation UI
│   ├── ImmersiveMeditation.module.css
│   ├── MeditationVisual.tsx         # Enhanced orb animation
│   ├── MeditationBackground.tsx     # Ambient animated background
│   ├── MeditationPlayer.tsx         # Audio controls
│   ├── AmbientMixer.tsx             # Sound mixer panel
│   └── MoodCheck.tsx                # Pre/post mood tracking
│
├── ActivityConfirmation/            # Universal confirmation component
│   ├── ActivityConfirmation.tsx     # HITL confirmation dialog
│   └── ActivityConfirmation.module.css
│
└── MeditationBrowser/               # Refactored MeditationLibrary
    ├── MeditationBrowser.tsx        # Full-screen library view
    ├── MeditationBrowser.module.css
    ├── MeditationCard.tsx           # Enhanced card with hover effects
    └── MeditationFilters.tsx        # Filter/sort controls
```

### State Management Flow

```
ChatPage
├── State: activeActivity: null | ActivityConfig
├── State: activityState: 'confirming' | 'active' | 'completing' | null
│
└── When AI triggers activity:
    1. Parse activity from message → setActiveActivity(config)
    2. Show ActivityConfirmation (HITL) → activityState: 'confirming'
    3. User confirms → activityState: 'active'
    4. Activity starts → ActivityOverlay enters with animation
    5. Activity completes → activityState: 'completing'
    6. Show completion celebration
    7. User closes → activityState: null, smooth exit animation
    8. Return to chat with scroll position preserved
```

---

## Animation Specifications

### Entry/Exit Transitions

All transitions should use **Framer Motion** for consistency and performance.

Based on [Motion.dev documentation](https://motion.dev/docs/react-transitions) and [advanced patterns](https://blog.maximeheckel.com/posts/advanced-animation-patterns-with-framer-motion/):

#### Activity Entry (Chat → Activity)

```tsx
// Using AnimatePresence for mount/unmount animations
<AnimatePresence mode="wait">
  {activeActivity && (
    <motion.div
      className={styles.activityOverlay}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, y: 20 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1], // Custom easing for smooth feel
      }}
    >
      <ActivityContent />
    </motion.div>
  )}
</AnimatePresence>
```

#### Breathing Circle Animation

Enhanced version of current animation with Apple Watch-inspired flower pattern:

```css
/* Multi-layer breathing animation */
.breathingOrb {
  position: relative;
  width: min(80vw, 300px);
  height: min(80vw, 300px);
}

.breathingCircle {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--color-breath-inhale) 0%,
    var(--color-breath-inhale-light) 60%,
    transparent 80%
  );
  transition: transform 4s cubic-bezier(0.4, 0, 0.2, 1);
}

.inhale {
  transform: scale(1.5);
}
.exhale {
  transform: scale(1);
}

/* Petal overlay for Apple Watch-like effect */
.petal {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0.6;
  mix-blend-mode: screen;
}

.petal:nth-child(1) {
  transform: rotate(0deg) translateY(-20%);
}
.petal:nth-child(2) {
  transform: rotate(60deg) translateY(-20%);
}
.petal:nth-child(3) {
  transform: rotate(120deg) translateY(-20%);
}
.petal:nth-child(4) {
  transform: rotate(180deg) translateY(-20%);
}
.petal:nth-child(5) {
  transform: rotate(240deg) translateY(-20%);
}
.petal:nth-child(6) {
  transform: rotate(300deg) translateY(-20%);
}
```

Source: [CSS-Tricks simplified Apple Watch animation](https://css-tricks.com/simplifying-apple-watch-breathe-app-animation-css-variables/)

#### Background Gradient Animation

Slow-moving gradient creates ambient, living feel:

```css
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.activityBackground {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    -45deg,
    var(--color-wellness-ocean),
    var(--color-breath-hold),
    var(--color-wellness-sage),
    var(--color-breath-inhale)
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
```

#### Micro-Interactions

Every interactive element should have feedback:

```css
/* Button press effect */
.controlButton {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.controlButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.controlButton:active {
  transform: translateY(0) scale(0.98);
}

/* Ripple effect on tap (for touch feedback) */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}
```

---

## Responsive Design

### Mobile (< 768px)

**Full Takeover Mode:**

- Activity fills 100dvh × 100vw
- No header/footer visible
- Breathing circle: 80% of viewport width (max 300px)
- Controls positioned at bottom with safe-area-inset padding
- Close button: fixed top-right, subtle but accessible
- Phase text: centered, large font (24px+)

```css
@media (max-width: 767px) {
  .activityOverlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
  }

  .breathingOrb {
    width: 80vw;
    max-width: 300px;
    height: 80vw;
    max-height: 300px;
  }

  .controls {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-lg);
    padding-bottom: max(var(--spacing-lg), env(safe-area-inset-bottom));
  }
}
```

### Tablet (768px - 1024px)

**Centered Card with Blur:**

- Activity container: 80% width, centered
- Chat visible but heavily blurred in background
- Breathing circle: 250px
- Controls below the circle
- Elegant card shadow and border-radius

```css
@media (min-width: 768px) and (max-width: 1024px) {
  .activityOverlay {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
  }

  .activityContent {
    width: 80%;
    max-width: 500px;
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-xl);
  }
}
```

### Desktop (> 1024px)

**Side-by-Side with Chat:**

- Activity takes the main chat area (flex: 1)
- Sidebar remains visible (optional)
- Breathing circle: 300px
- Additional controls/info can show alongside
- More elaborate visual effects (particles, multiple rings)

```css
@media (min-width: 1025px) {
  .activityOverlay {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
  }

  .activityContent {
    max-width: 600px;
    width: 100%;
  }

  /* Can show additional ambient elements */
  .ambientParticles {
    display: block;
  }
}
```

---

## New CSS Variables

Add these to `variables.css` for consistent immersive styling:

```css
:root {
  /* Immersive Activity Colors */
  --color-activity-bg-start: #1a1a2e;
  --color-activity-bg-mid: #16213e;
  --color-activity-bg-end: #0f3460;

  /* Glassmorphism */
  --glass-background: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: blur(12px);

  /* Breathing Colors (expanded) */
  --color-breath-ambient: rgba(126, 200, 227, 0.15);
  --color-breath-glow-strong: rgba(126, 200, 227, 0.6);

  /* Activity Transitions */
  --transition-activity-enter: 500ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-activity-exit: 400ms cubic-bezier(0.4, 0, 1, 1);
  --transition-breath-phase: 4s cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-Index Layers */
  --z-activity-overlay: 1000;
  --z-activity-controls: 1010;
  --z-activity-close: 1020;
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Tasks:**

1. [ ] Create `ActivityOverlay` component with enter/exit animations
2. [ ] Install and configure Framer Motion
3. [ ] Add new CSS variables for immersive styling
4. [ ] Modify ChatPage to support `activeActivity` state
5. [ ] Create `useActivityTransition` hook for animation state

**Deliverables:**

- Empty overlay that can be triggered and dismissed
- Smooth fade-in/fade-out transitions
- Mobile full-screen, desktop centered card

### Phase 2: Breathing Experience (Week 2)

**Tasks:**

1. [ ] Create `ImmersiveBreathing` component
2. [ ] Implement Apple Watch-inspired breathing circle with petals
3. [ ] Add animated gradient background
4. [ ] Create floating controls (pause/resume/stop)
5. [ ] Implement subtle progress indicator
6. [ ] Add haptic feedback option (navigator.vibrate)
7. [ ] Migrate existing `useBreathingLoop` and `useBreathingAudio` hooks

**Deliverables:**

- Full-screen breathing experience
- Smooth phase transitions with color changes
- Audio integration
- Completion celebration animation

### Phase 3: Meditation Experience (Week 3)

**Tasks:**

1. [ ] Create `ImmersiveMeditation` component
2. [ ] Enhance `MeditationVisual` with larger, more prominent orb
3. [ ] Implement ambient background with subtle particle effects
4. [ ] Redesign audio controls for immersive layout
5. [ ] Create slide-in ambient mixer panel
6. [ ] Implement mood tracking with animated emoji scale

**Deliverables:**

- Full-screen meditation player
- Ambient sound mixer
- Before/after mood tracking with transitions
- Session completion summary

### Phase 4: Confirmation & Library (Week 4)

**Tasks:**

1. [ ] Create `ActivityConfirmation` component with slide-up animation
2. [ ] Redesign technique selector with animated cards
3. [ ] Create `MeditationBrowser` for full-screen library view
4. [ ] Implement search and filter with animated results
5. [ ] Add card hover effects and selection animations
6. [ ] Connect all components to ChatPage flow

**Deliverables:**

- Polished HITL confirmation experience
- Full-screen meditation library browser
- Complete end-to-end flow from chat to activity and back

### Phase 5: Polish & Accessibility (Week 5)

**Tasks:**

1. [ ] Add reduced-motion alternatives for all animations
2. [ ] Implement keyboard navigation throughout
3. [ ] Add proper ARIA labels and announcements
4. [ ] Performance optimization (will-change, GPU layers)
5. [ ] Cross-browser testing
6. [ ] Mobile device testing (iOS Safari, Android Chrome)

**Deliverables:**

- WCAG 2.1 AA compliant animations
- Smooth 60fps performance
- Consistent experience across devices

---

## Component API Designs

### ActivityOverlay

```tsx
interface ActivityOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Called when user requests to close */
  onClose: () => void;
  /** The type of activity being displayed */
  activityType: 'breathing' | 'meditation' | 'library' | 'series';
  /** Activity-specific configuration */
  activityConfig: ActivityConfig;
  /** Optional callback when activity completes */
  onComplete?: (result: ActivityResult) => void;
}
```

### ImmersiveBreathing

```tsx
interface ImmersiveBreathingProps {
  /** Breathing technique configuration */
  technique: BreathingTechnique;
  /** Number of cycles to complete */
  cycles: number;
  /** Called when exercise completes */
  onComplete: (stats: BreathingStats) => void;
  /** Called when user exits early */
  onExit: () => void;
  /** Whether to enable audio */
  audioEnabled?: boolean;
  /** Background style variant */
  backgroundVariant?: 'gradient' | 'solid' | 'particles';
}
```

### ImmersiveMeditation

```tsx
interface ImmersiveMeditationProps {
  /** Meditation session configuration */
  session: MeditationSession;
  /** Called when session completes */
  onComplete: (result: MeditationResult) => void;
  /** Called when user exits early */
  onExit: () => void;
  /** Visual style variant */
  visualVariant?: 'orb' | 'rings' | 'gradient' | 'minimal';
  /** Whether to show mood check */
  showMoodCheck?: boolean;
}
```

---

## Testing Strategy

### Unit Tests

- Hook behavior (useBreathingLoop phase transitions)
- Animation variants and timing
- State management in ActivityOverlay

### Component Tests

- Render in different activity states
- User interactions (start, pause, resume, stop, close)
- Responsive breakpoint behavior
- Keyboard navigation

### Integration Tests

- Full flow: Chat → Confirm → Activity → Complete → Chat
- Activity data persistence
- Audio playback integration

### Visual Regression Tests

- Storybook stories for each component state
- Chromatic for automated visual testing
- Animation snapshots at key frames

---

## Dependencies

### New Packages

```bash
pnpm add framer-motion --filter @wbot/web
```

Framer Motion provides:

- `AnimatePresence` for mount/unmount animations
- `motion` components with spring physics
- Layout animations for smooth transitions
- Gesture support (drag, tap, hover)

Source: [Framer Motion React docs](https://motion.dev/docs/react-motion-component)

### Existing Dependencies (No Changes)

- React 19
- CSS Modules
- Existing audio hooks

---

## Risk Mitigation

| Risk                                    | Mitigation                                                          |
| --------------------------------------- | ------------------------------------------------------------------- |
| Performance issues on low-end devices   | Use `will-change`, reduce particle counts, test on budget phones    |
| Animation conflicts with reduced-motion | Provide instant/subtle alternatives for every animation             |
| Complex state management                | Use single source of truth in ChatPage, pass callbacks down         |
| Breaking existing functionality         | Keep old components until new ones are tested, feature flag rollout |
| Audio sync issues                       | Use requestAnimationFrame for visual sync, separate audio timing    |

---

## Success Metrics

- **User engagement:** Average session duration increases by 20%
- **Completion rate:** Users who start activities finish them 80%+ of the time
- **Performance:** Animations maintain 60fps on mid-range devices
- **Accessibility:** Pass automated a11y audits (axe, lighthouse)

---

## References

- [Headspace UX Case Study](https://raw.studio/blog/how-headspace-designs-for-mindfulness/)
- [Meditation App Design Best Practices](https://www.purrweb.com/blog/designing-a-meditation-app-tips-step-by-step-guide/)
- [Apple Watch Breathe Animation CSS](https://css-tricks.com/recreating-apple-watch-breathe-app-animation/)
- [Framer Motion Page Transitions](https://motion.dev/docs/react-transitions)
- [Advanced Framer Motion Patterns](https://blog.maximeheckel.com/posts/advanced-animation-patterns-with-framer-motion/)
- [CSS Pulse Effect Tutorial](https://www.florin-pop.com/blog/2019/03/css-pulse-effect/)

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Approve architecture** (Option A recommended)
3. **Install Framer Motion** and set up animation foundation
4. **Begin Phase 1** implementation

---

_This document will be updated as implementation progresses._
