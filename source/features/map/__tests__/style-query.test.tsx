import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react-native'
import * as React from 'react'
import {fetchManifest, ID_PROPERTY, REL_MAP_STYLE, type Jrd} from '@frogpond/data-sources'

import {campusById} from '../../../campuses'
import {MAP_STYLE_TYPE, stolafMapStyleOptions, useMapStyleUrl} from '../style-query'
import {MAP_STYLE_URL} from '../urls'

const STOLAF_URL = campusById('edu.stolaf').api.defaultUrl

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
}))

function manifestWith(href: string, id = 'stolaf-light'): Jrd {
	return {
		subject: 'https://stolaf.edu',
		links: [
			{
				rel: REL_MAP_STYLE,
				href,
				type: MAP_STYLE_TYPE,
				properties: {[ID_PROPERTY]: id},
			},
		],
	} as unknown as Jrd
}

function wrapper({children}: {children: React.ReactNode}) {
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

let client: QueryClient

beforeEach(() => {
	client = new QueryClient()
	// A manifest that says nothing about the style: the shipped entry stands.
	;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue({
		subject: 'https://stolaf.edu',
		links: [],
	} as unknown as Jrd)
})

afterEach(() => {
	jest.clearAllMocks()
})

describe('useMapStyleUrl', () => {
	// Until the published manifest arrives, the style is the shipped entry,
	// which names ccc-server.
	test("draws St. Olaf's shipped style on the server, in light and dark", async () => {
		let light = await renderHook(() => useMapStyleUrl('stolaf', 'light'), {wrapper})
		let dark = await renderHook(() => useMapStyleUrl('stolaf', 'dark'), {wrapper})
		expect(light.result.current).toBe(`${STOLAF_URL}map/style`)
		expect(dark.result.current).toBe(`${STOLAF_URL}map/style-dark`)
	})

	// Carleton's style has no dark variant, and is not in the manifest.
	test("keeps Carleton's basemap, in dark mode too", async () => {
		let {result} = await renderHook(() => useMapStyleUrl('carleton', 'dark'), {wrapper})
		expect(result.current).toBe(MAP_STYLE_URL)
	})

	test('follows the published manifest when it names another address', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(
			manifestWith('https://maps.example.test/style.json'),
		)
		let {result} = await renderHook(() => useMapStyleUrl('stolaf', 'light'), {wrapper})
		await waitFor(() => expect(result.current).toBe('https://maps.example.test/style.json'))
	})
})

describe('stolafMapStyleOptions', () => {
	test('falls back to the shipped entry when the manifest lacks the style', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue({
			subject: 'https://stolaf.edu',
			links: [],
		} as unknown as Jrd)
		let queryFn = stolafMapStyleOptions('dark').queryFn as () => Promise<string>
		await expect(queryFn()).resolves.toBe('map/style-dark')
	})
})
