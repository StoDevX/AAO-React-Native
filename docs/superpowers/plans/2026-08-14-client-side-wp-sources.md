# Client-side wp.stolaf.edu sources — Implementation Plan (PR 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make News, A–Z and Calendar work again by fetching `wp.stolaf.edu` from the app instead of through ccc-server, resolving each source's URL and format from a published JRD manifest.

**Architecture:** A JRD document (RFC 7033 §4.4) lists every data source as `{rel, href, type, titles, properties}`. It is authored as `data/sources.yaml`, bundled to `docs/sources.json`, deployed to `gh-pages`, and proxied by ccc-server at `/v1/sources`. `modules/data-sources/` fetches and resolves it, falling back to a bundled copy. Each feature owns the parsers for the formats it understands and declares which `type` values it supports.

**Tech Stack:** TypeScript, React Query 5 (with AsyncStorage persistence, already wired), zod 4.4.3, `@frogpond/html-lib`, date-fns. Server side: Koa, zod, Node.

## Global Constraints

- TypeScript for all new code — no `any`.
- No new `moment` usage. Use `date-fns`. Existing `moment` in touched files stays.
- `StyleSheet.create()` for styles — no inline style objects. (No UI in this plan, but applies if any appears.)
- Colors from `@frogpond/colors`.
- oxfmt formatting: tabs, single quotes, no semicolons. `mise run format` before committing.
- Commit messages: imperative, capitalised, no trailing period, no conventional-commit prefixes.
- Run `mise run agent:pre-commit` before every commit. Do not commit if any step fails.
- Rel URIs are exactly `https://frogpond.tech/rel/news`, `https://frogpond.tech/rel/a-to-z`, `https://frogpond.tech/rel/calendar`.
- The id property key is exactly `https://frogpond.tech/ns/id`.

---

## File structure

**App repo (this repo):**

| Path | Responsibility |
| --- | --- |
| `data/sources.yaml` | Authored manifest. |
| `data/_schemas/sources.yaml` | JSON Schema draft-07 for the above; picked up automatically by `validate-data`. |
| `scripts/build-sources.mjs` | Writes the manifest to `docs/sources.json` **unwrapped**. |
| `scripts/bundle-data.mjs:44` | Register `sources.yaml` in `specialFiles`. |
| `modules/data-sources/types.ts` | zod schemas for JRD, `ResolvedSource`, rel/property constants. |
| `modules/data-sources/bundled.json` | Byte-identical copy of the published manifest. |
| `modules/data-sources/resolve.ts` | Manifest fetch, the three fallback rules, `resolveSource`/`resolveSources`. |
| `modules/data-sources/index.ts` | Barrel. |
| `source/features/news/parsers/` | `wp-v2-posts.ts`, `feed-items.ts`. |
| `source/features/more/parsers/` | `stolaf-a-z.ts`, `a-z-extras.ts`, `merge.ts`. |
| `modules/ccc-calendar/parsers/` | `tec-events.ts`, `events.ts`. |

**Why parsers live with features, not in `modules/data-sources/`:** the spec describes a parser registry inside resolution. Putting it there would make `data-sources` depend on `StoryType`, `LinkGroup` and `EventType` — that is, on every feature. Instead `data-sources` knows only about resolution, and each caller passes the `type` values it can handle. Rule 3 uses that list. Same behaviour, no dependency inversion.

**ccc-server repo** (`~/Developer/github.com/frog-pond/ccc-server`), separate PR:

| Path | Responsibility |
| --- | --- |
| `source/ccci-stolaf-college/v1/sources.ts` | Serve `sources.json` from GH Pages. |
| `source/ccci-stolaf-college/v1/index.ts` | Route registration. |
| `source/ccci-stolaf-college/v1/news.ts` | `stolaf` becomes a stub. |
| `source/ccci-stolaf-college/v1/calendar.ts` | `stolaf` becomes a stub; `oleville` removed. |
| `source/ccci-stolaf-college/v1/a-z.ts` | Deleted; route becomes a stub. |

---

## Task 1: Publish the manifest through the data pipeline

`convertDataFile` wraps every top-level `data/*.yaml` in `{data: ...}` (`scripts/convert-data-file.mjs`, `processYaml`). A JRD document must be the root object, so `sources.yaml` needs a builder, exactly as `faqs.yaml` has `buildFaqs`.

**Files:**
- Create: `data/sources.yaml`
- Create: `data/_schemas/sources.yaml`
- Create: `scripts/build-sources.mjs`
- Modify: `scripts/bundle-data.mjs:44`
- Create: `modules/data-sources/bundled.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `docs/sources.json`, a JRD document at the root. `modules/data-sources/bundled.json` with identical content.

- [ ] **Step 1: Write the manifest**

Create `data/sources.yaml`:

```yaml
subject: https://stolaf.edu

links:
  - rel: https://frogpond.tech/rel/news
    href: 'https://wp.stolaf.edu/wp-json/wp/v2/posts?per_page=10&_embed=true'
    type: application/vnd.wordpress.v2.posts+json
    titles: {und: St. Olaf News}
    properties: {'https://frogpond.tech/ns/id': stolaf}

  - rel: https://frogpond.tech/rel/news
    href: 'https://stolaf.api.frogpond.tech/v1/news/named/mess'
    type: application/vnd.frogpond.feed-items+json
    titles: {und: The Manitou Messenger}
    properties: {'https://frogpond.tech/ns/id': mess}

  - rel: https://frogpond.tech/rel/news
    href: 'https://stolaf.api.frogpond.tech/v1/news/named/oleville'
    type: application/vnd.frogpond.feed-items+json
    titles: {und: Oleville}
    properties: {'https://frogpond.tech/ns/id': oleville}

  - rel: https://frogpond.tech/rel/a-to-z
    href: 'https://wp.stolaf.edu/wp-json/site-data/sidebar/a-z'
    type: application/vnd.stolaf.a-z+json
    titles: {und: A–Z Index}
    properties: {'https://frogpond.tech/ns/id': stolaf}

  - rel: https://frogpond.tech/rel/a-to-z
    href: 'https://stolaf.dev/AAO-React-Native/a-to-z.json'
    type: application/vnd.frogpond.a-z-extras+json
    titles: {und: A–Z Index extras}
    properties: {'https://frogpond.tech/ns/id': extras}

  - rel: https://frogpond.tech/rel/calendar
    href: 'https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events?per_page=50'
    type: application/vnd.tribe.events.v1+json
    titles: {und: St. Olaf Calendar}
    properties: {'https://frogpond.tech/ns/id': stolaf}

  - rel: https://frogpond.tech/rel/calendar
    href: 'https://stolaf.api.frogpond.tech/v1/calendar/named/northfield'
    type: application/vnd.frogpond.events+json
    titles: {und: Northfield}
    properties: {'https://frogpond.tech/ns/id': northfield}

  - rel: https://frogpond.tech/rel/calendar
    href: 'https://stolaf.api.frogpond.tech/v1/calendar/named/krlx-schedule'
    type: application/vnd.frogpond.events+json
    titles: {und: KRLX Schedule}
    properties: {'https://frogpond.tech/ns/id': krlx-schedule}

  - rel: https://frogpond.tech/rel/calendar
    href: 'https://stolaf.api.frogpond.tech/v1/calendar/named/ksto-schedule'
    type: application/vnd.frogpond.events+json
    titles: {und: KSTO Schedule}
    properties: {'https://frogpond.tech/ns/id': ksto-schedule}
