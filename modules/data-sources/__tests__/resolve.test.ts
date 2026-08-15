import {onlineManager, QueryClient} from '@tanstack/react-query'
import bundled from '../bundled.json'
import {fetchManifest, resolveSource, resolveSources} from '../resolve'
import {ID_PROPERTY, JrdSchema, REL_A_TO_Z, REL_NEWS} from '../types'

const ALL_NEWS_TYPES = [
	'application/vnd.wordpress.v2.posts+json',
	'application/vnd.frogpond.feed-items+json',
]

const manifest = JrdSchema.parse(bundled)

test('the bundled manifest is a valid JRD document', () => {
	expect(manifest.links.length).toBeGreaterThan(0)
})

test('resolves a source by rel and id', () => {
	const source = resolveSource(manifest, REL_NEWS, 'stolaf', ALL_NEWS_TYPES)
	expect(source.href).toContain('wp.stolaf.edu')
	expect(source.type).toBe('application/vnd.wordpress.v2.posts+json')
	expect(source.title).toBe('St. Olaf News')
})

test('lists every source under a rel', () => {
	const ids = resolveSources(manifest, REL_NEWS, ALL_NEWS_TYPES).map((s) => s.id)
	expect(ids).toStrictEqual(['stolaf', 'mess', 'oleville'])
})

test('a-to-z has both the upstream and the extras', () => {
	const ids = resolveSources(manifest, REL_A_TO_Z, [
		'application/vnd.stolaf.a-z+json',
		'application/vnd.frogpond.a-z-extras+json',
	]).map((s) => s.id)
	expect(ids).toStrictEqual(['stolaf', 'extras'])
})

test('rule 3: an unsupported type falls back to the bundled entry', () => {
	const edited = JrdSchema.parse({
		...manifest,
		links: manifest.links.map((link) =>
			link.properties[ID_PROPERTY] === 'stolaf' && link.rel === REL_NEWS
				? {...link, href: 'https://example.test/new', type: 'application/vnd.example.future+json'}
				: link,
		),
	})

	const source = resolveSource(edited, REL_NEWS, 'stolaf', ALL_NEWS_TYPES)
	expect(source.href).toContain('wp.stolaf.edu')
	expect(source.type).toBe('application/vnd.wordpress.v2.posts+json')
})

test('rule 2: a missing source falls back to the bundled entry', () => {
	const edited = JrdSchema.parse({
		...manifest,
		links: manifest.links.filter(
			(link) => !(link.rel === REL_NEWS && link.properties[ID_PROPERTY] === 'stolaf'),
		),
	})

	expect(resolveSource(edited, REL_NEWS, 'stolaf', ALL_NEWS_TYPES).href).toContain('wp.stolaf.edu')
})

test('an unknown rel and id throws rather than returning a wrong source', () => {
	expect(() => resolveSource(manifest, REL_NEWS, 'nonesuch', ALL_NEWS_TYPES)).toThrow(/nonesuch/u)
})

test('resolveSources drops an entry whose fetched and bundled types are both unsupported', () => {
	const edited = JrdSchema.parse({
		...manifest,
		links: manifest.links.map((link) =>
			link.properties[ID_PROPERTY] === 'stolaf' && link.rel === REL_NEWS
				? {...link, type: 'application/vnd.example.future+json'}
				: link,
		),
	})

	// 'stolaf' is unsupported here (both its fetched type and its bundled
	// type -- the real wordpress type -- are excluded), so it must be
	// dropped rather than thrown for the whole list or returned unusable.
	const ids = resolveSources(edited, REL_NEWS, ['application/vnd.frogpond.feed-items+json']).map(
		(s) => s.id,
	)
	expect(ids).toStrictEqual(['mess', 'oleville'])
})

test('resolveSources: an id missing from the fetched document still appears, from the bundled entry', () => {
	const edited = JrdSchema.parse({
		...manifest,
		links: manifest.links.filter(
			(link) => !(link.rel === REL_NEWS && link.properties[ID_PROPERTY] === 'stolaf'),
		),
	})

	const sources = resolveSources(edited, REL_NEWS, ALL_NEWS_TYPES)
	const stolaf = sources.find((s) => s.id === 'stolaf')
	expect(stolaf?.href).toContain('wp.stolaf.edu')
})

test('resolveSources: an id present with an unsupported type still appears, from the bundled entry', () => {
	const edited = JrdSchema.parse({
		...manifest,
		links: manifest.links.map((link) =>
			link.properties[ID_PROPERTY] === 'stolaf' && link.rel === REL_NEWS
				? {...link, href: 'https://example.test/new', type: 'application/vnd.example.future+json'}
				: link,
		),
	})

	const sources = resolveSources(edited, REL_NEWS, ALL_NEWS_TYPES)
	const stolaf = sources.find((s) => s.id === 'stolaf')
	expect(stolaf?.href).toContain('wp.stolaf.edu')
})

test('resolveSources: a fetched-only id with an unsupported type is dropped', () => {
	const edited = JrdSchema.parse({
		...manifest,
		links: [
			...manifest.links,
			{
				rel: REL_NEWS,
				href: 'https://example.test/new-source',
				type: 'application/vnd.example.future+json',
				titles: {und: 'A brand-new source'},
				properties: {[ID_PROPERTY]: 'brand-new'},
			},
		],
	})

	// 'brand-new' has no bundled entry to fall back to, so it must be
	// dropped rather than thrown for the whole list.
	const ids = resolveSources(edited, REL_NEWS, ALL_NEWS_TYPES).map((s) => s.id)
	expect(ids).toStrictEqual(['stolaf', 'mess', 'oleville'])
})

test('fetchManifest resolves to the bundled document rather than hanging while offline', async () => {
	const wasOnline = onlineManager.isOnline()
	onlineManager.setOnline(false)

	// gcTime: 0 keeps QueryClient from scheduling a cache-eviction timer that
	// would otherwise hold the test process open well past this test.
	const queryClient = new QueryClient({defaultOptions: {queries: {gcTime: 0}}})

	try {
		const TIMED_OUT = Symbol('timed out')
		let timer: ReturnType<typeof setTimeout> | undefined
		const timeout = new Promise((resolve) => {
			timer = setTimeout(() => resolve(TIMED_OUT), 2000)
		})

		const result = await Promise.race([fetchManifest(queryClient), timeout])
		clearTimeout(timer)

		expect(result).not.toBe(TIMED_OUT)
		expect(result).toStrictEqual(manifest)
	} finally {
		queryClient.clear()
		onlineManager.setOnline(wasOnline)
	}
})
