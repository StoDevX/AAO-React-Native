import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
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

/**
 * True when a fetched payload has all three shapes the parser requires.
 * Not full schema validation -- just enough to catch a malformed or
 * unrelated JSON response before it overwrites the last-known-good config.
 */
function isValidSelectorConfig(payload: unknown): payload is SelectorConfig {
	let shapes = (payload as Partial<SelectorConfig> | undefined)?.shapes
	return Boolean(shapes?.resultList && shapes.categoryList && shapes.itemList)
}

export const useSelectorConfigStore = create<SelectorConfigStore>()(
	persist(
		(set) => ({
			config: DEFAULT_SELECTOR_CONFIG,
			refresh: async () => {
				try {
					let response = await fetch(SELECTOR_CONFIG_URL)
					if (!response.ok) {
						Sentry.captureMessage(
							`Helpdesk selector config refresh failed: ${SELECTOR_CONFIG_URL} responded with status ${response.status}`,
							{level: 'warning'},
						)
						return
					}

					let payload: unknown = await response.json()

					if (!isValidSelectorConfig(payload)) {
						Sentry.captureMessage(
							`Helpdesk selector config refresh fetched a malformed payload from ${SELECTOR_CONFIG_URL} -- missing one or more required shapes`,
							{level: 'warning'},
						)
						return
					}

					set({config: payload})
				} catch (error) {
					// Leave the store's current config alone -- the last
					// successful remote fetch, or the bundled default.
					Sentry.captureException(error)
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