```

- [ ] **Step 2: Write the schema**

Create `data/_schemas/sources.yaml`:

```yaml
$schema: http://json-schema.org/draft-07/schema#

type: object
additionalProperties: false
required: [subject, links]
properties:
  subject: {type: string, format: uri}
  links:
    type: array
    minItems: 1
    items: {$ref: '#/definitions/link'}

definitions:
  link:
    type: object
    additionalProperties: false
    required: [rel, href, type, properties]
    properties:
      rel: {type: string, format: uri}
      href: {type: string, format: uri}
      type: {type: string, minLength: 1}
      titles:
        type: object
        additionalProperties: {type: string}
      properties:
        type: object
        additionalProperties: false
        required: ['https://frogpond.tech/ns/id']
        properties:
          'https://frogpond.tech/ns/id': {type: string, minLength: 1}
```

- [ ] **Step 3: Run the validator to verify it passes**

Run: `mise run validate-data 2>&1 | grep sources`
Expected: `sources.yaml is valid`

`validate-data` auto-discovers schemas — `scripts/validate-data.mjs` reads every file in `data/_schemas/`, then looks for `data/<name>/` or `data/<name>.yaml`. No registration needed.

- [ ] **Step 4: Write the builder**

Create `scripts/build-sources.mjs`:

```js
#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {load} from 'js-yaml'

// The manifest is a JRD document (RFC 7033 §4.4), which must be the root
// object. convertDataFile would wrap it in {data: …}, so it gets a builder.
export function buildSources({sourceFile, outputFile}) {
	let manifest = load(fs.readFileSync(sourceFile, 'utf-8'))

	fs.mkdirSync(path.dirname(outputFile), {recursive: true})
	fs.writeFileSync(outputFile, JSON.stringify(manifest) + '\n')
}

const isMain =
	process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname

if (isMain) {
	let [, , sourceFile, outputFile] = process.argv
	if (!sourceFile || !outputFile) {
		console.error('usage: node build-sources.mjs <source> <output>')
		process.exit(1)
	}

	buildSources({sourceFile, outputFile})
}
```

- [ ] **Step 5: Register the builder**

In `scripts/bundle-data.mjs`, add the import beside the others at the top:

```js
import {buildSources} from './build-sources.mjs'
```

and change the `specialFiles` map (line 44):

```js
const specialFiles = new Map([
	['faqs.yaml', buildFaqs],
	['sources.yaml', buildSources],
])
```

- [ ] **Step 6: Run the bundler and verify the output is unwrapped**

Run: `mise run bundle-data && node -e "const d=require('./docs/sources.json'); console.log(Object.keys(d).join(',')); console.log('links:', d.links.length)"`
Expected: `subject,links` and `links: 9`. If you see `data` in the keys, the builder is not registered.

- [ ] **Step 7: Create the bundled copy**

Run: `cp docs/sources.json modules/data-sources/bundled.json`

`docs/` is gitignored except `docs/superpowers/` (`.gitignore:59-61`), so the published artifact is not committed — CI regenerates it. `modules/data-sources/bundled.json` **is** committed, and must be regenerated with this same command whenever `data/sources.yaml` changes.

- [ ] **Step 8: Commit**

```bash
mise run agent:pre-commit
git add data/sources.yaml data/_schemas/sources.yaml scripts/build-sources.mjs scripts/bundle-data.mjs modules/data-sources/bundled.json
git commit -m "Publish a JRD source manifest"
```

---

## Task 2: JRD types and validation

**Files:**
- Create: `modules/data-sources/types.ts`
- Create: `modules/data-sources/package.json`
- Test: `modules/data-sources/__tests__/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `REL_NEWS`, `REL_A_TO_Z`, `REL_CALENDAR`, `ID_PROPERTY` — string constants.
  - `JrdSchema` — zod schema; `Jrd` — its inferred type.
  - `ResolvedSource` — `{id: string; href: string; type: string; title: string | undefined}`.

- [ ] **Step 1: Create the workspace package**

Create `modules/data-sources/package.json`:

```json
{
  "name": "@frogpond/data-sources",
  "version": "1.0.0",
  "description": "",
  "license": "ISC",
  "author": "",
  "main": "index.ts",
  "scripts": {
    "test": "jest"
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `modules/data-sources/__tests__/types.test.ts`:

```ts
import {JrdSchema, ID_PROPERTY, REL_NEWS} from '../types'

const valid = {
	subject: 'https://stolaf.edu',
	links: [
		{
			rel: REL_NEWS,
			href: 'https://example.test/feed',
			type: 'application/vnd.wordpress.v2.posts+json',
			titles: {und: 'Example'},
			properties: {[ID_PROPERTY]: 'example'},
		},
	],
}

test('accepts a well-formed document', () => {
	expect(JrdSchema.parse(valid).links).toHaveLength(1)
})

test('accepts a link with no titles', () => {
	const {titles: _titles, ...rest} = valid.links[0]
	const parsed = JrdSchema.parse({...valid, links: [rest]})
	expect(parsed.links[0].titles).toBeUndefined()
})

test('rejects a link with no id property', () => {
	const link = {...valid.links[0], properties: {}}
	expect(() => JrdSchema.parse({...valid, links: [link]})).toThrow()
})

test('rejects a document with no links array', () => {
	expect(() => JrdSchema.parse({subject: 'https://stolaf.edu'})).toThrow()
})

test('rejects a non-url href', () => {
	const link = {...valid.links[0], href: 'not a url'}
	expect(() => JrdSchema.parse({...valid, links: [link]})).toThrow()
})
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `npx jest modules/data-sources/__tests__/types.test.ts`
Expected: FAIL — cannot find module `../types`.

- [ ] **Step 4: Write the implementation**

Create `modules/data-sources/types.ts`:

