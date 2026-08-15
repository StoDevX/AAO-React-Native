import bundled from '../bundled.json'
import {resolveSource, resolveSources} from '../resolve'
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

test('resolveSources drops unsupported entries rather than failing', () => {
	const ids = resolveSources(manifest, REL_NEWS, ['application/vnd.frogpond.feed-items+json']).map(
		(s) => s.id,
	)
	expect(ids).toStrictEqual(['stolaf', 'mess', 'oleville'])
})
