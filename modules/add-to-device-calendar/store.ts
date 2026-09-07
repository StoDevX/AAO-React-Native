import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type SavedEventsStore = {
	savedEvents: Record<string, string>
	markSaved: (eventKey: string, calendarEventId: string) => void
	markRemoved: (eventKey: string) => void
	getSavedEventId: (eventKey: string) => string | null
}

export const useSavedEventsStore = create<SavedEventsStore>()(
	persist(
		(set, get) => ({
			savedEvents: {},
			markSaved: (eventKey, calendarEventId) =>
				set((state) => ({
					savedEvents: {...state.savedEvents, [eventKey]: calendarEventId},
				})),
			markRemoved: (eventKey) =>
				set((state) => {
					let {[eventKey]: _, ...rest} = state.savedEvents
					return {savedEvents: rest}
				}),
			getSavedEventId: (eventKey) => get().savedEvents[eventKey] ?? null,
		}),
		{
			name: 'saved-calendar-events',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
