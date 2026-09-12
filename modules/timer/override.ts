import {create} from 'zustand'
import type {Moment} from 'moment-timezone'

type NowOverride = {
	/** The moment every clock in the app should report, or null for the real one. */
	frozen: Moment | null
	/** Freeze the app's clock at `m`. */
	freeze: (m: Moment) => void
	/** Hand the app back to the real clock. */
	clear: () => void
}

/**
 * A dev-only override for what the app thinks the time is.
 *
 * It lives here rather than in `source/` because this module is the single
 * place `now` is decided, and it must not import app code. Nothing persists
 * it: a relaunch is always the real clock, because a frozen time that outlived
 * a restart would be indistinguishable from a bug in the hours themselves.
 */
export const useNowOverride = create<NowOverride>()((set) => ({
	frozen: null,
	freeze: (m) => set({frozen: m}),
	clear: () => set({frozen: null}),
}))
