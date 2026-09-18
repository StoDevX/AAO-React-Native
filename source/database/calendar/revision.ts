import {create} from 'zustand'

/**
 * A counter the read hooks in `read.ts` key their React Query cache on, so
 * every read invalidates together the moment a write finishes.
 *
 * `expo-sqlite`'s `addDatabaseChangeListener` is the wrong tool for this: it
 * fires once per statement, so `writeSource`'s single transaction -- which
 * runs dozens of inserts -- would thrash every subscribed read as each row
 * lands, rather than settling once when the write actually commits. Bumping
 * this counter by hand, once, after a write transaction returns, invalidates
 * every read exactly once per write instead.
 */
type CalendarRevisionStore = {
	revision: number
	bump: () => void
}

const useCalendarRevisionStore = create<CalendarRevisionStore>((set) => ({
	revision: 0,
	bump: () => set((state) => ({revision: state.revision + 1})),
}))

/** The current revision, for a query key -- rerenders the subscriber on every bump. */
export function useCalendarRevision(): number {
	return useCalendarRevisionStore((state) => state.revision)
}

/** Called once a write transaction commits, to invalidate every read hook in `read.ts`. */
export function bumpCalendarRevision(): void {
	useCalendarRevisionStore.getState().bump()
}