```ts
import {z} from 'zod'

export const REL_NEWS = 'https://frogpond.tech/rel/news'
export const REL_A_TO_Z = 'https://frogpond.tech/rel/a-to-z'
export const REL_CALENDAR = 'https://frogpond.tech/rel/calendar'

/// JRD `properties` member names are URIs (RFC 7033 §4.4.4.5), so the source
/// id is keyed by one rather than a bare string.
export const ID_PROPERTY = 'https://frogpond.tech/ns/id'

const JrdLinkSchema = z.object({
	rel: z.url(),
	href: z.url(),
	type: z.string().min(1),
	titles: z.record(z.string(), z.string()).optional(),
	properties: z.object({[ID_PROPERTY]: z.string().min(1)}),
})

export type Jrd = z.infer<typeof JrdSchema>
export const JrdSchema = z.object({
	subject: z.string(),
	links: z.array(JrdLinkSchema),
})

export interface ResolvedSource {
	id: string
	href: string
	type: string
	title: string | undefined
}
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npx jest modules/data-sources/__tests__/types.test.ts`
Expected: 5 passing.

- [ ] **Step 6: Commit**

```bash
mise run agent:pre-commit
git add modules/data-sources/
git commit -m "Add JRD types for the source manifest"
```

---

## Task 3: Manifest resolution and fallback rules

**Files:**
- Create: `modules/data-sources/resolve.ts`
- Create: `modules/data-sources/index.ts`
- Test: `modules/data-sources/__tests__/resolve.test.ts`

**Interfaces:**
- Consumes: `JrdSchema`, `Jrd`, `ResolvedSource`, `ID_PROPERTY` from Task 2.
- Produces:
  - `manifestOptions` — React Query options fetching `sources` from `client` (`@frogpond/api`), 24-hour `staleTime`, bundled document on any failure.
  - `resolveSources(manifest, rel, supportedTypes): ResolvedSource[]`
  - `resolveSource(manifest, rel, id, supportedTypes): ResolvedSource`
  - `fetchManifest(queryClient): Promise<Jrd>`

`resolveSources` and `resolveSource` are pure — they take an already-fetched document. That keeps the fallback rules testable without mocking the network.

- [ ] **Step 1: Write the failing test**

Create `modules/data-sources/__tests__/resolve.test.ts`:

```ts
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
	expect(() => resolveSource(manifest, REL_NEWS, 'nonesuch', ALL_NEWS_TYPES)).toThrow(
		/nonesuch/u,
	)
})

test('resolveSources drops unsupported entries rather than failing', () => {
	const ids = resolveSources(manifest, REL_NEWS, [
		'application/vnd.frogpond.feed-items+json',
	]).map((s) => s.id)
	expect(ids).toStrictEqual(['stolaf', 'mess', 'oleville'])
})
```

The last test asserts rule 3 applied per-entry: `stolaf` is unsupported in the fetched document but its bundled entry is supported, so it still appears.

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx jest modules/data-sources/__tests__/resolve.test.ts`
Expected: FAIL — cannot find module `../resolve`.

- [ ] **Step 3: Write the implementation**

Create `modules/data-sources/resolve.ts`:

```ts
import {client} from '@frogpond/api'
import {queryOptions, type QueryClient} from '@tanstack/react-query'
import bundledJson from './bundled.json'
import {ID_PROPERTY, JrdSchema, type Jrd, type ResolvedSource} from './types'

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

/// The copy shipped in the binary. Every fallback path resolves against this,
/// so it is always parseable and always uses types this build can handle.
const bundled: Jrd = JrdSchema.parse(bundledJson)

export const keys = {
	manifest: ['data-sources', 'manifest'] as const,
}

export const manifestOptions = queryOptions({
	queryKey: keys.manifest,
	staleTime: ONE_DAY_IN_MS,
	queryFn: async ({signal}): Promise<Jrd> => {
		let response = await client.get('sources', {signal}).json()
		return JrdSchema.parse(response)
	},
})

/// Rule 1: an unreachable or malformed manifest means we use the bundled one
/// wholesale. Resolution must never be the reason a feature fails to load.
export async function fetchManifest(queryClient: QueryClient): Promise<Jrd> {
	try {
		return await queryClient.fetchQuery(manifestOptions)
	} catch {
		return bundled
	}
}

function toResolved(link: Jrd['links'][number]): ResolvedSource {
	return {
		id: link.properties[ID_PROPERTY],
		href: link.href,
		type: link.type,
		title: link.titles?.['und'],
	}
}

function find(manifest: Jrd, rel: string, id: string): ResolvedSource | undefined {
	let link = manifest.links.find(
		(entry) => entry.rel === rel && entry.properties[ID_PROPERTY] === id,
	)
	return link ? toResolved(link) : undefined
}

/// Rules 2 and 3. A source that is missing, or that names a format this build
/// has no parser for, falls back to its bundled entry — so publishing a new
/// format tag cannot break installs that predate the parser.
export function resolveSource(
	manifest: Jrd,
	rel: string,
	id: string,
	supportedTypes: readonly string[],
): ResolvedSource {
	let fetched = find(manifest, rel, id)

	if (fetched && supportedTypes.includes(fetched.type)) {
		return fetched
	}

	let fallback = find(bundled, rel, id)
	if (!fallback) {
		throw new Error(`no source for rel "${rel}" and id "${id}"`)
	}

	return fallback
}

export function resolveSources(
	manifest: Jrd,
	rel: string,
	supportedTypes: readonly string[],
): ResolvedSource[] {
	let ids = new Set<string>()
	for (let link of [...manifest.links, ...bundled.links]) {
		if (link.rel === rel) ids.add(link.properties[ID_PROPERTY])
	}

	return [...ids].flatMap((id) => {
		try {
			return [resolveSource(manifest, rel, id, supportedTypes)]
		} catch {
			return []
		}
	})
}
```

- [ ] **Step 4: Write the barrel**

Create `modules/data-sources/index.ts`:

```ts
export {fetchManifest, manifestOptions, resolveSource, resolveSources} from './resolve'
export {
	ID_PROPERTY,
	JrdSchema,
	REL_A_TO_Z,
	REL_CALENDAR,
	REL_NEWS,
	type Jrd,
	type ResolvedSource,
} from './types'
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npx jest modules/data-sources/`
Expected: all passing.

If `bundled.json` fails to import, confirm `resolveJsonModule` is enabled in `tsconfig.json`; if it is not, add it.

- [ ] **Step 6: Commit**

```bash
mise run agent:pre-commit
git add modules/data-sources/
git commit -m "Resolve data sources from the manifest with a bundled fallback"
```

---

## Task 4: News through the manifest

**Files:**
- Create: `source/features/news/parsers/wp-v2-posts.ts`
- Create: `source/features/news/parsers/feed-items.ts`
- Modify: `source/features/news/query.ts` (whole file)
- Test: `source/features/news/__tests__/wp-v2-posts.test.ts`

**Interfaces:**
- Consumes: `fetchManifest`, `resolveSource`, `REL_NEWS` (Task 3); `StoryType` from `source/features/news/types.ts`.
- Produces: `NEWS_TYPES: readonly string[]`; `parseWpV2Posts(body: unknown): StoryType[]`; `parseFeedItems(body: unknown): StoryType[]`. `namedNewsOptions(source: string)` keeps its existing signature.

- [ ] **Step 1: Capture a fixture**

Run:

```bash
curl -sS 'https://wp.stolaf.edu/wp-json/wp/v2/posts?per_page=2&_embed=true' \
  -o source/features/news/__tests__/fixtures/wp-v2-posts.json
