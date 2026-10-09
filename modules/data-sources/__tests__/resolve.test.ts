import {onlineManager, QueryClient} from '@tanstack/react-query'
import bundled from '../bundled.json'
import {expect, jest, test} from '@jest/globals'
import {fetchManifest, hasBundledSource, resolveSource, resolveSources} from '../resolve'
import {setManifestServer} from '../manifest-server'
import {
	CAMPUS_PROPERTY,
	ID_PROPERTY,
	JrdSchema,
	REL_CALENDAR,
	REL_A_TO_Z,
	REL_JOBS,
	REL_NEWS,
	REL_RADIO_NOW_PLAYING,
	REL_RADIO_PLAYER_PAGE,
} from '../types'

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
	expect(ids).toStrictEqual(['stolaf', 'mess', 'oleville', 'carletonian', 'carleton-now'])
})

test('the bundled manifest carries the St. Olaf jobs site', () => {
	const source = resolveSource(manifest, REL_JOBS, 'stolaf', [
		'application/vnd.oracle.recruiting-ce+json',
	])
	expect(source.href).toBe(
		'https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1',
	)
	expect(source.type).toBe('application/vnd.oracle.recruiting-ce+json')
	expect(source.title).toBe('Student Work')
})

test('knows which sources the build ships with, whatever their type', () => {
	expect(hasBundledSource(REL_RADIO_PLAYER_PAGE, 'ksto')).toBe(true)
	expect(hasBundledSource(REL_RADIO_NOW_PLAYING, 'krlx')).toBe(true)
	expect(hasBundledSource(REL_RADIO_PLAYER_PAGE, 'krlx')).toBe(false)
	expect(hasBundledSource(REL_NEWS, 'no-such-source')).toBe(false)
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
	// 'mess' and 'carletonian' are WordPress sources too, so they go the same way.
	const ids = resolveSources(edited, REL_NEWS, ['application/vnd.frogpond.feed-items+json']).map(
		(s) => s.id,
	)
	expect(ids).toStrictEqual(['oleville', 'carleton-now'])
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
	expect(ids).toStrictEqual(['stolaf', 'mess', 'oleville', 'carletonian', 'carleton-now'])
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

test('asks for the manifest only once the app has named its server', async () => {
	let fresh: typeof import('../resolve') | undefined
	jest.isolateModules(() => {
		fresh = jest.requireActual<typeof import('../resolve')>('../resolve')
	})
	let queryFn = fresh?.manifestOptions.queryFn as (context: {
		signal: AbortSignal
	}) => Promise<unknown>
	await expect(queryFn({signal: new AbortController().signal})).rejects.toThrow(
		'setManifestServer has not run; source/init/api.ts calls it at boot',
	)
})

test('the bundled manifest offers Presence as a calendar', () => {
	let link = bundled.links.find(
		(entry) =>
			entry.rel === 'https://frogpond.tech/rel/calendar' &&
			entry.properties['https://frogpond.tech/ns/id'] === 'presence',
	)
	expect(link?.href).toBe('https://api.presence.io/stolaf/v1/events')
	expect(link?.type).toBe('application/vnd.presence.events+json')
})

const EVENTS = ['application/vnd.frogpond.events+json']

test("a source marked Carleton's resolves against Carleton's server", () => {
	const source = resolveSource(manifest, REL_CALENDAR, 'sumo-schedule', EVENTS)
	expect(source.campus).toBe('edu.carleton')
	expect(source.href).toBe('calendar/named/sumo-schedule')
})

test("a source with no campus resolves against the manifest's own server", () => {
	expect(resolveSource(manifest, REL_CALENDAR, 'krlx-schedule', EVENTS).campus).toBe('edu.stolaf')

	setManifestServer('edu.carleton')
	try {
		expect(resolveSource(manifest, REL_CALENDAR, 'krlx-schedule', EVENTS).campus).toBe(
			'edu.carleton',
		)
	} finally {
		setManifestServer('edu.stolaf')
	}
})

/** A manifest with one calendar entry, `id`, that names `campus`. */
function naming(id: string, campus: string) {
	return JrdSchema.parse({
		subject: 'https://stolaf.edu',
		links: [
			{
				rel: REL_CALENDAR,
				href: `calendar/named/${id}`,
				type: EVENTS[0],
				properties: {[ID_PROPERTY]: id, [CAMPUS_PROPERTY]: campus},
			},
		],
	})
}

test('an entry for a campus this build does not know is left alone, without failing the manifest', () => {
	let sources = resolveSources(naming('elsewhere', 'edu.macalester'), REL_CALENDAR, EVENTS)

	expect(sources.find((source) => source.id === 'elsewhere')).toBeUndefined()
	expect(sources.length).toBeGreaterThan(0)
})

test("an entry for a campus this build does not know falls back to the bundled entry, not another campus's server", () => {
	let source = resolveSource(
		naming('sumo-schedule', 'edu.macalester'),
		REL_CALENDAR,
		'sumo-schedule',
		EVENTS,
	)

	expect(source.campus).toBe('edu.carleton')
})

test.each([
	['carleton', 'edu.carleton'],
	['edu.carleton', 'edu.carleton'],
	['stolaf', 'edu.stolaf'],
	['edu.stolaf', 'edu.stolaf'],
])('reads the campus %s, as a 2.9 RC or a later manifest names it, as %s', (named, id) => {
	const document = JrdSchema.parse({
		subject: 'https://stolaf.edu',
		links: [
			{
				rel: REL_CALENDAR,
				href: 'calendar/named/somewhere',
				type: EVENTS[0],
				properties: {[ID_PROPERTY]: 'somewhere', [CAMPUS_PROPERTY]: named},
			},
		],
	})
	expect(
		resolveSources(document, REL_CALENDAR, EVENTS).find((s) => s.id === 'somewhere')?.campus,
	).toBe(id)
})
