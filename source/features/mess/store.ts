import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import {ZODIAC_SIGNS} from './lib/zodiac'
import type {ZodiacSign} from './types'

/** What an issue's tile shows for the stories read: coffee rings, tea rings, or nothing. */
export type StainKind = 'coffee' | 'tea' | 'none'

type MessStore = {
	/** The sign the reader last read; Horoscopes posts open on it */
	lastSign: ZodiacSign | null
	setSign: (sign: ZodiacSign) => void
	/** Every story the reader has opened, by post id, in the order first opened */
	openedStories: number[]
	recordOpened: (id: number) => void
	stainKind: StainKind
	setStainKind: (kind: StainKind) => void
}

type Saved = Pick<MessStore, 'lastSign' | 'openedStories' | 'stainKind'>

/** Version 1 held the sign alone; it keeps the sign and starts with nothing read. */
export function migrate(state: unknown, _version: number): Saved {
	let sign =
		typeof state === 'object' && state !== null && 'lastSign' in state ? state.lastSign : null
	return {
		lastSign: ZODIAC_SIGNS.find((known) => known === sign) ?? null,
		openedStories: [],
		stainKind: 'coffee',
	}
}

export const useMessStore = create<MessStore>()(
	persist(
		(set) => ({
			lastSign: null,
			setSign: (sign) => set({lastSign: sign}),
			openedStories: [],
			recordOpened: (id) =>
				set((state) =>
					state.openedStories.includes(id) ? state : {openedStories: [...state.openedStories, id]},
				),
			stainKind: 'coffee',
			setStainKind: (kind) => set({stainKind: kind}),
		}),
		{
			name: 'mess-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 2,
			migrate,
		},
	),
)
