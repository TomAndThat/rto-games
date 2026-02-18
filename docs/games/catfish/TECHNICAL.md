# Catfish Game - Technical Documentation

Technical implementation details and development guidance for the Catfish game.

---

## UI Context System

### Overview

The Catfish game uses a centralized UI Context (`UIContext.tsx`) to manage shared UI elements across all game views. This provides a consistent, reusable API for notifications and other UI components.

**Location**: `apps/games/app/catfish/contexts/UIContext.tsx`

### Architecture

- **Context Provider**: `UIProvider` wraps the entire Catfish layout
- **Hook**: `useCatfishUI()` provides access to UI controls from any component
- **Design**: Extensible architecture allows adding modals, toasts, and other UI elements in future

### Current Features

#### Notifications

Animated notification bar that slides down from the top of the screen with:

- Auto-dismiss after configurable duration (default: 5000ms)
- Manual dismiss with X button
- Customizable background and text colours
- Slide-down/slide-up animations (300ms)
- Single notification display (new notifications replace existing ones)

---

## NotificationBar Component

**Location**: `apps/games/app/catfish/components/NotificationBar/`

### Props

```typescript
interface NotificationBarProps {
  text: string; // Notification message
  bgColor?: string; // Tailwind background class (default: "bg-owl-green")
  textColor?: string; // Tailwind text colour class (default: "text-white")
  onDismiss: () => void; // Callback when user dismisses
  isExiting?: boolean; // Internal animation state
}
```

### Responsive Design

Uses breakpoint-specific divider images for optimal visual quality at each screen size:

- `notification-bar-sm.png` - Mobile (< 640px)
- `notification-bar-md.png` - Small tablets (640px - 768px)
- `notification-bar-lg.png` - Tablets (768px - 1024px)
- `notification-bar-xl.png` - Desktop (1024px - 1280px)
- `notification-bar-xxl.png` - Large desktop (1280px - 1536px)

Images are swapped using Tailwind responsive classes to ensure crisp rendering at all viewport sizes.

---

## Usage Examples

### Basic Notification

```tsx
"use client";

import { useCatfishUI } from "../../contexts/UIContext";

export default function MyView() {
  const { showNotification } = useCatfishUI();

  const handleAction = () => {
    showNotification({
      text: "Action completed successfully!",
    });
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

### Custom Styling

```tsx
showNotification({
  text: "Warning: Time is running out!",
  bgColor: "bg-red-500",
  textColor: "text-yellow-300",
  duration: 3000, // 3 seconds
});
```

### Manual Dismissal Only

```tsx
showNotification({
  text: "This notification won't auto-dismiss",
  duration: Infinity, // Never auto-dismiss
});
```

---

## Technical Decisions

### Why Context Over State Management?

- **Simplicity**: No external state management library needed for UI elements
- **Scope**: UI state is local to Catfish game, doesn't need global app state
- **Performance**: React Context is sufficient for infrequent UI updates
- **Extensibility**: Easy to add new UI controls without restructuring

### Why Single Notification?

- **UX**: Party game context - important messages should be prominent, not stacked
- **Simplicity**: Avoids queue management complexity
- **Performance**: Minimal DOM updates
- **Design**: Cleaner UI without notification clutter

### Animation Approach

CSS animations over JavaScript for:

- **Performance**: GPU-accelerated transforms
- **Smoothness**: Native browser optimization
- **Maintainability**: Declarative styles easier to modify

---

## Future Enhancements

Potential additions to the UI Context system:

- **Modals**: Game rules, player info, confirmations
- **Toast notifications**: Non-intrusive status updates
- **Loading states**: Waiting for other players
- **Timer displays**: Round countdown UI

---

## Related Files

- **Context**: `apps/games/app/catfish/contexts/UIContext.tsx`
- **Component**: `apps/games/app/catfish/components/NotificationBar/index.tsx`
- **Styles**: `apps/games/app/catfish/components/NotificationBar/NotificationBar.css`
- **Layout**: `apps/games/app/catfish/layout.tsx` (UIProvider wrapper)
