import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import type {PhotoTone, StainKind} from '@frogpond/mess-issue-tile'
import {ZODIAC_SIGNS} from './lib/zodiac'
import type {ZodiacSign} from './types'

export type {PhotoTone, StainKind}

type MessStore = {
	/** The sign the reader last read; Horoscopes posts open on it */
	lastSign: ZodiacSign | null
	setSign: (sign: ZodiacSign) => void
	/** Every story the reader has opened, by post id, in the order first opened */
	openedStories: number[]
	recordOpened: (id: number) => void
	stainKind: StainKind
	setStainKind: (kind: StainKind) => void
	/** How the issue thumbnails tint their lead photo */
	photoTone: PhotoTone
	setPhotoTone: (tone: PhotoTone) => void
	/** Whether a Variety › Photo story opens in Dark Mode whatever the system's appearance */
	keepPhotoStoriesDark: boolean
	setKeepPhotoStoriesDark: (keep: boolean) => void
}

type Saved = Pick<
	MessStore,
	'lastSign' | 'openedStories' | 'stainKind' | 'photoTone' | 'keepPhotoStoriesDark'
>

/** What a new install starts with, and what a migrated install gets for anything it lacks. */
const DEFAULTS: Saved = {
	lastSign: null,
	openedStories: [],
	stainKind: 'coffee',
	photoTone: 'auto',
	keepPhotoStoriesDark: true,
}

/** Version 1 held the sign alone; it keeps the sign and starts with nothing read. */
export function migrate(state: unknown, _version: number): Saved {
	let sign =
		typeof state === 'object' && state !== null && 'lastSign' in state ? state.lastSign : null
	return {...DEFAULTS, lastSign: ZODIAC_SIGNS.find((known) => known === sign) ?? null}
}

export const useMessStore = create<MessStore>()(
	persist(
		(set) => ({
			...DEFAULTS,
			setSign: (sign) => set({lastSign: sign}),
			recordOpened: (id) =>
				set((state) =>
					state.openedStories.includes(id) ? state : {openedStories: [...state.openedStories, id]},
				),
			setStainKind: (kind) => set({stainKind: kind}),
			setPhotoTone: (tone) => set({photoTone: tone}),
			setKeepPhotoStoriesDark: (keep) => set({keepPhotoStoriesDark: keep}),
		}),
		{
			name: 'mess-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 2,
			migrate,
		},
	),
)
