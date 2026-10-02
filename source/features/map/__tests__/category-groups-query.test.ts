import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient} from '@tanstack/react-query'
import {
	fetchManifest,
	fetchSourceBody,
	ID_PROPERTY,
	REL_MAP_CATEGORIES,
	type Jrd,
} from '@frogpond/data-sources'

import {BUNDLED_MAP_CATEGORIES, mapCategoriesOptions} from '../category-groups-query'
import type {MapCategoryTable} from '../lib/category-groups'

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
	stolaf: {
		groups: [{label: 'Dining', categories: ['dining'], icon: 'fork.knife', gradient: 'orange'}],
		icons: [],
	},
	carleton: {groups: [], icons: []},
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
			data: {
				stolaf: {groups: [{label: 'Dining', categories: 'dining'}], icons: []},
				carleton: {groups: [], icons: []},
			},
		})
		await expect(run()).rejects.toThrow('map-categories')
	})

	// A released app can meet a file published for a newer one: an icon that is
	// no longer a string would reach the grid's SF Symbol and fail there.
	test('refuses an entry whose icon is not a string', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
			data: {
				stolaf: {
					groups: [
						{
							label: 'Dining',
							categories: ['dining'],
							icon: {name: 'fork.knife'},
							gradient: 'orange',
						},
					],
					icons: [],
				},
				carleton: {groups: [], icons: []},
			},
		})
		await expect(run()).rejects.toThrow()
	})

	// A file this build cannot read fails the same way every time, so
	// fetching it again only repeats the failure.
	test('does not retry a file it cannot read, but retries a failed fetch', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
			data: {stolaf: {groups: [], icons: []}},
		})
		let unreadable = await run().catch((error: unknown) => error)
		let retry = mapCategoriesOptions.retry as (count: number, error: unknown) => boolean
		expect(retry(0, unreadable)).toBe(false)
		expect(retry(0, new Error('offline'))).toBe(true)
		expect(retry(3, new Error('offline'))).toBe(false)
	})

	// A table restored from the persisted cache never passed through the
	// fetch, so one an older build saved in an older shape reaches the
	// picker unchecked unless it is checked again on the way out.
	test('reads an unreadable cached table as the bundled copy', () => {
		let select = mapCategoriesOptions.select as (table: unknown) => MapCategoryTable
		let olderShape = {stolaf: PUBLISHED.stolaf.groups, carleton: []}
		expect(select(olderShape)).toBe(BUNDLED_MAP_CATEGORIES)
	})

	test('reads a readable cached table as itself', () => {
		let select = mapCategoriesOptions.select as (table: unknown) => MapCategoryTable
		expect(select(PUBLISHED)).toEqual(PUBLISHED)
	})

	// The bundled copy is there from the start and stays when the live file
	// cannot be had, rather than a failure leaving the grid with nothing.
	test('keeps the bundled copy when the fetch fails', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<never>>).mockRejectedValue(new Error('offline'))
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		try {
			await client
				.query({...mapCategoriesOptions, retry: false, networkMode: 'always', staleTime: 0})
				.catch(() => undefined)
			expect(client.getQueryData(mapCategoriesOptions.queryKey)).toEqual(BUNDLED_MAP_CATEGORIES)
		} finally {
			client.clear()
		}
	})
})
