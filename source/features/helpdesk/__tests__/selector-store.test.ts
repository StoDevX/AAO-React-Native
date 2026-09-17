import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import * as Sentry from '@sentry/react-native'
import type {QueryClient} from '@tanstack/react-query'

import {DEFAULT_SELECTOR_CONFIG} from '../default-selectors'
import {useSelectorConfigStore} from '../selector-store'

jest.mock('@sentry/react-native', () => ({
	captureMessage: jest.fn(),
	captureException: jest.fn(),
}))

jest.mock('@frogpond/data-sources', () => ({
	fetchManifest: jest.fn(),
	resolveSource: jest.fn(),
	fetchSourceBody: jest.fn(),
	REL_HELPDESK_SELECTORS: 'https://frogpond.tech/rel/helpdesk-selectors',
}))

import {fetchManifest, fetchSourceBody, resolveSource} from '@frogpond/data-sources'

let mockFetchManifest = fetchManifest as jest.MockedFunction<typeof fetchManifest>
let mockResolveSource = resolveSource as jest.MockedFunction<typeof resolveSource>
let mockFetchSourceBody = fetchSourceBody as jest.MockedFunction<typeof fetchSourceBody>

// Never actually resolved against a real manifest -- resolveSource is mocked
// directly below -- so this only needs to be a value fetchManifest can hand
// back.
let manifest = {subject: 'https://stolaf.edu', links: []}

let resolvedSource = {
	id: 'stolaf',
	href: 'https://stolaf.dev/AAO-React-Native/helpdesk-selectors.json',
	type: 'application/vnd.frogpond.helpdesk-selectors+json',
	title: 'Helpdesk Selectors',
}

let malformedConfig = {
	...DEFAULT_SELECTOR_CONFIG,
	shapes: {
		resultList: DEFAULT_SELECTOR_CONFIG.shapes.resultList,
		categoryList: DEFAULT_SELECTOR_CONFIG.shapes.categoryList,
		// itemList intentionally omitted -- this payload is malformed.
	},
}

// The store's refresh() only threads this through to fetchManifest, which is
// mocked above, so the tests never touch a real QueryClient.
let queryClient = {} as QueryClient

describe('useSelectorConfigStore', () => {
	beforeEach(() => {
		useSelectorConfigStore.setState({config: DEFAULT_SELECTOR_CONFIG})
		jest.clearAllMocks()
		mockFetchManifest.mockResolvedValue(manifest)
		mockResolveSource.mockReturnValue(resolvedSource)
	})

	test('starts with the bundled default', () => {
		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})

	test('refresh replaces the config on a successful fetch', async () => {
		let remoteConfig = {...DEFAULT_SELECTOR_CONFIG, version: 2}
		mockFetchSourceBody.mockResolvedValue({data: remoteConfig})

		await useSelectorConfigStore.getState().refresh(queryClient)

		expect(useSelectorConfigStore.getState().config).toEqual(remoteConfig)
		expect(mockFetchSourceBody).toHaveBeenCalledWith(
			resolvedSource.href,
			expect.any(AbortSignal),
			'Helpdesk selector config',
		)
	})

	test('refresh keeps the last-known-good config when resolving the source fails', async () => {
		mockResolveSource.mockImplementation(() => {
			throw new Error('no supported source for rel "..." and id "stolaf"')
		})

		await useSelectorConfigStore.getState().refresh(queryClient)

		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})

	test('refresh reports a resolution failure to Sentry', async () => {
		let error = new Error('no supported source for rel "..." and id "stolaf"')
		mockResolveSource.mockImplementation(() => {
			throw error
		})

		await useSelectorConfigStore.getState().refresh(queryClient)

		expect(Sentry.captureException).toHaveBeenCalledTimes(1)
		expect(Sentry.captureException).toHaveBeenCalledWith(error)
	})

	test('refresh keeps the last-known-good config when the fetch fails', async () => {
		mockFetchSourceBody.mockRejectedValue(new Error('network down'))

		await useSelectorConfigStore.getState().refresh(queryClient)

		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})

	test('refresh reports the network failure to Sentry', async () => {
		let error = new Error('network down')
		mockFetchSourceBody.mockRejectedValue(error)

		await useSelectorConfigStore.getState().refresh(queryClient)

		expect(Sentry.captureException).toHaveBeenCalledTimes(1)
		expect(Sentry.captureException).toHaveBeenCalledWith(error)
	})

	test('refresh keeps the last-known-good config when the payload is missing a required shape', async () => {
		mockFetchSourceBody.mockResolvedValue({data: malformedConfig})

		await useSelectorConfigStore.getState().refresh(queryClient)

		expect(useSelectorConfigStore.getState().config).toEqual(DEFAULT_SELECTOR_CONFIG)
	})

	test('refresh reports a malformed payload to Sentry', async () => {
		mockFetchSourceBody.mockResolvedValue({data: malformedConfig})

		await useSelectorConfigStore.getState().refresh(queryClient)

		expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
		expect(Sentry.captureMessage).toHaveBeenCalledWith(
			expect.stringContaining(resolvedSource.href),
			expect.objectContaining({level: 'warning'}),
		)
	})
})
