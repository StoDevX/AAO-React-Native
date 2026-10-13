import {create} from 'zustand'

type DataSourceOverride = {
	/** Whether the campus's hours come from its bundled copy (`hours.bundled`) rather than the server. */
	forced: boolean
	setForced: (forced: boolean) => void
}

/**
 * A dev-only override for where a campus's hours and building directories come
 * from, for a campus that bundles a copy in this repository.
 *
 * It exists because a field added to the data here reaches a device only after
 * ccc-server redeploys, which makes new fields invisible in the meantime and
 * looks exactly like the code ignoring them.
 */
export const useForceBundledData = create<DataSourceOverride>()((set) => ({
	forced: false,
	setForced: (forced) => set({forced}),
}))
