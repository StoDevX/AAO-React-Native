import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import type {SelectorConfig} from './types'
import {DEFAULT_SELECTOR_CONFIG} from './default-selectors'

// TODO(drew): point at the real hosted location once it exists.
export const SELECTOR_CONFIG_URL =
	'https://raw.githubusercontent.com/StoDevX/AAO-helpdesk-selectors/main/selectors.json'

type SelectorConfigStore = {
	config: SelectorConfig
	refresh: () => Promise<void>
}

export const useSelectorConfigStore = create<SelectorConfigStore>()(
	persist(
		(set) => ({
			config: DEFAULT_SELECTOR_CONFIG,
			refresh: async () => {
				try {
					let response = await fetch(SELECTOR_CONFIG_URL)
					if (!response.ok) {
						return
					}
					let config = (await response.json()) as SelectorConfig
					set({config})
				} catch {
					// Leave the store's current config alone -- the last
					// successful remote fetch, or the bundled default.
				}
			},
		}),
		{
			name: 'helpdesk-selector-config',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({config: state.config}),
		},
	),
)