```

Create the directory first if needed. If the request fails, you are on a network St. Olaf blocks — use a different network; do not hand-write the fixture.

- [ ] **Step 2: Write the failing test**

Create `source/features/news/__tests__/wp-v2-posts.test.ts`:

```ts
import fixture from './fixtures/wp-v2-posts.json'
import {parseWpV2Posts} from '../parsers/wp-v2-posts'

test('parses the live fixture into stories', () => {
	const stories = parseWpV2Posts(fixture)
	expect(stories.length).toBeGreaterThan(0)
})

test('strips html from titles and excerpts', () => {
	const [story] = parseWpV2Posts(fixture)
	expect(story.title).not.toContain('<')
	expect(story.excerpt).not.toContain('<')
})

test('produces an iso date', () => {
	const [story] = parseWpV2Posts(fixture)
	expect(story.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/u)
})

test('treats a naive date_gmt as utc', () => {
	const stories = parseWpV2Posts([
		{
			author: 1,
			content: {rendered: '<p>body</p>'},
			date_gmt: '2026-08-14T20:26:51',
			excerpt: {rendered: '<p>hi</p>'},
			featured_media: 0,
			link: 'https://wp.stolaf.edu/a',
			title: {rendered: 'Title'},
		},
	])
	expect(stories[0].datePublished).toBe('2026-08-14T20:26:51.000Z')
})

test('falls back to Unknown Author when the embed is absent', () => {
	const stories = parseWpV2Posts([
		{
			author: 1,
			content: {rendered: ''},
			date_gmt: '2026-08-14T20:26:51Z',
			excerpt: {rendered: ''},
			featured_media: 0,
			link: 'https://wp.stolaf.edu/a',
			title: {rendered: 'Title'},
		},
	])
	expect(stories[0].authors).toStrictEqual(['Unknown Author'])
})
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `npx jest source/features/news/__tests__/wp-v2-posts.test.ts`
Expected: FAIL — cannot find module `../parsers/wp-v2-posts`.

- [ ] **Step 4: Write the parser**

Create `source/features/news/parsers/wp-v2-posts.ts`:

```ts
import {fastGetTrimmedText} from '@frogpond/html-lib'
import {z} from 'zod'
import {StoryType} from '../types'

const WpV2PostSchema = z.object({
	_embedded: z
		.object({
			author: z.array(z.object({id: z.unknown(), name: z.string().optional()})).optional(),
			'wp:featuredmedia': z
				.array(
					z.object({
						id: z.unknown(),
						media_type: z.string(),
						media_details: z.object({
							sizes: z.record(z.string(), z.object({source_url: z.string()})).optional(),
						}),
						source_url: z.string(),
					}),
				)
				.nullable()
				.optional(),
			'wp:term': z.array(z.array(z.object({taxonomy: z.string(), name: z.string()}))).optional(),
		})
		.optional(),
	author: z.unknown(),
	featured_media: z.number().optional(),
	content: z.object({rendered: z.string()}),
	excerpt: z.object({rendered: z.string()}),
	title: z.object({rendered: z.string()}),
	date_gmt: z.string(),
	link: z.string(),
})

const WpV2PostsSchema = z.array(WpV2PostSchema)

/// WordPress reports `date_gmt` as UTC but omits the marker, so an unadorned
/// value would be read as local time and shift by the offset.
function toIsoString(dateGmt: string): string {
	let stamped = dateGmt.endsWith('Z') || dateGmt.includes('+') ? dateGmt : `${dateGmt}Z`
	return new Date(stamped).toISOString()
}

export function parseWpV2Posts(body: unknown): StoryType[] {
	return WpV2PostsSchema.parse(body).map((item) => {
		let categories =
			item._embedded?.['wp:term']?.flatMap((group) =>
				group.flatMap((term) => (term.taxonomy === 'category' ? [term.name] : [])),
			) ?? []

		let author =
			item._embedded?.author?.find((a) => a.id === item.author)?.name ?? 'Unknown Author'

		let featuredImage: string | undefined
		let media = item._embedded?.['wp:featuredmedia']?.find(
			(m) => m.id === item.featured_media && m.media_type === 'image',
		)
		if (media) {
			featuredImage = media.media_details.sizes?.['medium_large']?.source_url ?? media.source_url
		}

		return {
			authors: [author],
			categories,
			content: item.content.rendered,
			datePublished: toIsoString(item.date_gmt),
			excerpt: fastGetTrimmedText(item.excerpt.rendered),
			featuredImage,
			link: item.link,
			title: fastGetTrimmedText(item.title.rendered),
		}
	})
}
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npx jest source/features/news/__tests__/wp-v2-posts.test.ts`
Expected: 5 passing.

- [ ] **Step 6: Write the pass-through parser**

Create `source/features/news/parsers/feed-items.ts`:

```ts
import {StoryType} from '../types'

/// ccc-server already emits our normalised shape, so proxied sources need no
/// transform — only the type tag that says so.
export function parseFeedItems(body: unknown): StoryType[] {
	return body as StoryType[]
}
```

- [ ] **Step 7: Rewire the query**

Replace the whole of `source/features/news/query.ts`:

```ts
import {fetchManifest, REL_NEWS, resolveSource} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseFeedItems} from './parsers/feed-items'
import {parseWpV2Posts} from './parsers/wp-v2-posts'
import {StoryType} from './types'

const WP_V2_POSTS = 'application/vnd.wordpress.v2.posts+json'
const FEED_ITEMS = 'application/vnd.frogpond.feed-items+json'

export const NEWS_TYPES = [WP_V2_POSTS, FEED_ITEMS] as const

export const keys = {
	named: (name: string) => ['news', 'named', name] as const,
}

function parse(type: string, body: unknown): StoryType[] {
	switch (type) {
		case WP_V2_POSTS:
			return parseWpV2Posts(body)
		case FEED_ITEMS:
			return parseFeedItems(body)
		default:
			throw new Error(`no news parser for "${type}"`)
	}
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const namedNewsOptions = (source: string) =>
	queryOptions({
		queryKey: keys.named(source),
		queryFn: async ({queryKey, signal}): Promise<StoryType[]> => {
			let manifest = await fetchManifest(queryClient)
			let resolved = resolveSource(manifest, REL_NEWS, queryKey[2], NEWS_TYPES)

			let response = await fetch(resolved.href, {signal})
			if (!response.ok) {
				throw new Error(`News fetch failed: ${response.status}`)
			}

			return parse(resolved.type, await response.json())
		},
	})
```

