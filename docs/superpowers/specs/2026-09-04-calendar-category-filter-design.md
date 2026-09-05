# Calendar Category Filter

Filter St. Olaf calendar events by category via a toolbar button that opens a multi-select sheet.

## Requirements

- Multi-select categories with OR logic (event shows if it matches any selected category)
- Explicit "All" toggle that shows all events (selected when no categories are chosen)
- Persist selected categories across app sessions
- Filter button in navigation bar (top right)
- Show all categories from API without curation
- Only applies to St. Olaf TEC calendar; device/iCal events pass through unfiltered

## Data Model

### EventType

Add `categories` field to the shared event type:

```typescript
// modules/event-type/index.ts
export type EventType = {
  // ... existing fields
  readonly categories: readonly string[]
}
```

### WireEvent

Add to the wire event schema:

```typescript
// modules/ccc-calendar/parsers/events.ts
const WireEventSchema = z.object({
  // ... existing fields
  categories: z.array(z.string()).default([]),
})
```

## Parser Changes

### TEC Parser

Extract category names from the API response:

```typescript
// modules/ccc-calendar/parsers/tec-events.ts
const TecCategorySchema = z.object({
  name: z.string(),
})

const TecEventSchema = z.object({
  // ... existing fields
  categories: z.array(TecCategorySchema).default([]),
})

function toWireEvent(event, now): WireEvent {
  return {
    // ... existing fields
    categories: event.categories.map(c => c.name),
  }
}
```

### Other Parsers

`events.ts` (frogpond format) and `ical.ts` return `categories: []` since they don't provide this data.

## State Management

Zustand store with persistence:

```typescript
// source/features/calendar/store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type CalendarFilterStore = {
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  clearCategories: () => void
}

export const useCalendarFilterStore = create<CalendarFilterStore>()(
  persist(
    (set) => ({
      selectedCategories: [],
      setSelectedCategories: (categories) => set({selectedCategories: categories}),
      clearCategories: () => set({selectedCategories: []}),
    }),
    {
      name: 'calendar-filter-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
)
```

## UI Components

### Navigation Bar Button

```tsx
// app/(home)/Calendar.tsx
<Stack.Toolbar placement="right">
  <Stack.Toolbar.Button
    icon="line.3.horizontal.decrease.circle"
    onPress={() => setFilterSheetVisible(true)}
  />
</Stack.Toolbar>
```

### Filter Sheet

Use `@frogpond/filter`'s `ListType` filter with sheet presentation:
- "All" toggle at top (selected when `selectedCategories` is empty)
- List of category names from loaded events
- Checkmarks for selected categories

## Filtering Logic

```typescript
// app/(home)/Calendar.tsx
let {selectedCategories} = useCalendarFilterStore()

let filteredEvents = useMemo(() => {
  if (selectedCategories.length === 0) return events
  return events.filter((e) =>
    e.event.categories.some((cat) => selectedCategories.includes(cat))
  )
}, [events, selectedCategories])

let availableCategories = useMemo(() => {
  let cats = new Set(events.flatMap((e) => e.event.categories))
  return [...cats].sort()
}, [events])
```

Events without categories (device calendar, iCal) always pass through when filtering is active.

## Files to Modify

1. `modules/event-type/index.ts` - add categories field
2. `modules/ccc-calendar/parsers/events.ts` - add categories to WireEvent schema
3. `modules/ccc-calendar/parsers/tec-events.ts` - parse categories from TEC response
4. `modules/ccc-calendar/parsers/ical.ts` - return empty categories array
5. `modules/ccc-calendar/query.ts` - pass categories through convertEvents
6. `source/features/calendar/store.ts` - new Zustand store (new file)
7. `app/(home)/Calendar.tsx` - add toolbar button, filter sheet, filtering logic
