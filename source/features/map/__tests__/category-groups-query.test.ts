import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient} from '@tanstack/react-query'
import {
	fetchManifest,
	fetchSourceBody,
	ID_PROPERTY,
	REL_MAP_CATEGORIES,
	type Jrd,
} from '@frogpond/data-sources'

import {mapCategoriesOptions} from '../category-groups-query'
import type {CampusMapCategories, MapCategoryTable} from '../lib/category-groups'

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
			href: 'map/categories',
			type: 'application/vnd.frogpond.map-categories+json',
			properties: {[ID_PROPERTY]: 'stolaf'},
		},
	],
} as unknown as Jrd

const STOLAF: CampusMapCategories = {
	groups: [{label: 'Dining', categories: ['dining'], icon: 'fork.knife', gradient: 'orange'}],
	icons: [],
}

/** The file as 2.9's release candidates read it: keyed by their campus ids. */
const PUBLISHED = {stolaf: STOLAF, carleton: {groups: [], icons: []}}

/** The same table as this build holds it. */
const TABLE: MapCategoryTable = {'edu.stolaf': STOLAF, 'edu.carleton': {groups: [], icons: []}}

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
		await expect(run()).resolves.toEqual(TABLE)
	})

	// React Query keeps a table it already has when a fetch fails.
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
		await expect(run()).resolves.toEqual(TABLE)
		expect(fetchSourceBody).toHaveBeenCalledWith(
			'map/categories',
			expect.anything(),
			'Map categories',
		)
	})

	test('reads reverse-DNS keys too', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({data: TABLE})
		await expect(run()).resolves.toEqual(TABLE)
	})

	// A campus the file leaves out has no groups, and the picker lists every
	// place; a key naming no campus this build has is skipped, whatever its shape.
	test('reads a file missing a campus, and skips one naming an unknown campus', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
			data: {stolaf: STOLAF, macalester: 'not a table'},
		})
		await expect(run()).resolves.toEqual({'edu.stolaf': STOLAF})
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
			data: {stolaf: {groups: 'dining', icons: []}},
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
	test('reads an unreadable cached table as none', () => {
		let select = mapCategoriesOptions.select as (table: unknown) => MapCategoryTable | undefined
		let olderShape = {stolaf: STOLAF.groups, carleton: []}
		expect(select(olderShape)).toBeUndefined()
	})

	test('reads a readable cached table as itself', () => {
		let select = mapCategoriesOptions.select as (table: unknown) => MapCategoryTable | undefined
		expect(select(TABLE)).toEqual(TABLE)
	})

	test('has no table when the first fetch fails', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<never>>).mockRejectedValue(new Error('offline'))
		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		try {
			await client
				.query({...mapCategoriesOptions, retry: false, networkMode: 'always', staleTime: 0})
				.catch(() => undefined)
			expect(client.getQueryData(mapCategoriesOptions.queryKey)).toBeUndefined()
		} finally {
			client.clear()
		}
	})
})
