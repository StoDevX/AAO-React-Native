import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
import {
	fetchManifest,
	fetchSourceBody,
	REL_HELPDESK_SELECTORS,
	resolveSource,
} from '@frogpond/data-sources'
import type {QueryClient} from '@tanstack/react-query'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import type {SelectorConfig} from './types'
import {DEFAULT_SELECTOR_CONFIG} from './default-selectors'

/**
 * This build's vendor media type for the published selector config -- see
 * data/sources.yaml and data/helpdesk-selectors.yaml.
 */
const SELECTOR_CONFIG_TYPE = 'application/vnd.frogpond.helpdesk-selectors+json'

type SelectorConfigStore = {
	config: SelectorConfig
	refresh: (queryClient: QueryClient) => Promise<void>
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
			refresh: async (queryClient) => {
				try {
					let manifest = await fetchManifest(queryClient)
					let source = resolveSource(manifest, REL_HELPDESK_SELECTORS, 'stolaf', [
						SELECTOR_CONFIG_TYPE,
					])

					// This is a fire-and-forget background refresh with no natural
					// cancellation point of its own, so it gets a controller whose
					// signal is never aborted rather than threading one through from
					// a caller.
					let controller = new AbortController()
					let body = await fetchSourceBody(
						source.href,
						controller.signal,
						'Helpdesk selector config',
					)
					// data/helpdesk-selectors.yaml is bundled generically (see
					// scripts/convert-data-file.mjs), which wraps its parsed YAML as
					// `{data: ...}` rather than publishing it at the document root.
					let payload = (body as {data?: unknown}).data

					if (!isValidSelectorConfig(payload)) {
						Sentry.captureMessage(
							`Helpdesk selector config refresh fetched a malformed payload from ${source.href} -- missing one or more required shapes`,
							{level: 'warning'},
						)
						return
					}

					set({config: payload})
				} catch (error) {
					// Leave the store's current config alone -- the last
					// successful remote fetch, or the bundled default. Covers both a
					// resolution failure (no matching or supported source) and a
					// network/parse failure fetching the source's body.
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
