import {create} from 'zustand'

type DataSourceOverride = {
	/** Whether St. Olaf hours come from this checkout rather than the server. */
	forced: boolean
	setForced: (forced: boolean) => void
}

/**
 * A dev-only override for where St. Olaf's hours come from.
 *
 * St. Olaf only: the bundled file is this repository's data, and Carleton's
 * hours live outside it, so there is nothing to fall back to there.
 *
 * It exists because a field added to the data here reaches a device only after
 * ccc-server redeploys, which makes new fields invisible in the meantime and
 * looks exactly like the code ignoring them.
 */
export const useForceBundledData = create<DataSourceOverride>()((set) => ({
	forced: false,
	setForced: (forced) => set({forced}),
}))
