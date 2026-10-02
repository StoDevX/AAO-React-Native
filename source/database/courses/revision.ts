import {create} from 'zustand'

/**
 * A counter the course read hooks key their queries on, so every read
 * refreshes once when a new catalog is swapped in.
 */
type CourseRevisionStore = {
	revision: number
	bump: () => void
}

const useCourseRevisionStore = create<CourseRevisionStore>((set) => ({
	revision: 0,
	bump: () => set((state) => ({revision: state.revision + 1})),
}))

/** The current revision; rerenders the subscriber on every bump. */
export function useCourseRevision(): number {
	return useCourseRevisionStore((state) => state.revision)
}

/** Called once a new catalog is attached, to refresh every course read. */
export function bumpCourseRevision(): void {
	useCourseRevisionStore.getState().bump()
}
