import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'
import posts from './fixtures/posts.json'
import categories from './fixtures/categories.json'
import profiles from './fixtures/profiles-390.json'
import {messFeedOptions, staffProfileOptions} from '../query'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

function run<T>(options: {queryFn?: unknown}): Promise<T> {
	let queryFn = options.queryFn as (context: {signal: AbortSignal; queryKey: unknown}) => Promise<T>
	return queryFn({signal: new AbortController().signal, queryKey: []})
}

afterEach(() => {
	jest.clearAllMocks()
})

describe('messFeedOptions', () => {
	// The server's manifest still lists the Mess as ccc-server feed-items. The
	// Mess screen accepts only WordPress, so it falls back to the bundled entry.
	test('reads the WordPress feed even when the live manifest lists feed-items', async () => {
		mockManifest.mockResolvedValue({
			links: [
				{
					rel: 'https://frogpond.tech/rel/news',
					href: 'news/named/mess',
					type: 'application/vnd.frogpond.feed-items+json',
					titles: {und: 'The Olaf Messenger'},
					properties: {'https://frogpond.tech/ns/id': 'mess'},
				},
			],
		} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			Promise.resolve(href.includes('/categories') ? categories : posts),
		)

		let stories = await run<Array<{id: number}>>(messFeedOptions)

		expect(stories.map((s) => s.id)).toStrictEqual([36859, 36911, 36885, 36904, 36843])
		let hrefs = mockBody.mock.calls.map((call) => call[0])
		expect(hrefs).toContain('https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true')
		expect(hrefs).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/categories?per_page=100&_fields=id,name,parent',
		)
	})

	test('fails when the feed cannot be fetched', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockRejectedValue(new Error('offline'))
		await expect(run(messFeedOptions)).rejects.toThrow('offline')
	})
})

describe('staffProfileOptions', () => {
	test('asks for that writer and keeps the newest year', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockResolvedValue(profiles)

		let profile = await run<{year: string} | null>(staffProfileOptions(390))

		expect(profile?.year).toBe('2025-2026')
		expect(mockBody.mock.calls[0]?.[0]).toBe(
			'https://olafmessenger.com/wp-json/wp/v2/staff_profile?staff_name=390&_embed=true',
		)
	})

	test('gives null for a writer with no profile', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockResolvedValue([])
		expect(await run(staffProfileOptions(1))).toBeNull()
	})
})
