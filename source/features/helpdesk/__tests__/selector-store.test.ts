import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import * as Sentry from '@sentry/react-native'

import {DEFAULT_SELECTOR_CONFIG} from '../default-selectors'
import {useSelectorConfigStore, SELECTOR_CONFIG_URL} from '../selector-store'

jest.mock('@sentry/react-native', () => ({
	captureMessage: jest.fn(),
	captureException: jest.fn(),
}))

let malformedConfig = {
	...DEFAULT_SELECTOR_CONFIG,
	shapes: {
		resultList: DEFAULT_SELECTOR_CONFIG.shapes.resultList,
		categoryList: DEFAULT_SELECTOR_CONFIG.shapes.categoryList,
		// itemList intentionally omitted -- this payload is malformed.
	},
}

describe('useSelectorConfigStore', () => {
	beforeEach(() => {
		useSelectorConfigStore.setState({config: DEFAULT_SELECTOR_CONFIG})
		jest.restoreAllMocks()
		jest.clearAllMocks()
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

	test('refresh reports the network failure to Sentry', async () => {
		let error = new Error('network down')
		jest.spyOn(global, 'fetch').mockRejectedValue(error)

		await useSelectorConfigStore.getState().refresh()

		expect(Sentry.captureException).toHaveBeenCalledTimes(1)
		expect(Sentry.captureException).toHaveBeenCalledWith(error)
	})

	test('refresh keeps the last-known-good config when the response is not ok', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue({ok: false, status: 503} as Response)

		await useSelectorConfigStore.getState().refresh()

		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})

	test('refresh reports a non-ok response to Sentry, including the status', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue({ok: false, status: 503} as Response)

		await useSelectorConfigStore.getState().refresh()

		expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
		expect(Sentry.captureMessage).toHaveBeenCalledWith(
			expect.stringContaining('503'),
			expect.objectContaining({level: 'warning'}),
		)
	})

	test('refresh keeps the last-known-good config when the payload is missing a required shape', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(malformedConfig),
		} as Response)

		await useSelectorConfigStore.getState().refresh()

		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})

	test('refresh reports a malformed payload to Sentry', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(malformedConfig),
		} as Response)

		await useSelectorConfigStore.getState().refresh()

		expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
		expect(Sentry.captureMessage).toHaveBeenCalledWith(
			expect.stringContaining(SELECTOR_CONFIG_URL),
			expect.objectContaining({level: 'warning'}),
		)
	})
})
