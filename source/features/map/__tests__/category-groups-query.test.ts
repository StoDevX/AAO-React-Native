import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {
	fetchManifest,
	fetchSourceBody,
	ID_PROPERTY,
	REL_MAP_CATEGORIES,
	type Jrd,
} from '@frogpond/data-sources'

import {BUNDLED_MAP_CATEGORIES, mapCategoriesOptions} from '../category-groups-query'
import type {MapCategoryTable} from '../lib/category-groups'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

// The live path is the one under test; the suite-wide setup runs as a UI test.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

const MANIFEST = {
	subject: 'https://stolaf.edu',
	links: [
		{
			rel: REL_MAP_CATEGORIES,
			href: 'https://stolaf.dev/AAO-React-Native/map-categories.json',
			type: 'application/vnd.frogpond.map-categories+json',
			properties: {[ID_PROPERTY]: 'stolaf'},
		},
	],
} as unknown as Jrd

const PUBLISHED: MapCategoryTable = {
	stolaf: [{label: 'Dining', categories: ['dining'], icon: 'fork.knife', gradient: 'orange'}],
	carleton: [],
}

function run(): Promise<MapCategoryTable> {
	let queryFn = mapCategoriesOptions.queryFn as (context: {
		signal: AbortSignal
	}) => Promise<MapCategoryTable>
	return queryFn({signal: new AbortController().signal})
}

afterEach(() => {
	jest.clearAllMocks()
})

describe('mapCategoriesOptions', () => {
	test('returns the published table', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({data: PUBLISHED})
		await expect(run()).resolves.toEqual(PUBLISHED)
	})

	// React Query keeps a table it already has when a fetch fails; the
	// picker draws the bundled copy only when it has none.
	test('fails when the file cannot be fetched', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<never>>).mockRejectedValue(new Error('offline'))
		await expect(run()).rejects.toThrow('offline')
	})

	// The shipped manifest carries the link, so a live one that lacks it
	// still reaches the published file.
	test("fetches from the shipped manifest's link when the live one has none", async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue({
			subject: 'https://stolaf.edu',
			links: [],
		} as unknown as Jrd)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({data: PUBLISHED})
		await expect(run()).resolves.toEqual(PUBLISHED)
		expect(fetchSourceBody).toHaveBeenCalledWith(
			'https://stolaf.dev/AAO-React-Native/map-categories.json',
			expect.anything(),
			'Map categories',
		)
	})

	// A released app can meet a file published for a newer one; a shape it
	// cannot read must fail the fetch, leaving the bundled copy in place,
	// rather than reach the grid and throw during render.
	test('refuses a file missing a campus', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
			data: {stolaf: PUBLISHED.stolaf},
		})
		await expect(run()).rejects.toThrow('map-categories')
	})

	test('refuses an entry with no list of categories', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
			data: {stolaf: [{label: 'Dining', categories: 'dining'}], carleton: []},
		})
		await expect(run()).rejects.toThrow('map-categories')
	})

	test('bundles both campuses', () => {
		expect(BUNDLED_MAP_CATEGORIES.stolaf.length).toBeGreaterThan(0)
		expect(BUNDLED_MAP_CATEGORIES.carleton.length).toBeGreaterThan(0)
	})
})