`rssNewsOptions` and `wpJsonNewsOptions` are deleted — they had no callers.

- [ ] **Step 8: Verify nothing referenced the deleted exports**

Run: `grep -rn "rssNewsOptions\|wpJsonNewsOptions" source modules app | grep -v node_modules`
Expected: no output.

- [ ] **Step 9: Run the full check**

Run: `mise run agent:pre-commit`
Expected: all steps pass.

- [ ] **Step 10: Commit**

```bash
git add source/features/news/
git commit -m "Fetch St. Olaf news directly through the source manifest"
```

---

## Task 5: A–Z through the manifest

**Files:**
- Create: `source/features/more/parsers/stolaf-a-z.ts`
- Create: `source/features/more/parsers/a-z-extras.ts`
- Create: `source/features/more/parsers/merge.ts`
- Modify: `source/features/more/query.ts` (whole file)
- Test: `source/features/more/__tests__/merge.test.ts`

**Interfaces:**
- Consumes: `fetchManifest`, `resolveSources`, `REL_A_TO_Z` (Task 3); `LinkGroup`, `LinkValue` from `source/features/more/types.ts`.
- Produces: `parseStolafAToZ(body: unknown): LinkGroup[]`, `parseAToZExtras(body: unknown): LinkGroup[]`, `mergeAToZ(upstream: LinkGroup[], extras: LinkGroup[]): LinkGroup[]`.

Both parsers return `LinkGroup[]` — `{title: letter, data: values}` — so the merge works on one shape.

- [ ] **Step 1: Write the failing test**

Create `source/features/more/__tests__/merge.test.ts`:

```ts
import {mergeAToZ} from '../parsers/merge'
import {parseAToZExtras, parseStolafAToZ} from '../parsers/a-z-extras'

const upstream = parseStolafAToZ({
	az_nav: {
		menu_items: [
			{letter: 'A', values: [{label: 'Alpha', url: 'https://stolaf.edu/alpha'}]},
			{letter: 'M', values: [{label: 'Music', url: '/music'}]},
		],
	},
})

test('resolves root-relative urls against stolaf.edu', () => {
	expect(upstream[1].data[0].url).toBe('https://stolaf.edu/music')
})

test('drops entries whose url is unusable', () => {
	const parsed = parseStolafAToZ({
		az_nav: {
			menu_items: [
				{
					letter: 'A',
					values: [
						{label: 'Good', url: 'https://stolaf.edu/good'},
						{label: 'Bad', url: 'not a url'},
						{label: '', url: '  '},
					],
				},
			],
		},
	})
	expect(parsed[0].data.map((v) => v.label)).toStrictEqual(['Good'])
})

test('merges extras into an existing letter and re-sorts it', () => {
	const extras = parseAToZExtras({
		data: [{letter: 'A', values: [{label: 'Aardvark', url: 'https://stolaf.edu/aardvark'}]}],
	})
	const merged = mergeAToZ(upstream, extras)
	expect(merged[0].data.map((v) => v.label)).toStrictEqual(['Aardvark', 'Alpha'])
})

test('creates the letter group when the upstream does not publish it', () => {
	const extras = parseAToZExtras({
		data: [{letter: 'Z', values: [{label: 'Zoom', url: 'https://stolaf.edu/zoom'}]}],
	})
	const merged = mergeAToZ(upstream, extras)
	const z = merged.find((group) => group.title === 'Z')
	expect(z?.data.map((v) => v.label)).toStrictEqual(['Zoom'])
})

test('inserts a created letter group in sorted position', () => {
	const extras = parseAToZExtras({
		data: [{letter: 'B', values: [{label: 'Beta', url: 'https://stolaf.edu/beta'}]}],
	})
	const merged = mergeAToZ(upstream, extras)
	expect(merged.map((group) => group.title)).toStrictEqual(['A', 'B', 'M'])
})

test('renders the upstream alone when there are no extras', () => {
	expect(mergeAToZ(upstream, []).map((group) => group.title)).toStrictEqual(['A', 'M'])
})
```

The fifth and sixth tests are the bug fix: ccc-server's `combineResponses` discards a group whose letter is absent upstream, and St. Olaf publishes no `Q`, `X`, `Y` or `Z`.

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx jest source/features/more/__tests__/merge.test.ts`
Expected: FAIL — cannot find module `../parsers/merge`.

- [ ] **Step 3: Write the parsers**

Create `source/features/more/parsers/a-z-extras.ts`:

```ts
import {z} from 'zod'
import {LinkGroup, LinkValue} from '../types'

const STOLAF_BASE_URL = 'https://stolaf.edu'

const RawValueSchema = z.object({label: z.string(), url: z.string()})
const RawGroupSchema = z.object({letter: z.string(), values: z.array(RawValueSchema)})

const StolafAToZSchema = z.object({az_nav: z.object({menu_items: z.array(RawGroupSchema)})})
const AToZExtrasSchema = z.object({data: z.array(RawGroupSchema)})

const UrlSchema = z.url()

/// Upstream entries are hand-maintained and sometimes blank or malformed. A
/// single bad link must not blank the index, so bad entries are dropped rather
/// than thrown on.
function normalizeValues(values: {label: string; url: string}[]): LinkValue[] {
	return values.flatMap(({label, url}) => {
		let formattedLabel = label.trim()
		let formattedUrl = url.trim()

		if (!formattedLabel && !formattedUrl) return []
		if (formattedUrl.startsWith('/')) formattedUrl = `${STOLAF_BASE_URL}${formattedUrl}`

		let parsed = UrlSchema.safeParse(formattedUrl)
		if (!parsed.success || !formattedLabel) return []

		return [{label: formattedLabel, url: parsed.data}]
	})
}

function toGroups(raw: {letter: string; values: {label: string; url: string}[]}[]): LinkGroup[] {
	return raw.map(({letter, values}) => ({
		title: letter[0] ?? '',
		data: normalizeValues(values),
	}))
}

export function parseStolafAToZ(body: unknown): LinkGroup[] {
	return toGroups(StolafAToZSchema.parse(body).az_nav.menu_items)
}

