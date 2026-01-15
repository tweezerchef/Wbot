# Direct Navigation Backend Integration TODOs

This document outlines the backend integration tasks needed for the direct navigation feature in the sidebar (`ActivityRenderer.tsx`).

## Overview

The sidebar now allows users to directly access wellness activities without going through the AI chat flow. Currently, components render with placeholder data and callbacks that simply close the overlay. Backend integration is needed to:

1. Track session data and completions
2. Fetch real user data for gamification
3. Enable guided meditation track selection and playback

---

## Breathing Exercises

**File:** `apps/web/src/features/navigation/components/ActivityRenderer/ActivityRenderer.tsx`

### WimHofExercise (line ~128)

```typescript
onComplete={() => {
  // TODO: Send completion stats to backend for session tracking
  onClose();
}}
```

**Task:** When user completes a Wim Hof session, send session data to backend including:

- Number of rounds completed
- Retention times per round
- Total session duration
- Timestamp

### ImmersiveBreathing (line ~146)

```typescript
onComplete={() => {
  // TODO: Send completion stats to backend for session tracking
  onClose();
}}
```

**Task:** When user completes a breathing exercise, send session data to backend including:

- Technique used (box, 4-7-8, coherent, deep_calm)
- Number of cycles completed
- Total session duration
- Timestamp

---

## Meditation

### TimerMeditation (line ~168)

```typescript
onComplete={() => {
  // TODO: Send completion to backend
  onClose();
}}
```

**Task:** When timer meditation completes, send session data to backend including:

- Duration (minutes)
- Ambient sounds used
- Binaural beats settings
- Timestamp

### GuidedMeditation - Track Selection (line ~175-185)

```typescript
case 'guided':
  // Guided meditation requires a track selection
  // For now, show the library to browse and select
  return (
    <MeditationLibrary
      onPlay={(_meditation) => {
        // TODO: Start guided meditation with selected track
        // For now, just close - will integrate track playback later
        onClose();
      }}
    />
  );
```

**Task:** When user selects a track from the library:

1. Convert `SavedMeditation` to `MeditationTrack` format
2. Transition to `GuidedMeditation` component with selected track
3. Track playback session in backend

### MeditationLibrary (line ~191)

```typescript
onPlay={(_meditation) => {
  // TODO: Handle track selection - start playback
}}
```

**Task:** Implement track playback flow:

1. Load the selected meditation's audio
2. Start playback in a dedicated player component
3. Track listen session in backend

---

## Wellness

### MoodCheck (line ~217)

```typescript
onSelect={(_mood) => {
  // TODO: Save mood to backend
  onClose();
}}
```

**Task:** When user selects a mood:

1. Save mood entry to database with timestamp
2. Associate with user's wellness profile
3. Consider showing mood history/trends

---

## Gamification

### BadgeGrid (line ~232)

```typescript
case 'badges':
  // TODO: Fetch actual badges from backend
  return <BadgeGrid badges={PLACEHOLDER_BADGES} />;
```

**Task:** Replace placeholder badges with real user data:

1. Create API endpoint to fetch user's badges
2. Include unlock status, progress percentage, unlock dates
3. Handle loading and error states

### StreakDisplay (line ~236)

```typescript
case 'streak':
  // TODO: Fetch actual streak from backend
  return <StreakDisplay streakDays={7} />;
```

**Task:** Fetch real streak data:

1. Create API endpoint to get user's current streak
2. Include streak history for visual display
3. Handle streak break/recovery logic

---

## Implementation Priority

1. **High Priority** - Session tracking (breathing, meditation completions)
2. **High Priority** - Mood check persistence
3. **Medium Priority** - Gamification data fetching (badges, streaks, goals)
4. **Medium Priority** - Guided meditation track selection flow

---

## Related Files

- `apps/web/src/features/navigation/components/ActivityRenderer/ActivityRenderer.tsx` - Main renderer
- `apps/web/src/features/navigation/types.ts` - DirectComponent type definitions
- `apps/web/src/features/chat/components/ChatPage/ChatPage.tsx` - Integration with ActivityOverlay
