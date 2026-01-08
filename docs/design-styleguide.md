# Wbot Design Style Guide

**Version:** 1.0
**Date:** January 8, 2026
**Purpose:** Comprehensive UX/UI improvement plan for Wbot wellness chatbot

---

## Executive Summary

This style guide establishes a cohesive visual identity for Wbot that differentiates it from competitors while embracing proven wellness app design patterns. Our approach: **"Warmth meets Intelligence"** - combining the calming aesthetics of apps like Calm and Headspace with the conversational intimacy of a trusted companion.

### Our Unique Positioning

While Headspace uses playful illustrations and Calm relies on nature photography, Wbot's identity centers on **abstract organic shapes** and **soft gradients** that represent the fluidity of emotional wellbeing. This creates a modern, sophisticated aesthetic that appeals to users who want wellness support without feeling like they're using a "meditation app."

### Key Differentiators

| Competitor | Visual Identity                               | Wbot's Differentiation                              |
| ---------- | --------------------------------------------- | --------------------------------------------------- |
| Headspace  | Playful character illustrations, orange/coral | Sophisticated organic shapes, teal/purple gradients |
| Calm       | Nature photography, sky blue                  | Abstract flowing forms, no photographs              |
| Balance    | Clean minimalism, pastel colors               | Warm organic gradients with gentle animation        |
| Wysa       | Cute penguin mascot, blue gradient            | No mascot, elegant abstract companion               |

---

## Design Philosophy

### Core Principles

#### 1. Calm is Clarity, Not Slowness

Following UX best practices, our calm design removes uncertainty without reducing urgency. Every interaction should feel clear, not sluggish.

