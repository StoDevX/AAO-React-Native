import {beforeEach, describe, expect, jest, test} from '@jest/globals'

import {DEFAULT_SELECTOR_CONFIG} from '../default-selectors'
import {useSelectorConfigStore, SELECTOR_CONFIG_URL} from '../selector-store'

describe('useSelectorConfigStore', () => {
	beforeEach(() => {
		useSelectorConfigStore.setState({config: DEFAULT_SELECTOR_CONFIG})
		jest.restoreAllMocks()
	})

	test('starts with the bundled default', () => {
		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})

	test('refresh replaces the config on a successful fetch', async () => {
		let remoteConfig = {...DEFAULT_SELECTOR_CONFIG, version: 2}
		jest.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(remoteConfig),
		} as Response)

		await useSelectorConfigStore.getState().refresh()

		expect(useSelectorConfigStore.getState().config).toEqual(remoteConfig)
		expect(fetch).toHaveBeenCalledWith(SELECTOR_CONFIG_URL)
	})

	test('refresh keeps the last-known-good config when the fetch fails', async () => {
		jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'))

		await useSelectorConfigStore.getState().refresh()

		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})

	test('refresh keeps the last-known-good config when the response is not ok', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue({ok: false} as Response)

		await useSelectorConfigStore.getState().refresh()

		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})
})
