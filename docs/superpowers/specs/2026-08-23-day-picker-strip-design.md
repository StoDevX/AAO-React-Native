# Day Picker Strip for Event List

A horizontal scrollable calendar strip at the top of the event list, allowing users to tap a day and jump to that day's events.

## Visual Design

```
┌─────────────────────────────────────────────────────┐
│  ●S     M     T     W     T     F     S     S  ... │
│  23    24    25    26    27    28    29    30      │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  Sunday – Aug 23                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ Team Meeting              9 AM              │   │
│  │ Office Hours              2 PM – 4 PM       │   │
│  └─────────────────────────────────────────────┘   │
│  Monday – Aug 24                                    │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

### Day Cells

- **Layout**: Single-letter weekday stacked above date number
- **Size**: ~44pt wide (minimum tap target)
- **Today**: Red filled circle behind date, red weekday letter, always first in strip
- **Selected (non-today)**: Blue filled circle behind date, white text
- **Unselected**: Standard label color, no background

### Date Range

- Starts from today
- Ends at the last day with events in the loaded data
- Only days within the event data window appear

## Component Structure

### New File: `modules/event-list/day-picker-strip.tsx`

```tsx
type Props = {
  days: Moment[]
  selectedDay: Moment | null
  onSelectDay: (day: Moment) => void
  now: Moment
}

export function DayPickerStrip(props: Props): React.ReactNode
```

### Integration in EventList

1. Derive unique days from `events` prop
2. Track selected day via `useNativeState<string | null>` for scroll binding
3. Add `scrollPosition(state)` modifier to `List`
4. Add `id(section.key)` modifier to each `Section`
5. Render `DayPickerStrip` above `List`
6. When day tapped, set `state.value = sectionKey`

## Scroll Coordination

### Tapping a day

1. User taps day in strip
2. `onSelectDay` callback fires
3. Set `scrollTarget.value = sectionKey`
4. SwiftUI animates scroll to that section

### Manual scrolling

1. User scrolls the event list manually
2. `scrollPosition`'s `onChange` callback fires with current section
3. Update strip's selected day to match

## Technical Constraints

- `scrollPosition` modifier requires iOS 17+
- On iOS 16 and below, strip renders but tapping does nothing (graceful degradation)
- If `scrollPosition` doesn't work with `List`, fallback to `ScrollView` + `LazyVStack`

## Conditional Rendering

- Strip hidden when no events or no enabled calendars
- Strip hidden when showing error/empty states (NoticeView)

## Files Changed

- `modules/event-list/day-picker-strip.tsx` — new component
- `modules/event-list/event-list.tsx` — integrate strip and scroll binding
- `modules/event-list/index.ts` — export new component (if needed externally)
