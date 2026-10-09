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
	/**
	 * Answers written out by hand, for a form the server sends that no
	 * recording or live sample happens to use.
	 */
	samples?: ReadonlyArray<unknown>
}

export const FIXTURE_ENDPOINTS: ReadonlyArray<FixtureEndpoint> = [
	{pattern: 'GET {server}/sources', schema: 'sources'},
	{pattern: 'GET {server}/contacts', schema: 'contacts'},
	{
		pattern: 'GET {server}/dictionary',
		schema: 'dictionary',
		// An entry in the structured form, which the server sends for any word
		// its YAML writes with senses; neither campus's dictionary has one yet.
		samples: [
			{
				data: [
					{
						word: 'change',
						pronunciation: 'CHānj',
						partOfSpeech: 'verb',
						senses: [
							{
								grammar: 'with object',
								definition: 'make (someone or something) different',
								examples: ['fame has not changed her one bit'],
								subsenses: [{grammar: 'no object', definition: 'become different', examples: []}],
							},
							{definition: 'replace with another'},
						],
					},
				],
			},
		],
	},
	{
		pattern: 'GET {server}/directory/departments',
		schema: 'directory-departments',
		live: ['https://stolaf.frogpond.tech/v1/directory/departments'],
	},
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
	{
		pattern: 'GET {server}/streams/upcoming?*',
		schema: 'streams-upcoming',
		live: [
			'https://stolaf.frogpond.tech/v1/streams/upcoming?sort=ascending&dateFrom=2026-09-05&dateTo=2026-11-05',
		],
	},
	{
		pattern: 'GET {server}/webcams',
		schema: 'webcams',
		live: ['https://stolaf.frogpond.tech/v1/webcams'],
	},
	{
		pattern: 'GET {server}/radio/named/:id/now-playing',
		schema: 'radio-now-playing',
		live: ['https://content.krlx.org/wp-json/metaradio/v1/stationnow/?station=1'],
	},
	{pattern: 'GET https://api.presence.io/:org/v1/events', schema: 'presence-events'},
	{pattern: 'GET https://:host/calendar/wp-json/tribe/events/v1/events*', schema: 'tec-events'},
	{pattern: 'GET https://:host/wp-json/wp/v2/posts/:id?_fields=content', schema: 'wp-post-content'},
	{
		pattern: 'GET https://:host/wp-json/wp/v2/posts/:id?_embed=true',
		schema: 'wp-post-embedded',
		live: ['https://olafmessenger.com/wp-json/wp/v2/posts/36814?_embed=true'],
	},
	{pattern: 'GET https://:host/wp-json/wp/v2/posts?*_fields=*', schema: 'wp-posts-fields'},
	{pattern: 'GET https://:host/wp-json/wp/v2/posts?*', schema: 'wp-posts-embedded'},
	{pattern: 'GET https://:host/wp-json/wp/v2/categories?*', schema: 'wp-categories'},
	{pattern: 'GET https://:host/wp-json/wp/v2/media?*', schema: 'wp-media'},
	{
		pattern: 'GET https://:host/wp-json/wp/v2/pages?*',
		schema: 'wp-pages',
		live: ['https://olafmessenger.com/wp-json/wp/v2/pages?slug=about&_fields=content'],
	},
	{
		pattern: 'GET https://:host/wp-json/wp/v2/staff_profile?*',
		schema: 'wp-staff-profiles',
		live: ['https://olafmessenger.com/wp-json/wp/v2/staff_profile?staff_name=423&_embed=true'],
	},
	{
		pattern: 'GET https://:host/wp-json/wp/v2/staff_year?*',
		schema: 'wp-staff-years',
		live: [
			'https://olafmessenger.com/wp-json/wp/v2/staff_year?hide_empty=true&per_page=100&_fields=id,name',
		],
	},
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
