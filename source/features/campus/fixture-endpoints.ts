/**
 * Each endpoint a campus's fixtures answer, by pattern, and the schema its
 * responses follow: `__schemas__/<schema>.json`, which
 * `mise run update-fixture-schemas` infers from the St. Olaf and Carleton
 * recordings and from `live` samples. Wiki Monkeys' fixtures are checked
 * against them (`__tests__/fixture-schemas.test.ts`).
 *
 * In a pattern, `{server}` is any campus's server, `:name` one path or host
 * segment, and `*` anything. The first matching pattern wins.
 *
 * No runtime imports: scripts/update-fixture-schemas.mjs loads this file in
 * Node, which only strips its types.
 */
export type FixtureEndpoint = {
	pattern: string
	schema: string
	/** Live URLs of the same endpoint, sampled when no recording covers it. */
	live?: readonly string[]
}

export const FIXTURE_ENDPOINTS: ReadonlyArray<FixtureEndpoint> = [
	{pattern: 'GET {server}/sources', schema: 'sources'},
	{pattern: 'GET {server}/contacts', schema: 'contacts'},
	{pattern: 'GET {server}/dictionary', schema: 'dictionary'},
	{pattern: 'GET {server}/faqs', schema: 'faqs'},
	{pattern: 'GET {server}/food/named/cafe/:id', schema: 'food-cafe'},
	{pattern: 'GET {server}/food/named/menu/:id', schema: 'food-menu'},
	{pattern: 'GET {server}/map/categories', schema: 'map-categories'},
	{pattern: 'GET {server}/map/geojson', schema: 'map-geojson'},
	{pattern: 'GET {server}/spaces/directory', schema: 'spaces-directory'},
	{pattern: 'GET {server}/spaces/hours', schema: 'spaces-hours'},
	{pattern: 'GET {server}/transit/bus', schema: 'transit-bus'},
	{pattern: 'GET {server}/transit/modes', schema: 'transit-modes'},
	{pattern: 'GET {server}/calendar/named/:id', schema: 'calendar-named'},
	{pattern: 'GET {server}/news/named/:id', schema: 'news-named'},
	{pattern: 'GET {server}/convos/archived', schema: 'convos-archived'},
	{pattern: 'GET https://api.presence.io/:org/v1/events', schema: 'presence-events'},
	{pattern: 'GET https://:host/calendar/wp-json/tribe/events/v1/events*', schema: 'tec-events'},
	{pattern: 'GET https://:host/wp-json/wp/v2/posts/:id?_fields=content', schema: 'wp-post-content'},
	{pattern: 'GET https://:host/wp-json/wp/v2/posts?*_fields=*', schema: 'wp-posts-fields'},
	{pattern: 'GET https://:host/wp-json/wp/v2/posts?*', schema: 'wp-posts-embedded'},
	{pattern: 'GET https://:host/wp-json/wp/v2/categories?*', schema: 'wp-categories'},
	{pattern: 'GET https://:host/wp-json/wp/v2/media?*', schema: 'wp-media'},
]

/**
 * A pattern as a regular expression. `:name` segments go before `{server}`, so
 * the `server:` that replacement writes is not read as one.
 */
function patternRegex(pattern: string): RegExp {
	let source = pattern
		.replaceAll(/[.+?^$()|[\]\\]/gu, '\\$&')
		.replaceAll(/(?<=\/):[a-z]+/gu, '[^/?]+')
		.replace('{server}', '\\{server:[^}]+\\}')
		.replaceAll('*', '.*')
	return new RegExp(`^${source}$`, 'u')
}

const compiled = FIXTURE_ENDPOINTS.map((endpoint) => ({
	endpoint,
	regex: patternRegex(endpoint.pattern),
}))

/** The endpoint a fixture's key asks for, or undefined when no pattern matches. */
export function endpointFor(key: string): FixtureEndpoint | undefined {
	return compiled.find(({regex}) => regex.test(key))?.endpoint
}