export function parseAToZExtras(body: unknown): LinkGroup[] {
	return toGroups(AToZExtrasSchema.parse(body).data)
}
```

Create `source/features/more/parsers/merge.ts`:

```ts
import {LinkGroup} from '../types'

/// ccc-server's combineResponses silently discarded an extras group whose
/// letter the upstream did not publish — and St. Olaf publishes no Q, X, Y or
/// Z. Here a missing letter is created and inserted in sorted position instead.
export function mergeAToZ(upstream: LinkGroup[], extras: LinkGroup[]): LinkGroup[] {
	let merged: LinkGroup[] = upstream.map((group) => ({title: group.title, data: [...group.data]}))

	for (let group of extras) {
		if (group.data.length === 0) continue

		let target = merged.find((entry) => entry.title === group.title)

		if (!target) {
			target = {title: group.title, data: []}
			let index = merged.findIndex((entry) => entry.title.localeCompare(group.title) > 0)
			merged.splice(index === -1 ? merged.length : index, 0, target)
		}

		target.data.push(...group.data)
		target.data.sort((a, b) => a.label.localeCompare(b.label))
	}

	return merged
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx jest source/features/more/__tests__/merge.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Rewire the query**

Replace the whole of `source/features/more/query.ts`:

```ts
import {fetchManifest, REL_A_TO_Z, resolveSources} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseAToZExtras, parseStolafAToZ} from './parsers/a-z-extras'
import {mergeAToZ} from './parsers/merge'
import {LinkGroup} from './types'

const STOLAF_A_Z = 'application/vnd.stolaf.a-z+json'
const A_Z_EXTRAS = 'application/vnd.frogpond.a-z-extras+json'

export const A_TO_Z_TYPES = [STOLAF_A_Z, A_Z_EXTRAS] as const

export const keys = {
	all: ['a-z'] as const,
}

async function fetchGroups(href: string, type: string, signal: AbortSignal): Promise<LinkGroup[]> {
	let response = await fetch(href, {signal})
	if (!response.ok) {
		throw new Error(`A–Z fetch failed: ${response.status}`)
	}

	let body: unknown = await response.json()
	return type === STOLAF_A_Z ? parseStolafAToZ(body) : parseAToZExtras(body)
}

export const searchLinksOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}): Promise<LinkGroup[]> => {
		let manifest = await fetchManifest(queryClient)
		let sources = resolveSources(manifest, REL_A_TO_Z, A_TO_Z_TYPES)

		let upstream = sources.find((source) => source.type === STOLAF_A_Z)
		if (!upstream) {
			throw new Error('no A–Z index source')
		}

		let upstreamGroups = await fetchGroups(upstream.href, upstream.type, signal)

		// The extras are a supplement; losing them should not blank the index.
		let extraGroups = await Promise.all(
			sources
				.filter((source) => source.type === A_Z_EXTRAS)
				.map((source) =>
					fetchGroups(source.href, source.type, signal).catch(() => [] as LinkGroup[]),
				),
		)

		return mergeAToZ(upstreamGroups, extraGroups.flat())
	},
})
```

- [ ] **Step 6: Run the full check**

Run: `mise run agent:pre-commit`
Expected: all steps pass.

- [ ] **Step 7: Commit**

```bash
git add source/features/more/
git commit -m "Fetch the A-Z index directly and stop dropping unpublished letters"
```

---

## Task 6: Calendar through the manifest

**Files:**
- Create: `modules/ccc-calendar/parsers/tec-events.ts`
- Create: `modules/ccc-calendar/parsers/events.ts`
- Modify: `modules/ccc-calendar/query.ts:36-111`
- Modify: `modules/ccc-calendar/index.tsx:9-13`
- Test: `modules/ccc-calendar/__tests__/tec-events.test.ts`

**Interfaces:**
- Consumes: `fetchManifest`, `resolveSource`, `REL_CALENDAR` (Task 3); `EventType` from `@frogpond/event-type`.
- Produces: `parseTecEvents(body: unknown): WireEvent[]`, `parseEvents(body: unknown): WireEvent[]`, where `WireEvent` is the server's on-the-wire event shape — `EventType` with `startTime` and `endTime` as ISO strings. `namedCalendarOptions` and `namedCalendarEventOptions` keep their signatures.

`convertEvents` in `query.ts:17` already turns the wire shape into `EventType` with Moments, so the parser stops at ISO strings and nothing downstream changes.

- [ ] **Step 1: Capture a fixture**

Run:

```bash
curl -sS 'https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events?per_page=10' \
  -o modules/ccc-calendar/__tests__/fixtures/tec-events.json
```

Confirm it contains both an event with a `venue` and one without:

```bash
node -e "const d=require('./modules/ccc-calendar/__tests__/fixtures/tec-events.json'); console.log('with venue:', d.events.filter(e=>e.venue).length, 'without:', d.events.filter(e=>!e.venue).length, 'all-day:', d.events.filter(e=>e.all_day).length)"
```

If either count is zero, raise `per_page` until both appear.

- [ ] **Step 2: Write the failing test**

Create `modules/ccc-calendar/__tests__/tec-events.test.ts`:

```ts
import fixture from './fixtures/tec-events.json'
import {parseTecEvents} from '../parsers/tec-events'

test('parses the live fixture', () => {
	expect(parseTecEvents(fixture).length).toBeGreaterThan(0)
})

test('treats the naive utc timestamp as utc', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'New Faculty Orientation',
				description: '<p>Seminars.</p>',
				url: 'https://wp.stolaf.edu/calendar/event/nfo/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-20 22:00:00',
				venue: {venue: 'Kings Dining'},
			},
		],
	})
	expect(event.startTime).toBe('2026-08-17T13:00:00.000Z')
	expect(event.endTime).toBe('2026-08-20T22:00:00.000Z')
})

test('uses the venue name as the location', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-17 14:00:00',
				venue: {venue: 'Kings Dining'},
			},
		],
	})
	expect(event.location).toBe('Kings Dining')
})

test('tolerates an event with no venue at all', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: true,
				utc_start_date: '2026-08-17 00:00:00',
				utc_end_date: '2026-08-17 23:59:59',
			},
		],
	})
	expect(event.location).toBe('')
})

test('hides the times on an all-day event', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: true,
				utc_start_date: '2026-08-17 00:00:00',
				utc_end_date: '2026-08-17 23:59:59',
			},
		],
	})
	expect(event.config).toStrictEqual({startTime: false, endTime: false, subtitle: 'location'})
})

test('strips html from the description and keeps its links', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '<div><p>See <a href="https://stolaf.edu/x">this</a>.</p></div>',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-17 14:00:00',
			},
		],
	})
	expect(event.description).not.toContain('<')
	expect(event.links).toContain('https://stolaf.edu/x')
	expect(event.links).toContain('https://wp.stolaf.edu/calendar/event/a/')
})

test('treats an empty modular-content description as empty, not a failure', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '<div data-modular-content-collection></div>',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-17 14:00:00',
			},
		],
	})
	expect(event.description).toBe('')
})
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `npx jest modules/ccc-calendar/__tests__/tec-events.test.ts`
Expected: FAIL — cannot find module `../parsers/tec-events`.

- [ ] **Step 4: Write the parser**

Create `modules/ccc-calendar/parsers/tec-events.ts`:

```ts
import {decode, fastGetTrimmedText, htmlToSegments} from '@frogpond/html-lib'
import {z} from 'zod'

export interface WireEvent {
	dataSource: string
	startTime: string
	endTime: string
	title: string
	description: string
	location: string
	isOngoing: boolean
	links: string[]
	config: {startTime: boolean; endTime: boolean; subtitle: 'location' | 'description'}
}

const TecEventSchema = z.object({
	title: z.string(),
	description: z.string(),
	url: z.string(),
	all_day: z.boolean(),
	utc_start_date: z.string(),
	utc_end_date: z.string(),
	// Absent entirely on events with no venue, not present-and-null.
	venue: z.object({venue: z.string().optional()}).optional(),
})

const TecEventsSchema = z.object({events: z.array(TecEventSchema)})

/// TEC reports `utc_start_date` as "2026-08-17 13:00:00" — UTC, but with a
/// space separator and no zone marker. Left alone it would be read as local
/// time and shift by the offset.
function toIsoString(utcDate: string): string {
	return new Date(`${utcDate.replace(' ', 'T')}Z`).toISOString()
}

export function parseTecEvents(body: unknown, now = new Date()): WireEvent[] {
	return TecEventsSchema.parse(body).events.map((event) => {
		let startTime = toIsoString(event.utc_start_date)
		let description = fastGetTrimmedText(event.description)

		let descriptionLinks = htmlToSegments(event.description).flatMap((segment) =>
			segment.type === 'link' ? [segment.url] : [],
		)

		let startOfToday = new Date(now)
		startOfToday.setHours(0, 0, 0, 0)

		return {
			dataSource: 'tribe',
			startTime,
			endTime: toIsoString(event.utc_end_date),
			title: decode(event.title),
			description,
			location: event.venue?.venue ?? '',
			isOngoing: new Date(startTime) < startOfToday,
			links: [...descriptionLinks, event.url],
			config: {
				startTime: !event.all_day,
				endTime: !event.all_day,
				subtitle: 'location',
			},
		}
	})
}
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npx jest modules/ccc-calendar/__tests__/tec-events.test.ts`
Expected: 7 passing.

- [ ] **Step 6: Write the pass-through parser**

Create `modules/ccc-calendar/parsers/events.ts`:

```ts
import {WireEvent} from './tec-events'

/// ccc-server already emits the wire event shape; proxied calendars need only
/// the type tag that says so.
export function parseEvents(body: unknown): WireEvent[] {
	return body as WireEvent[]
}
```

- [ ] **Step 7: Rewire the query**

In `modules/ccc-calendar/query.ts`, keep lines 1–34 (`convertEvents` and `keys`) and replace everything from line 36 to the end with:

```ts
const TEC_EVENTS = 'application/vnd.tribe.events.v1+json'
const FROGPOND_EVENTS = 'application/vnd.frogpond.events+json'

export const CALENDAR_TYPES = [TEC_EVENTS, FROGPOND_EVENTS] as const

async function fetchCalendar(calendar: NamedCalendar, signal: AbortSignal): Promise<EventType[]> {
	let manifest = await fetchManifest(queryClient)
	let resolved = resolveSource(manifest, REL_CALENDAR, calendar, CALENDAR_TYPES)

	let response = await fetch(resolved.href, {signal})
	if (!response.ok) {
		throw new Error(`Calendar fetch failed: ${response.status}`)
	}

	let body: unknown = await response.json()
	let events = resolved.type === TEC_EVENTS ? parseTecEvents(body) : parseEvents(body)

	return events as unknown as EventType[]
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const namedCalendarOptions = (
	calendar: NamedCalendar,
	options: {eventMapper?: EventMapper} = {},
) =>
	queryOptions({
		queryKey: keys.named(calendar),
		queryFn: ({queryKey, signal}) => fetchCalendar(queryKey[2], signal),
		select: (events) => convertEvents(events, options),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const namedCalendarEventOptions = (
	calendar: NamedCalendar,
	key: string,
	options: {eventMapper?: EventMapper} = {},
) =>
	queryOptions({
		queryKey: keys.named(calendar),
		queryFn: ({queryKey, signal}) => fetchCalendar(queryKey[2], signal),
		select: (events) => convertEvents(events, options).find((event) => eventKey(event) === key),
	})
```

Update the imports at the top of the file: drop `client` from `@frogpond/api`, and add

```ts
import {fetchManifest, REL_CALENDAR, resolveSource} from '@frogpond/data-sources'
import {queryClient} from '../../source/init/tanstack-query'
import {parseEvents} from './parsers/events'
import {parseTecEvents} from './parsers/tec-events'
```

Trim `keys` to just `named` — the `google`, `reason` and `ics` entries go with their options.

`googleCalendarOptions`, `reasonCalendarOptions` and `icsCalendarOptions` are all deleted. None had callers; `reasonCalendarOptions` fetched `calendar/reason`, a route ccc-server never had.

- [ ] **Step 8: Drop the deleted exports from the barrel**

In `modules/ccc-calendar/index.tsx`, remove `googleCalendarOptions`, `reasonCalendarOptions` and `icsCalendarOptions` from the export list at lines 11–13.

- [ ] **Step 9: Verify nothing referenced them**

Run: `grep -rn "googleCalendarOptions\|reasonCalendarOptions\|icsCalendarOptions" source modules app | grep -v node_modules`
Expected: no output.

- [ ] **Step 10: Run the full check**

Run: `mise run agent:pre-commit`
Expected: all steps pass.

- [ ] **Step 11: Commit**

```bash
git add modules/ccc-calendar/
git commit -m "Fetch the St. Olaf calendar from The Events Calendar"
```

---

## Task 7: Serve the manifest from ccc-server

Work in `~/Developer/github.com/frog-pond/ccc-server` on a new branch. This is a separate pull request in a separate repository.

**Files:**
- Create: `source/ccci-stolaf-college/v1/sources.ts`
- Modify: `source/ccci-stolaf-college/v1/index.ts`

**Interfaces:**
- Consumes: `GH_PAGES` from `./gh-pages.ts`, `getJson` from `../../ccc-lib/http.ts`, `ONE_DAY` from `../../ccc-lib/constants.ts`.
- Produces: `GET /v1/sources` returning the JRD document.

- [ ] **Step 1: Create the branch**

```bash
cd ~/Developer/github.com/frog-pond/ccc-server
git checkout master && git pull origin master
git checkout -b serve-source-manifest
```

- [ ] **Step 2: Write the route handler**

Create `source/ccci-stolaf-college/v1/sources.ts`:

```ts
import {getJson} from '../../ccc-lib/http.ts'
import {ONE_DAY} from '../../ccc-lib/constants.ts'
import {GH_PAGES} from './gh-pages.ts'
import type {Context} from '../../ccc-server/context.ts'

export async function sources(ctx: Context) {
	ctx.cacheControl(ONE_DAY)
	if (ctx.cached(ONE_DAY)) return

	ctx.body = await getJson(GH_PAGES('sources.json'))
}
```

- [ ] **Step 3: Register the route**

In `source/ccci-stolaf-college/v1/index.ts`, add the import beside the others:

```ts
import * as sources from './sources.ts'
```

and register the route near the `a-to-z` registration (line 70):

```ts
// sources
api.get('/sources', sources.sources)
```

- [ ] **Step 4: Run the server and verify the route**

```bash
npm run stolaf-college &
sleep 5
curl -sS localhost:3000/v1/sources | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{let d=JSON.parse(s);console.log(Object.keys(d).join(','),'links:',d.links.length)})"
```

Expected: `subject,links links: 9`. Kill the server afterwards.

This depends on Task 1 having been merged and deployed to `gh-pages`. Until then the fetch 404s — that is expected, and the app's bundled fallback covers it.

- [ ] **Step 5: Commit**

```bash
git add source/ccci-stolaf-college/v1/sources.ts source/ccci-stolaf-college/v1/index.ts
git commit -m "Serve the source manifest from GitHub Pages"
```

---

## Task 8: Retire the blocked ccc-server endpoints

**Files:**
- Modify: `source/ccci-stolaf-college/v1/news.ts:27-36`
- Modify: `source/ccci-stolaf-college/v1/calendar.ts:27-38`
- Modify: `source/ccci-stolaf-college/v1/index.ts`
- Delete: `source/ccci-stolaf-college/v1/a-z.ts`, `source/ccci-stolaf-college/v1/a-z.test.ts`

**Interfaces:**
- Consumes: `deprecatedWpJson` from `../../feeds/wp-json.ts`.
- Produces: `/v1/news/named/stolaf`, `/v1/a-to-z` and `/v1/calendar/named/stolaf` return the deprecation stub instead of a 500.

- [ ] **Step 1: Stub the news route**

In `source/ccci-stolaf-college/v1/news.ts`, replace the `stolaf` function:

```ts
/// St. Olaf's WordPress blocks this server's IP. The app fetches it directly
/// now; this stub keeps already-shipped builds showing a notice rather than an
/// error screen.
export function stolaf(ctx: Context) {
	ctx.cacheControl(ONE_HOUR)
	if (ctx.cached(ONE_HOUR)) return

	ctx.body = deprecatedWpJson()
}
```

`cachedWpJsonFeed` is still used by `mess`, so leave the import alone.

- [ ] **Step 2: Stub the calendar route and delete oleville**

In `source/ccci-stolaf-college/v1/calendar.ts`, replace `stolaf` and delete `oleville` entirely:

```ts
/// The imported Google calendar behind this route was deleted upstream. The app
/// reads The Events Calendar directly now.
export function stolaf(ctx: Context) {
	ctx.cacheControl(ONE_MINUTE)
	if (ctx.cached(ONE_MINUTE)) return

	ctx.body = []
}
```

- [ ] **Step 3: Stub the a-to-z route**

Delete `source/ccci-stolaf-college/v1/a-z.ts` and `source/ccci-stolaf-college/v1/a-z.test.ts`.

In `source/ccci-stolaf-college/v1/index.ts`, remove the `atoz` import and replace the route registration at line 70 with an inline stub:

```ts
// a-to-z — St. Olaf's WordPress blocks this server's IP; the app fetches it
// directly now.
api.get('/a-to-z', (ctx) => {
	ctx.cacheControl(ONE_DAY)
	if (ctx.cached(ONE_DAY)) return
	ctx.body = []
})
```

Add `ONE_DAY` to the constants import if it is not already there.

- [ ] **Step 4: Remove the oleville calendar route**

In `source/ccci-stolaf-college/v1/index.ts`, delete line 64:

```ts
api.get('/calendar/named/oleville', calendar.oleville)
```

- [ ] **Step 5: Run the tests and the server**

```bash
npm test
npm run stolaf-college &
sleep 5
for p in news/named/stolaf a-to-z calendar/named/stolaf news/named/mess calendar/named/northfield; do
  printf "%-32s " "$p"
  curl -sS -o /dev/null -w "%{http_code}\n" "localhost:3000/v1/$p"
done
```

Expected: `200` for all five. Kill the server afterwards.

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "Retire the endpoints St. Olaf blocks from this server"
```

---

## Follow-up: PR 2

The `application/rss+xml` and `text/calendar` parsers get their own plan once PR 1 is merged. They need no manifest change to land — a source only starts using them when its entry is edited to name the new type.

## Self-review

**Spec coverage.** Manifest format and content — Task 1. Hosting and the `/v1/sources` proxy — Tasks 1 and 7. Resolution and the three fallback rules — Task 3. Six parsers — Tasks 4, 5, 6. Per-feature changes including the deleted dead exports — Tasks 4, 5, 6. TEC mapping with all four payload quirks — Task 6. ccc-server stubs and removals — Task 8. The A–Z schema note needed no task; the schema already exists and is unchanged. Sequencing — Tasks 1–6 are the app PR, 7–8 the server PR.

**Type consistency.** `ResolvedSource` is defined in Task 2 and consumed in Tasks 3–6 with the same four fields. `WireEvent` is defined in Task 6's `tec-events.ts` and imported by `events.ts` in the same task. `parseWpV2Posts`, `parseFeedItems`, `parseStolafAToZ`, `parseAToZExtras`, `mergeAToZ`, `parseTecEvents` and `parseEvents` are each named identically where defined and where called.

**Known rough edge.** Task 6 casts `WireEvent[]` to `EventType[]` through `unknown`, because `EventType.startTime` is a `Moment` while the wire shape carries an ISO string, and `convertEvents` performs the conversion in `select`. The pre-existing code had the same gap, hidden behind `response as EventType[]`. Fixing it properly means splitting `EventType` into wire and view types, which is worth doing and is not this change.