> "A calm user experience is not slower, it's clearer. It removes uncertainty, without foregoing urgency." - [UXmatters](https://www.uxmatters.com/mt/archives/2025/05/designing-calm-ux-principles-for-reducing-users-anxiety.php)

#### 2. Progressive Disclosure

Reveal complexity only as necessary. New users see simplicity; returning users discover depth. This reduces cognitive load and prevents overwhelm.

#### 3. Warmth Through Design

Every color, shape, and animation should convey that Wbot is a supportive companion. No sharp edges, harsh contrasts, or clinical aesthetics.

#### 4. Accessibility First

All design decisions must meet WCAG AA standards. Calm colors should never compromise readability. Our current teal (#4a9d9a) fails contrast requirements and must be addressed.

#### 5. Mobile-First, Desktop-Enhanced

Design for mobile constraints first, then enhance for desktop. Sidebars collapse gracefully; touch targets are generous.

---

## Visual Identity

### Brand Personality

| Attribute       | Expression                                                 |
| --------------- | ---------------------------------------------------------- |
| **Warm**        | Soft gradients, rounded corners, organic shapes            |
| **Intelligent** | Clean typography, structured layouts, subtle animations    |
| **Supportive**  | Encouraging copy, gentle transitions, progress celebration |
| **Trustworthy** | Consistent patterns, reliable behavior, privacy-focused    |
| **Modern**      | Contemporary aesthetics, current design trends             |

### Logo & Wordmark

**Current state:** Plain "Wbot" text - lacks personality.

**Recommendation:** Create a wordmark that incorporates an organic shape element - perhaps a subtle wave or breath curve integrated into the "W" or as an accent. The shape should suggest breathing, flow, or emotional waves.

**Color:** Primary teal gradient or deep purple for premium feel.

---

## Color Palette

### Primary Colors (Updated)

Our existing teal needs adjustment for accessibility. The new palette maintains the calming blue-green foundation while ensuring WCAG AA compliance.

```css
/* Primary - Deepened for accessibility (4.5:1 contrast ratio) */
--color-primary: #2d7a78; /* Darker teal - accessible on white */
--color-primary-hover: #246563; /* Hover state */
--color-primary-light: #e8f4f3; /* Backgrounds, subtle highlights */
--color-primary-gradient: linear-gradient(135deg, #2d7a78 0%, #4a9d9a 100%);

/* Secondary - Soft purple for meditation/calm */
--color-secondary: #6b5b95; /* Accessible purple */
--color-secondary-hover: #574a7a;
--color-secondary-light: #f0edf5;

/* Accent - Warm coral for CTAs (use sparingly) */
--color-accent: #e07a5f;
--color-accent-hover: #c96a51;
```

### Expanded Wellness Palette

Based on color psychology research, these colors evoke specific emotional responses:

```css
/* Calming Blues - Trust, serenity, stability */
--color-sky: #7ec8e3; /* Openness, breath */
--color-ocean: #4a90a4; /* Depth, rhythm */
--color-twilight: #1a1a2e; /* Immersive experiences */

/* Grounding Greens - Nature, balance, renewal */
--color-sage: #7ed4a6; /* Release, grounding */
--color-forest: #6b9e7d; /* Nature connection */
--color-moss: #8fbc8f; /* Subtle calm */

/* Soothing Purples - Wisdom, spirituality, introspection */
--color-lavender: #9b8fd4; /* Stillness, meditation */
--color-amethyst: #6b5b95; /* Deep reflection */
--color-dusk: #5d4e7a; /* Evening calm */

/* Warm Accents - Energy, warmth, awakening */
--color-dawn: #f8b4a9; /* Gentle awakening */
--color-sunset: #e6a87c; /* Peaceful transition */
--color-coral: #e07a5f; /* Action, engagement */
```

### Gradient System

Gradients are central to Wbot's visual identity. Use them for:

- Activity overlays (breathing, meditation)
- Empty state backgrounds
- Card hover states
- Hero sections

```css
/* Primary Gradients */
--gradient-calm: linear-gradient(135deg, #e8f4f3 0%, #f0edf5 100%);
--gradient-ocean: linear-gradient(180deg, #7ec8e3 0%, #4a90a4 100%);
--gradient-twilight: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
--gradient-dawn: linear-gradient(135deg, #f8b4a9 0%, #e6a87c 100%);
--gradient-forest: linear-gradient(135deg, #7ed4a6 0%, #6b9e7d 100%);

/* Subtle Background Gradients */
--gradient-page: linear-gradient(180deg, #fafafa 0%, #f5f7fa 100%);
--gradient-sidebar: linear-gradient(180deg, #f8f9fb 0%, #f0f2f5 100%);
```

### Dark Mode (Future)

```css
/* Dark mode palette - for future implementation */
--dark-bg-primary: #0d1117;
--dark-bg-secondary: #161b22;
--dark-bg-tertiary: #21262d;
--dark-text-primary: #e6edf3;
--dark-text-secondary: #8b949e;
--dark-border: #30363d;
```

---

## Typography

### Font Selection

Based on research into calming, readable fonts used in wellness apps:

**Primary Font: Inter**

- Already widely used, excellent readability
- Humanist sans-serif with soft curves
- Extensive weight range for hierarchy

**Alternative Option: Nunito Sans**

- Softer, more rounded than Inter
- Warmer personality while maintaining readability
- Good for a friendlier aesthetic

**Display Font (Headings): Optional addition**

- Consider adding a slightly more expressive font for large headings
- Options: DM Serif Display, Fraunces (variable), or Lora
- Use sparingly for emotional impact

### Type Scale

```css
/* Adjusted for wellness - slightly larger base for readability */
--font-size-xs: 0.75rem; /* 12px - Captions, timestamps */
--font-size-sm: 0.875rem; /* 14px - Secondary text */
--font-size-base: 1rem; /* 16px - Body text */
--font-size-lg: 1.125rem; /* 18px - Large body, chat messages */
--font-size-xl: 1.25rem; /* 20px - Small headings */
--font-size-2xl: 1.5rem; /* 24px - Section headings */
--font-size-3xl: 2rem; /* 32px - Page headings */
--font-size-4xl: 2.5rem; /* 40px - Hero headings */
--font-size-5xl: 3rem; /* 48px - Display text */

/* Line heights - relaxed for wellness content */
--line-height-tight: 1.25;
--line-height-normal: 1.6; /* Increased from 1.5 */
--line-height-relaxed: 1.8; /* For long-form wellness content */
```

### Typography Guidelines

| Element              | Size    | Weight | Line Height | Notes                            |
| -------------------- | ------- | ------ | ----------- | -------------------------------- |
| Body text            | base    | 400    | normal      | Primary reading content          |
| Chat messages        | lg      | 400    | normal      | Slightly larger for easy reading |
| UI labels            | sm      | 500    | tight       | Buttons, navigation              |
| Section headings     | 2xl     | 600    | tight       | Card titles, sections            |
| Page headings        | 3xl-4xl | 700    | tight       | Page titles                      |
| Empty state headings | 2xl     | 600    | tight       | Encouraging tone                 |

---

## Illustration Style

### Approach: Abstract Organic Forms

Rather than character illustrations (Headspace) or photography (Calm), Wbot uses **abstract organic shapes** that represent the fluidity of emotional states.

### Key Characteristics

1. **Organic Shapes**
   - Soft, flowing curves inspired by nature
   - No sharp corners or geometric rigidity
   - Blob-like forms that feel alive and breathing
   - Asymmetrical but balanced compositions

2. **Layered Depth**
   - Multiple translucent layers create depth
   - Glassmorphism effects for modern feel
   - Subtle shadows and glows

3. **Gradient Fills**
   - Use wellness palette gradients
   - Blend complementary colors smoothly
   - Avoid harsh color stops

4. **Gentle Animation**
   - Slow, breathing-like movements
   - Floating or drifting motion
   - Scale and opacity transitions

### Illustration Use Cases

| Context              | Style                   | Purpose                     |
| -------------------- | ----------------------- | --------------------------- |
| Empty chat state     | Large hero illustration | Welcome, inspire engagement |
| Sidebar sections     | Small accent shapes     | Visual interest, wayfinding |
| Activity cards       | Background gradients    | Context and mood setting    |
| Loading states       | Animated organic shapes | Calm waiting experience     |
| Success celebrations | Burst of shapes         | Delight without overwhelm   |
| Error states         | Soft muted shapes       | Maintain calm during issues |

### Creating Illustrations

**Tools:**

- [Blobmaker](https://www.blobmaker.app) - Generate organic SVG shapes
- Figma with blend modes for layered effects
- After Effects / Lottie for animations

**SVG Example - Floating Shapes:**

```svg
<svg viewBox="0 0 200 200">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7ec8e3;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#9b8fd4;stop-opacity:0.6" />
    </linearGradient>
  </defs>
  <path fill="url(#grad1)" d="M44.7,-51.2C59.3,-42.8,73.2,-29.2,76.4,-13.4C79.6,2.4,72.2,20.3,61.4,34.2C50.7,48.1,36.6,58,20.5,63.4C4.3,68.8,-13.8,69.7,-29.5,63.4C-45.2,57,-58.4,43.4,-65.8,27C-73.2,10.6,-74.7,-8.6,-68.3,-24.5C-61.9,-40.3,-47.5,-52.8,-32.4,-61C-17.3,-69.2,-1.5,-73,12.1,-69.9C25.7,-66.7,30.1,-59.6,44.7,-51.2Z" transform="translate(100 100)" />
</svg>
```

---

## Iconography

### Current State

The existing icon set uses `currentColor` for theming - this is good. However, icons need enhancement for a wellness context.

### Icon Style Guidelines

1. **Stroke Weight:** 1.5-2px (softer than typical 2px)
2. **Corner Radius:** Rounded caps and joins
3. **Style:** Line icons with occasional filled variants for active states
4. **Size Scale:** 16px, 20px, 24px, 32px

### Recommended Icon Additions

| Category   | Icons Needed                                     |
| ---------- | ------------------------------------------------ |
| Navigation | Home, Explore/Discover, Library, Profile         |
| Activities | Breathing, Meditation, Journal, Sleep            |
| Progress   | Streak flame, Badge/Achievement, Calendar, Stats |
| Actions    | Play, Pause, Skip, Volume, Timer                 |
| Social     | Share, Favorite/Heart, Community                 |
| Utility    | Settings, Notifications, Help, Info              |

### Icon Animation

Key icons should have subtle animations:

- **Breathing icon:** Gentle pulse/scale animation
- **Streak flame:** Flickering glow effect
- **Loading:** Organic morphing shape
- **Success:** Soft pop with fade

---

## Component Specifications

### 1. Empty State Design

**Current Problem:** Plain text on white background - uninspiring and unhelpful.

**Solution:** Welcoming empty states that guide and inspire.

#### Chat Empty State (Primary Focus)

```
+--------------------------------------------------+
|                                                  |
|           [Organic Shape Illustration]           |
|                                                  |
|              Welcome to Wbot                     |
|                                                  |
|     Your personal wellness companion is here     |
|          to support your journey.                |
|                                                  |
|     +-----------+  +-----------+  +-----------+  |
|     | Breathing |  | Meditate  |  | Journal   |  |
|     |    Icon   |  |    Icon   |  |    Icon   |  |
|     | Start a   |  | Find calm |  | Reflect   |  |
|     | breathing |  | with      |  | on your   |  |
|     | exercise  |  | guidance  |  | thoughts  |  |
|     +-----------+  +-----------+  +-----------+  |
|                                                  |
|   Or try asking:                                 |
|                                                  |
|   +------------------------------------------+   |
|   | "I'm feeling anxious"                    |   |
|   +------------------------------------------+   |
|   +------------------------------------------+   |
|   | "Guide me through a breathing exercise" |   |
|   +------------------------------------------+   |
|   +------------------------------------------+   |
|   | "Help me sleep better"                   |   |
|   +------------------------------------------+   |
|                                                  |
+--------------------------------------------------+
```

**Design Specifications:**

| Element            | Specification                                              |
| ------------------ | ---------------------------------------------------------- |
| Illustration       | 200x200px organic blob composition                         |
| Headline           | font-size-2xl, font-weight-600, color-neutral-800          |
| Subtext            | font-size-base, color-neutral-500, max-width 400px         |
| Quick action cards | 3-column grid, hover elevation, icon + label + description |
| Suggestion chips   | Pill buttons, subtle border, hover background change       |
| Background         | gradient-calm or subtle pattern                            |

#### No Search Results

```
+----------------------------------+
|                                  |
|     [Small muted illustration]   |
|                                  |
|     No results found             |
|                                  |
|     Try adjusting your search    |
|     or browse all activities.    |
|                                  |
|     [Browse All]                 |
|                                  |
+----------------------------------+
```

#### First-Time Feature Discovery

When users encounter a new feature for the first time, show contextual empty states with educational content and gentle nudges.

### 2. Sidebar Navigation

**Current Problem:** Only shows conversations, doesn't communicate app capabilities.

**Solution:** Structured sidebar with feature discovery and progress.

#### Sidebar Structure

```
+---------------------------+
|  [Logo]        [Collapse] |
+---------------------------+
|                           |
|  [Avatar] Username        |
|  [Streak: 7 days]         |
|                           |
+---------------------------+
|  + New Conversation       |
+---------------------------+
|                           |
|  DISCOVER                 |
|  > Breathing Exercises    |
|  > Meditations            |
|  > Journaling             |
|  > Sleep Stories          |
|                           |
+---------------------------+
|                           |
|  CONVERSATIONS            |
|  [Search conversations]   |
|                           |
|  Today                    |
|  - Morning check-in       |
|  - Anxiety help           |
|                           |
|  Yesterday                |
|  - Sleep meditation       |
|                           |
|  [See all]                |
|                           |
+---------------------------+
|                           |
|  YOUR PROGRESS            |
|  [Mini streak display]    |
|  [Weekly goal: 3/5]       |
|                           |
+---------------------------+
|                           |
|  [Settings]    [Help]     |
|                           |
+---------------------------+
```

#### Sidebar Specifications

| Element         | Specification                                               |
| --------------- | ----------------------------------------------------------- |
| Width           | 280px (desktop), collapsible on mobile                      |
| Background      | gradient-sidebar or solid #f8f9fb                           |
| Section headers | font-size-xs, font-weight-600, uppercase, color-neutral-400 |
| Nav items       | font-size-sm, color-neutral-700, 40px height, left icon     |
| Active state    | Primary color background-light, primary color icon/text     |
| Hover state     | Subtle background change, smooth transition                 |
| Conversations   | Truncated text, time indicator, unread badge                |

### 3. Chat Interface Enhancements

#### Message Bubbles

**User messages:**

- Right-aligned
- Primary gradient background (subtle)
- White or light text
- Rounded corners (18px), bottom-right less rounded

**Assistant messages:**

- Left-aligned
- Light background (#f5f7fa)
- Dark text
- Rounded corners (18px), bottom-left less rounded
- Optional avatar/icon

**System messages:**

- Center-aligned
- Smaller text
- Muted color
- Used for timestamps, session breaks

#### Typing Indicator

Replace standard "..." with organic breathing animation:

- Three dots that softly pulse in sequence
- Or a small organic shape that gently morphs
- Match breathing exercise aesthetic

#### Quick Replies

When appropriate, offer quick reply buttons below assistant messages:

- Pill-shaped buttons
- Border only (not filled)
- Hover fills with primary-light
- Max 3-4 options

### 4. Activity Cards

For displaying breathing exercises, meditations, etc.

```
+----------------------------------------+
|  [Gradient Background]                 |
|                                        |
|  [Icon] Box Breathing                  |
|                                        |
|  4-7-8 breathing technique for         |
|  calming anxiety and stress            |
|                                        |
|  Duration: 5 min  |  Beginner          |
|                                        |
|  [Start]                               |
|                                        |
+----------------------------------------+
```

**Specifications:**

- Border-radius: 16px
- Padding: 24px
- Background: Subtle gradient or glassmorphism
- Hover: Slight elevation (shadow-md)
- Icon: 32px, matching activity type color

### 5. Progress & Gamification

#### Streak Display

```
+---------------------------+
|  [Flame Icon]  7          |
|  Day Streak               |
|                           |
|  Keep going! You're on    |
|  your longest streak yet. |
+---------------------------+
```

**Design:**

- Flame icon with warm gradient (dawn colors)
- Large number display (font-size-3xl)
- Encouraging microcopy
- Subtle celebration animation at milestones (7, 14, 30, 60, 90 days)

#### Achievement Badges

Badge design principles:

- Circular shape (consistent with wellness aesthetic)
- Two states: locked (grayscale, low opacity) and unlocked (full color)
- Subtle animation on unlock
- Progress indicator for in-progress badges

**Badge Categories:**
| Category | Examples |
|----------|----------|
| Consistency | First Week, Month Master, Year of Wellness |
| Exploration | Try All Activities, Night Owl (sleep), Early Bird (morning) |
| Milestones | 10 Sessions, 100 Minutes, 50 Conversations |
| Mastery | Breathing Pro, Meditation Maven |

#### Weekly Goals

Simple progress visualization:

- 5 circles representing weekdays
- Filled circles for completed days
- Current day highlighted
- Text showing progress (e.g., "3 of 5 days")

---

## Animation & Motion

### Principles

1. **Purpose:** Every animation should serve a purpose - guide attention, provide feedback, or create emotional response
2. **Subtlety:** Movements should be gentle and never jarring
3. **Consistency:** Use consistent timing and easing across the app
4. **Performance:** Prefer CSS animations and transforms over JavaScript when possible

### Timing Functions

```css
/* Easing curves */
--ease-gentle: cubic-bezier(0.4, 0, 0.2, 1); /* Default, smooth */
--ease-breath: cubic-bezier(0.4, 0, 0.6, 1); /* Breathing animations */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Celebratory moments */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1); /* Enter animations */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1); /* Exit animations */

/* Duration scale */
--duration-instant: 100ms; /* Micro-interactions */
--duration-fast: 200ms; /* Button clicks, toggles */
--duration-normal: 300ms; /* Standard transitions */
--duration-slow: 500ms; /* Larger movements */
--duration-slower: 800ms; /* Emphasis animations */
--duration-breath: 4000ms; /* Breathing cycle timing */
```

### Animation Catalog

| Animation | Duration | Easing     | Use Case              |
| --------- | -------- | ---------- | --------------------- |
| Fade in   | normal   | gentle     | Content appearing     |
| Scale in  | normal   | decelerate | Modals, cards         |
| Slide up  | slow     | decelerate | Toast notifications   |
| Pulse     | breath   | breath     | Breathing indicators  |
| Shake     | fast     | gentle     | Error states (subtle) |
| Bounce    | normal   | bounce     | Success celebrations  |
| Float     | slower   | gentle     | Decorative elements   |

### Micro-Interactions

**Button hover:**

```css
.button {
  transition:
    transform var(--duration-fast) var(--ease-gentle),
    box-shadow var(--duration-fast) var(--ease-gentle);
}
.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.button:active {
  transform: translateY(0);
}
```

**Card hover:**

```css
.card {
  transition:
    transform var(--duration-normal) var(--ease-gentle),
    box-shadow var(--duration-normal) var(--ease-gentle);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

---

## Accessibility Requirements

### Color Contrast

**Current Issue:** Button contrast ratio is 3.19:1 (requires 4.5:1).

**Solution:** All text must meet these minimum ratios:

- Normal text: 4.5:1
- Large text (18px+ or 14px+ bold): 3:1
- UI components: 3:1

**Updated Accessible Colors:**

```css
/* Accessible primary for text on white */
--color-primary-text: #2d7a78; /* 4.5:1 on white */

/* Accessible primary for buttons */
--color-primary-button: #1a5c5a; /* 4.5:1 with white text */
```

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Screen Reader Support

- All icons must have `aria-label` or be `aria-hidden` with adjacent text
- Breathing animations must have text alternatives
- Progress indicators must announce changes
- Activity overlays must trap focus

### Motion Preferences

Respect user's reduced motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Targets

Minimum touch target size: 44x44px (Apple) / 48x48px (Material Design)

---

## Loading & Error States

### Loading States

**Skeleton Loaders:**

- Use for content that takes 1-3 seconds to load
- Match the shape of expected content
- Subtle pulse animation
- Gradient shimmer effect

**Organic Loading Indicator:**

- For indeterminate waits
- Morphing organic shape animation
- Primary color with opacity variations
- Center-screen with semi-transparent overlay for blocking loads

### Error States

**Design Principles:**

- Maintain calm aesthetic even in errors
- Use muted coral/warm colors (not harsh red)
- Provide clear next steps
- Include retry action when applicable

**Error Message Pattern:**

```
+--------------------------------+
|  [Soft illustration]           |
|                                |
|  Something went wrong          |
|                                |
|  We couldn't load your data.   |
|  This usually fixes itself.    |
|                                |
|  [Try Again]   [Contact Help]  |
+--------------------------------+
```

### Success States

**Toast Notifications:**

- Slide in from top or bottom
- Auto-dismiss after 4 seconds
- Green/sage accent color
- Checkmark icon with subtle bounce animation

---

## Implementation Priority

### Phase 1: Foundation (Critical)

1. **Fix accessibility issues**
   - Update primary button color for 4.5:1 contrast
   - Add focus states to all interactive elements
   - Ensure all icons have proper labels

2. **Update color variables**
   - Add new accessible primary colors
   - Add expanded wellness palette
   - Add gradient definitions

3. **Typography refinements**
   - Increase base line-height to 1.6
   - Ensure consistent type scale usage

### Phase 2: Empty States (High Priority)

4. **Create chat empty state component**
   - Design and implement illustration
   - Add quick action cards
   - Add conversation starters

5. **Add loading skeletons**
   - Chat message skeletons
   - Sidebar conversation skeletons
   - Activity card skeletons

### Phase 3: Sidebar Enhancement (High Priority)

6. **Restructure sidebar**
   - Add Discover section with feature categories
   - Add user profile/streak area
   - Add progress section
   - Improve conversation list

### Phase 4: Visual Polish (Medium Priority)

7. **Create illustration system**
   - Design organic shape components
   - Create animation library (Lottie)
   - Implement decorative elements

8. **Add micro-interactions**
   - Button hover/active states
   - Card hover effects
   - Success animations

### Phase 5: Gamification (Medium Priority)

9. **Implement streak system**
   - Streak display component
   - Milestone celebrations
   - Streak recovery prompts

10. **Add achievement badges**
    - Badge design system
    - Progress tracking
    - Unlock animations

### Phase 6: Advanced Features (Lower Priority)

11. **Dark mode support**
    - Complete dark color palette
    - Theme toggle component
    - System preference detection

12. **Enhanced animations**
    - Page transitions
    - Activity intro animations
    - Celebration effects

---

## Design Resources

### Inspiration Sources

- [Headspace Design System](https://www.figma.com/blog/building-a-design-system-that-breathes-with-headspace/)
- [Calm App UI on UI Sources](https://uisources.com/app/calm)
- [Balance Meditation App Design](https://onno.studio/Balance-Meditation-App-Design)
- [Meditation App UI on Mobbin](https://mobbin.com)
- [Wellness Color Psychology](https://www.uxmatters.com/mt/archives/2024/07/leveraging-the-psychology-of-color-in-ux-design-for-health-and-wellness-apps.php)

### Tools

- [Blobmaker](https://www.blobmaker.app) - Generate organic SVG shapes
- [Coolors](https://coolors.co) - Color palette generator
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Accessibility testing
- [Lottie](https://lottiefiles.com) - Animation library

### Figma Resources

- [Headspace Design UI Kit](https://www.figma.com/community/file/1011946115965632470)
- [Freud UI Kit: AI Mental Health App](https://www.figma.com/community/file/1334786732856608238)
- [Meditation App UI](https://www.figma.com/community/file/882888114457713282)

---

## Appendix: Research Sources

This style guide was informed by research from:

- [Headspace Design Case Study - MetaLab](https://www.metalab.com/work/headspace)
- [Headspace Rebrand - It's Nice That](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424)
- [Figma: Building a Design System That Breathes with Headspace](https://www.figma.com/blog/building-a-design-system-that-breathes-with-headspace/)
- [UXmatters: Designing Calm](https://www.uxmatters.com/mt/archives/2025/05/designing-calm-ux-principles-for-reducing-users-anxiety.php)
- [UXmatters: Color Psychology in Health Apps](https://www.uxmatters.com/mt/archives/2024/07/leveraging-the-psychology-of-color-in-ux-design-for-health-and-wellness-apps.php)
- [Big Human: Trends in Mindfulness App Design 2026](https://www.bighuman.com/blog/trends-in-mindfulness-app-design)
- [Purrweb: Meditation App Design Tips](https://www.purrweb.com/blog/designing-a-meditation-app-tips-step-by-step-guide/)
- [Sendbird: Chatbot UI Examples](https://sendbird.com/blog/chatbot-ui)
- [Carbon Design System: Empty States](https://carbondesignsystem.com/patterns/empty-states-pattern/)
- [NN/g: Empty State Interface Design](https://www.nngroup.com/articles/empty-state-interface-design/)
- [Plotline: Streaks and Milestones for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
- [Trophy: Health Gamification Examples](https://trophy.so/blog/health-gamification-examples)
- [ONNO Studio: Balance Meditation App Design](https://onno.studio/Balance-Meditation-App-Design)

---

_Last updated: January 8, 2026_
