# Mac Data Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A macOS app that lets a non-developer edit St. Olaf's building hours, preview the edit through a bundled ccc-server on their phone, and submit it as a GitHub pull request.

**Architecture:** A SwiftUI app (`macos/DataEditor`) drives a bundled Node "pipeline helper" over JSON lines on stdio. The helper owns YAML editing, validation, `bundle-data` builds and a static server for the build. The app also runs a bundled ccc-server in dev mode with a new `PAGES_ORIGIN_OVERRIDE`, so ccc reads hours and redirects data files to the Mac. Everything that is not UI lives in a Swift package, `DataEditorKit`, tested with Swift Testing.

**Tech Stack:** SwiftUI and Swift Testing (Xcode 27, macOS 27), Node 24 with `node:test`, the `yaml` package's Document API, esbuild, Cloudflare Workers with vitest (`@cloudflare/vitest-plugin`), GitHub REST API with OAuth device flow, Sparkle 2.

**Spec:** `documentation/specs/2026-11-05-mac-data-editor-design.md`

## Global Constraints

- macOS 27 or later, Apple Silicon (arm64) only.
- St. Olaf only; building hours (`data/building-hours/*.yaml`) and the break calendar it refers to (`data/breaks.yaml`) are the only files v1 edits.
- Distribution: Developer ID signed, hardened runtime, notarized, published on GitHub Releases under tags `data-editor-v*`, updated through Sparkle. Not sandboxed in v1, but nothing may rule the sandbox out later.
- `PAGES_ORIGIN_OVERRIDE` is only ever passed to `wrangler dev` by the dev script; it never appears in `wrangler.jsonc`.
- AAO conventions (`AGENTS.md`): commit subjects are imperative, capitalised, no prefix, no trailing full stop; no `any`; tabs, single quotes, no semicolons in JS/TS; `///` or `/** */` on declarations; node:test files sit beside their subject as `scripts/<name>.test.mjs`.
- ccc-server conventions: the same commit style; Prettier settings in its `package.json` (tabs, single quotes, no semicolons, width 100).
- The Node version is the repo's: `node = "24.22.0"` in `mise.toml`.
- Bundle identifier `com.drewvolz.allaboutolaf-data-editor`, team `NFMTHAZVS9`, the same team as Radio.
- No model identifiers in commits, PRs or code.

## Review Focus

1. **Closing after midnight.** A row such as `{days: [Fr], from: '8:00pm', to: '2:00am'}` must draw on Friday evening and early Saturday, and must not read as negative or as a whole day. The test is in Task 11.
2. **Typing quickly.** Ten edits in a second must lead to one build, made from the last edit, and the data server must never serve a half-written build. The tests are in Tasks 6 and 11.
3. **Submitting again after review comments.** A second submit while the PR is open must add a commit to that PR's branch, not open a new PR. The test is in Task 10.
4. **A revoked or expired GitHub token.** A 401 must clear the stored token and ask for sign-in, not fail with a raw error every time. The test is in Task 10.
5. **A download that fails partway.** Losing the network during the first download or an update must leave the workspace and its base commit as they were. The test is in Task 8, along with the tests for keeping edits across an update.

## Execution notes (Parts A and B, done 2026-11-09)

Parts A and B (Tasks 1–7) are built: ccc-server PR frog-pond/ccc-server#1265 (branch `data-editor-origin`) and this branch's `scripts/data-editor-*`. **The committed code supersedes the Task 1–7 listings below where they differ.** What changed, and what Tasks 8–16 must know:

- **The Cage's file is `data/building-hours/1-1-cage.yaml`.** The plan originally guessed `the-cage.yaml`; every reference below now uses the real name.
- **Edited files go through oxfmt.** `yaml` alone could not reproduce two hours files that oxfmt wraps; `yaml` followed by oxfmt's `format()` (with `.oxfmtrc.json`'s options, pinned by a test) is byte-identical on all 52 files and keeps PRs passing `oxfmt --check`. So the helper bundle ships `helper/node_modules/` (oxfmt, its native `@oxfmt/binding-*`, tinypool). Task 15 keeps that folder (it copies `build/helper` whole) and its signing script already signs `*.node`. **A release build must run on an arm64 Mac** so the binding is `@oxfmt/binding-darwin-arm64`; add a check for that folder to `embed-runtime.sh`.
- **The bundle defines `import.meta.main` as false** and starts the helper through its exported `main()`, because esbuild inlines every module and their own CLI guards would otherwise run.
- **Builds go to fresh `out/build-*` folders.** The helper serves the newest good one and prunes the rest; the protocol's `build` reply is still `{ok}` or `{ok: false, problems}`. Nothing in Swift reads `out/` (Task 8's `outDirectory` is only passed to the helper).
- **Edits are written via `_<name>.next`**, a name every data script skips, and removed if the write fails.
- **Problems are placed correctly under paths with spaces** (`~/Library/Application Support`). The tests' scratch folders all have a space; keep one in any new fixture path.
- **ccc in dev-origin mode sends `Cache-Control: no-store`** for hours, breaks and the redirects, so a refresh on the phone always reaches the Mac.
- **ccc-server's dev script uses `--ip ::`,** which needs IPv6; on a Mac that is always present.
- **Check on a device (Task 15 Step 5)** that the phone follows a redirect to `http://<name>.local:8790/…`. ATS should allow `.local` hosts, but the app's ATS exceptions name only `localhost`.
- **Deferred minors from the review**, worth folding in when their task comes up:
  - `listBuildings` fails whole if one file won't parse.
  - An edit index past a list's end fills holes with `null`.
  - A bad time yields two problems at one path.
  - `process.exit(0)` right after the last reply can truncate it.
  - A request without an `id` gets a reply without one.
  - `helper-stamp.json` ignores a dirty checkout.
  - The override is guarded only by its absence from `wrangler.jsonc`.

---

## File map

**ccc-server** (its own branch and PR, merged first):

| File | Responsibility |
|---|---|
| `workers/src/pages-origin.ts` (new) | Read the dev origin from `env`; rebase St. Olaf published URLs onto it |
| `workers/src/env.d.ts` | Declare `PAGES_ORIGIN_OVERRIDE` |
| `workers/src/router.ts` | Redirects go through `rebased`; `/spaces/hours` and `/breaks` read from the dev origin without the cache |
| `workers/src/sources/schedules.ts` | `loadSchedules(params, origin?)` |
| `workers/test/dev-pages-origin.test.ts` (new) | Worker tests for all of the above |
| `source/dev/wrangler-args.ts` (new), `source/dev/index.ts` | Pass the override and a persist directory to `wrangler dev` |
| `source/dev/wrangler-args.test.ts` (new) | Tests for the arguments |

**AAO-React-Native**:

| File | Responsibility |
|---|---|
| `scripts/data-editor-documents.mjs` | Load YAML Documents; apply path edits; write back preserving style |
| `scripts/data-editor-pipeline.ts` | List buildings, read the calendar, validate one file, run `bundle-data` atomically, parse problems |
| `scripts/data-editor-serve.mjs` | Static file server for the build |
| `scripts/data-editor-helper.mjs` | The JSON-lines stdio protocol over the three modules above |
| `scripts/build-data-editor-helper.mjs` | esbuild bundle of the helper and `bundle-data`, plus the tree-hash stamp |
| `macos/DataEditor/DataEditorKit/` | Swift package: JSON values, helper client, workspace, ccc runner, GitHub submitter, hours model, diff, debouncer |
| `macos/DataEditor/DataEditor.xcodeproj`, `macos/DataEditor/DataEditor/` | The app: model and views |
| `macos/DataEditor/scripts/` | Embed the runtime; sign and notarize |
| `macos/DataEditor/e2e/preview.test.mjs` | Helper + ccc end-to-end |
| `.github/workflows/data-editor.yml` | Tests, and releases on `data-editor-v*` tags |

## The helper protocol (shared by Tasks 6, 7 and 8)

One JSON object per line on stdin; one reply per line on stdout. Requests are handled one at a time, in order.

```text
→ {"id":1,"method":"load","params":{"file":"building-hours/1-1-cage.yaml"}}
← {"id":1,"result":{"value":{…},"problems":[]}}
← {"id":2,"error":{"message":"building-hours/x.yaml is outside the workspace"}}
```

| Method | Params | Result |
|---|---|---|
| `list` | `{}` | `[{file, name, category}]`, sorted by category, then name |
| `calendar` | `{}` | `{breaks: [{key, name, start, end, templates: [string]}], templates: [string]}` |
| `load` | `{file}` | `{value, problems}` |
| `edit` | `{file, ops: [{path, value} or {path, delete: true}]}` | `{value, problems}` |
| `build` | `{}` | `{ok: true}` or `{ok: false, problems}` |
| `serve` | `{port}` | `{port}` (idempotent) |

`file` is relative to the data directory. `path` is an array of string keys and integer indexes. A `Problem` is `{file: string|null, message: string, path: (string|number)[]|null}`.

Helper command line: `node data-editor-helper.mjs --data <dir> --out <dir> [--bundle-data <file>]`.

---

## Part A: ccc-server

Work in `/path/to/ccc-server` on a branch `data-editor-origin`. Run `npm ci` once at the root first.

### Task 1: Redirect St. Olaf's published files to a dev origin

**Files:**
- Create: `workers/src/pages-origin.ts`
- Modify: `workers/src/env.d.ts`, `workers/src/router.ts` (the `redirect` helper around line 161 and its three callers around lines 356, 390 and 394)
- Test: `workers/test/dev-pages-origin.test.ts`

**Interfaces:**
- Produces: `STOLAF_PUBLISHED: string`, `devPagesOrigin(env: Pick<Env, 'PAGES_ORIGIN_OVERRIDE'>): string | undefined`, `rebased(url: string, origin: string | undefined): string`

- [ ] **Step 1: Write the failing test**

`workers/test/dev-pages-origin.test.ts`:

```ts
import {env} from 'cloudflare:workers'
import {describe, expect, test} from 'vitest'
import wranglerConfig from '../../wrangler.jsonc?raw'
import {STOLAF_PUBLISHED, devPagesOrigin, rebased} from '../src/pages-origin.ts'
import {STOLAF_SCHEDULES} from '../src/pages-routes.ts'
import {route} from '../src/router.ts'

const ORIGIN = 'http://editor-mac.local:8790/'

/// The test worker's bindings with the dev origin added, everything else unchanged.
const withOrigin = Object.assign(Object.create(env) as Env, {PAGES_ORIGIN_OVERRIDE: ORIGIN})

const get = (path: string, bindings: Env = withOrigin) =>
	route(new Request(`https://worker.test${path}`), bindings)

describe('devPagesOrigin', () => {
	test.each([undefined, '', 'not a url', 'file:///Users/someone/out/'])(
		'is undefined for %j',
		(value) => {
			expect(devPagesOrigin({PAGES_ORIGIN_OVERRIDE: value})).toBeUndefined()
		},
	)
	test('ends the origin with a slash', () => {
		expect(devPagesOrigin({PAGES_ORIGIN_OVERRIDE: 'http://editor-mac.local:8790'})).toBe(ORIGIN)
	})
})

describe('rebased', () => {
	test('moves a St. Olaf published file onto the origin', () => {
		expect(rebased(`${STOLAF_PUBLISHED}bus-times.json`, ORIGIN)).toBe(`${ORIGIN}bus-times.json`)
	})
	test.each([
		'https://carls-app.github.io/carls/bus-times.json',
		'https://stolaf.dev/course-data/catalog-recent.db',
	])('leaves %s alone', (url) => {
		expect(rebased(url, ORIGIN)).toBe(url)
	})
	test('leaves everything alone without an origin', () => {
		expect(rebased(`${STOLAF_PUBLISHED}bus-times.json`, undefined)).toBe(
			`${STOLAF_PUBLISHED}bus-times.json`,
		)
	})
	test('names the prefix the route table publishes under', () => {
		expect(STOLAF_SCHEDULES.hoursUrl.startsWith(STOLAF_PUBLISHED)).toBe(true)
	})
})

describe('redirects with a dev origin', () => {
	test.each([
		['/edu.stolaf/transit/bus', `${ORIGIN}bus-times.json`],
		['/edu.stolaf/contacts', `${ORIGIN}contact-info.json`],
		['/edu.stolaf/images/spaces/the-cage.webp', `${ORIGIN}img/spaces/the-cage.webp`],
		['/edu.stolaf/courses/catalog.db', 'https://stolaf.dev/course-data/catalog-recent.db'],
	])('GET %s goes to %s', async (path, location) => {
		let response = await get(path)
		expect(response.status).toBe(307)
		expect(response.headers.get('Location')).toBe(location)
	})
	test('without one, the published file', async () => {
		let response = await get('/edu.stolaf/transit/bus', env)
		expect(response.headers.get('Location')).toBe(`${STOLAF_PUBLISHED}bus-times.json`)
	})
	test('wrangler.jsonc never sets the override', () => {
		expect(wranglerConfig).not.toContain('PAGES_ORIGIN_OVERRIDE')
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run test/dev-pages-origin.test.ts`
Expected: FAIL, because `../src/pages-origin.ts` does not exist.

- [ ] **Step 3: Implement**

`workers/src/pages-origin.ts`:

```ts
/// Where All About Olaf's data files and images are published: the prefix a
/// dev origin takes the place of.
export const STOLAF_PUBLISHED = 'https://stolaf.dev/AAO-React-Native/'

/// The origin `wrangler dev` was told to serve St. Olaf's data from in place
/// of stolaf.dev, or undefined. The Mac data editor passes it through
/// `source/dev/index.ts`; wrangler.jsonc never sets it, so a deploy has none.
export function devPagesOrigin(env: Pick<Env, 'PAGES_ORIGIN_OVERRIDE'>): string | undefined {
	let value = env.PAGES_ORIGIN_OVERRIDE
	if (!value) return undefined
	let parsed: URL
	try {
		parsed = new URL(value)
	} catch {
		return undefined
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined
	return parsed.href.endsWith('/') ? parsed.href : `${parsed.href}/`
}

/// `url` on `origin` when it is one of St. Olaf's published files; otherwise `url`.
export function rebased(url: string, origin: string | undefined): string {
	if (origin === undefined || !url.startsWith(STOLAF_PUBLISHED)) return url
	return origin + url.slice(STOLAF_PUBLISHED.length)
}
```

In `workers/src/env.d.ts`, add to `interface Env`:

```ts
	/** where `wrangler dev` reads St. Olaf's data files from instead of stolaf.dev, for the Mac data editor; never set on a deploy */
	PAGES_ORIGIN_OVERRIDE?: string
```

In `workers/src/router.ts`, import `{devPagesOrigin, rebased} from './pages-origin.ts'`, and replace the `redirect` helper with one that takes `env`:

```ts
/// A temporary redirect to where a file is published, or to the dev origin
/// serving it instead. Temporary, so a client asks here again and the file can
/// be served from here later.
const redirect = (env: Env, location: string) =>
	new Response(null, {
		status: 307,
		headers: {
			Location: rebased(location, devPagesOrigin(env)),
			'Cache-Control': `public, max-age=${CLIENT_MAX_AGE.toFixed(0)}`,
		},
	})
```

Then update its three callers to `redirect(env, location)`, `redirect(env, imageUrl(image[1], image[2]).href)` and `redirect(env, file.url)`. Run `grep -n "redirect(" workers/src/router.ts` to confirm that no other caller remains.

- [ ] **Step 4: Run the tests**

Run: `cd workers && npx vitest run test/dev-pages-origin.test.ts test/published-redirects.test.ts test/redirects.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck and commit**

```bash
cd workers && npm run typecheck && cd ..
git add workers/src/pages-origin.ts workers/src/env.d.ts workers/src/router.ts workers/test/dev-pages-origin.test.ts
git commit -m "Redirect St. Olaf's published files to a dev origin when one is set"
```

### Task 2: Read hours and breaks from the dev origin, uncached

**Files:**
- Modify: `workers/src/sources/schedules.ts`, and the `schedule` function in `workers/src/router.ts` (around line 172)
- Test: `workers/test/dev-pages-origin.test.ts` (append)

**Interfaces:**
- Consumes: `devPagesOrigin` and `rebased` (Task 1)
- Produces: `loadSchedules(params: ScheduleParams, origin?: string): Promise<ScheduleResponses>`

- [ ] **Step 1: Write the failing tests**

Add these imports at the top of `workers/test/dev-pages-origin.test.ts`, merging with the existing lines:

```ts
import {afterEach, beforeEach, type MockInstance} from 'vitest'
import {schedules} from '../src/sources/schedules.ts'
import {spyOnFetch} from './spy.ts'
import calendar from '../../source/schedules/fixtures/calendar.json?raw'
import spaces from '../../source/schedules/fixtures/spaces.json?raw'
```

Append:

```ts
const json = (body: string, status = 200) =>
	new Response(body, {status, headers: {'content-type': 'application/json'}})

describe('GET /edu.stolaf/spaces/hours with a dev origin', () => {
	let fetchSpy: MockInstance<typeof fetch>
	const fromOrigin = () =>
		fetchSpy.mock.calls.map(([input]) => String(input)).filter((url) => url.startsWith(ORIGIN))

	beforeEach(async () => {
		await env.SOURCE.getByName(`${schedules.name}:${schedules.key(STOLAF_SCHEDULES)}`).purge()
		fetchSpy = spyOnFetch()
		fetchSpy.mockImplementation((input) => {
			let url = String(input)
			if (url.endsWith('/building-hours.json')) return Promise.resolve(json(`{"data": ${spaces}}`))
			if (url.endsWith('/breaks.json')) return Promise.resolve(json(`{"data": ${calendar}}`))
			return Promise.resolve(json('{}', 404))
		})
	})
	afterEach(() => {
		fetchSpy.mockRestore()
	})

	test('reads both files from the origin', async () => {
		let response = await get('/edu.stolaf/spaces/hours?breaks=none')
		expect(response.status).toBe(200)
		expect(fromOrigin().sort()).toEqual([`${ORIGIN}breaks.json`, `${ORIGIN}building-hours.json`])
	})

	test('answers as the published files would', async () => {
		let local: unknown = await (await get('/edu.stolaf/spaces/hours?breaks=none')).json()
		let published: unknown = await (await get('/edu.stolaf/spaces/hours?breaks=none', env)).json()
		expect(local).toEqual(published)
	})

	test('reads them again for every request', async () => {
		await get('/edu.stolaf/spaces/hours?breaks=none')
		await get('/edu.stolaf/breaks')
		expect(fromOrigin()).toHaveLength(4)
	})
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd workers && npx vitest run test/dev-pages-origin.test.ts`
Expected: FAIL. "reads both files from the origin" finds no origin fetches, because the route still reads stolaf.dev.

- [ ] **Step 3: Implement**

In `workers/src/sources/schedules.ts`, replace `published` and the `load` of `schedules`:

```ts
async function published(url: string, origin?: string): Promise<unknown> {
	let parsed = new URL(url)
	let fromDevOrigin = origin !== undefined && url.startsWith(origin)
	if (!fromDevOrigin && (parsed.protocol !== 'https:' || !SCHEDULE_HOSTS.has(parsed.hostname))) {
		throw new Error(`${url} is not a schedule file this reads`)
	}
	// the host was checked above, so a redirect to another is not followed
	let response = await upstream(url)
	if (!response.ok) {
		throw new Error(`The schedule file responded ${String(response.status)} for ${url}`)
	}
	return publicationData(await response.json())
}

/// Both files read and resolved together. `origin` is the dev origin the
/// urls were rebased onto, which is read from despite the host check.
export async function loadSchedules(
	{hoursUrl, breaksUrl}: ScheduleParams,
	origin?: string,
): Promise<ScheduleResponses> {
	let [hours, calendar] = await Promise.all([published(hoursUrl, origin), published(breaksUrl, origin)])
	return resolveScheduleResponses(calendar, hours)
}
```

Then, inside `defineSource({...})`, change `load` to:

```ts
	load: (params) => loadSchedules(params),
```

In `workers/src/router.ts`, import `loadSchedules` next to `schedules`, and in `schedule(...)` replace `let {value} = await fetchSource(env, schedules, params)` with:

```ts
		// A dev origin's files change with every save in the data editor, so they
		// are read for each request rather than kept.
		let origin = devPagesOrigin(env)
		let value =
			origin === undefined
				? (await fetchSource(env, schedules, params)).value
				: await loadSchedules(
						{hoursUrl: rebased(params.hoursUrl, origin), breaksUrl: rebased(params.breaksUrl, origin)},
						origin,
					)
```

- [ ] **Step 4: Run the tests**

Run: `cd workers && npx vitest run test/dev-pages-origin.test.ts test/schedules.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck and commit**

```bash
cd workers && npm run typecheck && cd ..
git add workers/src/sources/schedules.ts workers/src/router.ts workers/test/dev-pages-origin.test.ts
git commit -m "Read hours and breaks from a dev origin on every request"
```

### Task 3: Pass the override and a state directory through the dev script

**Files:**
- Create: `source/dev/wrangler-args.ts`, `source/dev/wrangler-args.test.ts`
- Modify: `source/dev/index.ts` (the `spawn(...)` arguments)

**Interfaces:**
- Produces: `wranglerArgs(port: number, env: NodeJS.ProcessEnv): string[]`. The ccc runner (Task 9) sets `PAGES_ORIGIN_OVERRIDE` and `CCC_PERSIST_TO` in the environment of `node source/dev/index.ts`.

- [ ] **Step 1: Write the failing test**

`source/dev/wrangler-args.test.ts`:

```ts
import {describe, it} from 'node:test'
import {wranglerArgs} from './wrangler-args.ts'

const BASE = ['dev', '-c', 'wrangler.jsonc', '--ip', '::', '--port', '8787']

void describe('wranglerArgs', () => {
	void it('runs the Worker on every address', (t) => {
		t.assert.deepStrictEqual(wranglerArgs(8787, {}), BASE)
	})
	void it('passes a dev origin as a var', (t) => {
		t.assert.deepStrictEqual(
			wranglerArgs(8787, {PAGES_ORIGIN_OVERRIDE: 'http://editor-mac.local:8790/'}),
			[...BASE, '--var', 'PAGES_ORIGIN_OVERRIDE:http://editor-mac.local:8790/'],
		)
	})
	void it('keeps wrangler state where it is told to', (t) => {
		t.assert.deepStrictEqual(wranglerArgs(8787, {CCC_PERSIST_TO: '/tmp/ccc-state'}), [
			...BASE,
			'--persist-to',
			'/tmp/ccc-state',
		])
	})
	void it('ignores empty values', (t) => {
		t.assert.deepStrictEqual(wranglerArgs(8787, {PAGES_ORIGIN_OVERRIDE: '', CCC_PERSIST_TO: ''}), BASE)
	})
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test source/dev/wrangler-args.test.ts`
Expected: FAIL, because the module cannot be found.

- [ ] **Step 3: Implement**

`source/dev/wrangler-args.ts`:

```ts
/// The arguments `mise run dev` starts wrangler with. `PAGES_ORIGIN_OVERRIDE`
/// becomes a var the Worker reads (the Mac data editor sets it), and
/// `CCC_PERSIST_TO` moves wrangler's local state out of the checkout, which
/// the data editor's copy of ccc cannot write to.
export function wranglerArgs(port: number, env: NodeJS.ProcessEnv): string[] {
	let args = ['dev', '-c', 'wrangler.jsonc', '--ip', '::', '--port', String(port)]
	let origin = env['PAGES_ORIGIN_OVERRIDE']
	if (origin) args.push('--var', `PAGES_ORIGIN_OVERRIDE:${origin}`)
	let persistTo = env['CCC_PERSIST_TO']
	if (persistTo) args.push('--persist-to', persistTo)
	return args
}
```

In `source/dev/index.ts`, import it, and replace the literal argument array in `spawn('node_modules/.bin/wrangler', [...], …)` with `wranglerArgs(PORT, process.env)`.

- [ ] **Step 4: Run the tests**

Run: `node --test source/dev/wrangler-args.test.ts && npm run lint`
Expected: PASS.

- [ ] **Step 5: Check that wrangler keeps the whole value**

The value contains colons. Run:

```bash
PAGES_ORIGIN_OVERRIDE=http://127.0.0.1:8790/ node source/dev/index.ts &
sleep 20; curl -sI http://localhost:8787/edu.stolaf/v1/transit/bus | grep -i '^location'; kill %1
```

Expected: `location: http://127.0.0.1:8790/bus-times.json`. If the value is cut at a colon, do not work around it here. Switch `wranglerArgs` to write the var into a temporary `.env` file passed with `--env-file`, update the test to match, and record the change in this plan.

- [ ] **Step 6: Commit, push, open the PR**

```bash
git add source/dev/wrangler-args.ts source/dev/wrangler-args.test.ts source/dev/index.ts
git commit -m "Let the dev script take a data origin and a state directory"
git push -u origin data-editor-origin
```

Open a draft PR titled "Let a local Worker serve St. Olaf's data from a dev origin". Once it merges, its merge commit SHA goes in `macos/DataEditor/ccc-server.ref` (Task 15).

---

## Part B: the pipeline helper (AAO-React-Native)

Work on branch `mac-data-editor`. Run `mise install && pnpm install` first.

### Task 4: Edit YAML documents without disturbing them

**Files:**
- Modify: `package.json` (devDependencies `yaml` and `esbuild`)
- Create: `scripts/data-editor-documents.mjs`
- Test: `scripts/data-editor-documents.test.mjs`

**Interfaces:**
- Produces: `TO_STRING_OPTIONS`, `inside(root: string, file: string): string`, `roundTrip(text: string): string`, `class DocumentStore { constructor(root: string); load(file: string): Promise<unknown>; edit(file: string, ops: Op[]): Promise<unknown> }`. Each `edit` reads the file afresh, so a revert or a workspace update made by the app underneath the helper is never overwritten with a stale copy., where `Op = {path: (string|number)[], value?: unknown, delete?: true}`

- [ ] **Step 1: Add the dependencies**

Run: `pnpm add -D -w yaml esbuild`, then `mise run validate-deps validate-catalog-refs validate-single-copy`. If a check asks for a catalog entry, move the version into `pnpm-workspace.yaml`'s catalog, use `catalog:` in `package.json`, and run the checks again until they pass.

- [ ] **Step 2: Write the failing tests**

`scripts/data-editor-documents.test.mjs`:

```js
import assert from 'node:assert/strict'
import {mkdtemp, readFile, writeFile} from 'node:fs/promises'
import {readdirSync, readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import {isDataEntry} from './data-entries.mjs'
import {DATA_BASE} from './paths.mjs'
import {DocumentStore, inside, roundTrip} from './data-editor-documents.mjs'

const FIXTURE = `# The Cage's hours, checked 2026-10-01.
name: The Cage
category: Food
kind: space
links:
  - {title: 'The Cage on Bon Appétit', url: 'https://example.com/cage'}

schedule:
  - title: Hours
    notes: The kitchen stops cooking at 8 p.m.
    hours:
      - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '8:00pm'}
      - {days: [Sa, Su], from: '9:00am', to: '8:00pm'}
`

async function storeWithFixture() {
	let root = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
	await writeFile(path.join(root, 'cage.yaml'), FIXTURE)
	return {root, store: new DocumentStore(root), read: () => readFile(path.join(root, 'cage.yaml'), 'utf8')}
}

describe('roundTrip', () => {
	let hours = readdirSync(path.join(DATA_BASE, 'building-hours'))
		.filter(isDataEntry)
		.map((file) => path.join('building-hours', file))
	for (let file of [...hours, 'breaks.yaml']) {
		it(`leaves ${file} as it is`, () => {
			let text = readFileSync(path.join(DATA_BASE, file), 'utf8')
			assert.equal(roundTrip(text), text)
		})
	}
})

describe('DocumentStore.edit', () => {
	it('changes a time and nothing else', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [{path: ['schedule', 0, 'hours', 0, 'to'], value: '9:00pm'}])
		assert.equal(await read(), FIXTURE.replace("Fr], from: '7:30am', to: '8:00pm'", "Fr], from: '7:30am', to: '9:00pm'"))
	})

	it('adds a row in the style of its neighbours', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [
			{path: ['schedule', 0, 'hours', 2], value: {days: ['Su'], from: '9:00am', to: '10:30am'}},
		])
		assert.equal(await read(), FIXTURE + "      - {days: [Su], from: '9:00am', to: '10:30am'}\n")
	})

	it('adds a service whose rows are flow maps', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [
			{
				path: ['schedule', 1],
				value: {title: 'Grill', hours: [{days: ['Mo'], from: '11:00am', to: '2:00pm'}]},
			},
		])
		assert.match(await read(), /- title: Grill\n {4}hours:\n {6}- \{days: \[Mo\], from: '11:00am', to: '2:00pm'\}\n$/u)
	})

	it('deletes a row', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [{path: ['schedule', 0, 'hours', 1], delete: true}])
		assert.equal(await read(), FIXTURE.replace("      - {days: [Sa, Su], from: '9:00am', to: '8:00pm'}\n", ''))
	})

	it('returns the edited value', async () => {
		let {store} = await storeWithFixture()
		let value = await store.edit('cage.yaml', [{path: ['name'], value: 'The Cage Grill'}])
		assert.equal(value.name, 'The Cage Grill')
	})

	it('edits the file as it is on disk, not as it was loaded', async () => {
		let {root, store, read} = await storeWithFixture()
		await store.load('cage.yaml')
		await writeFile(path.join(root, 'cage.yaml'), FIXTURE.replace('name: The Cage', 'name: The Cage Café'))
		await store.edit('cage.yaml', [{path: ['category'], value: 'Dining'}])
		assert.match(await read(), /name: The Cage Café\ncategory: Dining\n/u)
	})

	it('refuses an edit with no path', async () => {
		let {store} = await storeWithFixture()
		await assert.rejects(store.edit('cage.yaml', [{path: [], value: 1}]), /needs a path/u)
	})

	it('refuses a file outside the workspace', async () => {
		let {store} = await storeWithFixture()
		await assert.rejects(store.load('../outside.yaml'), /outside the workspace/u)
	})
})

describe('inside', () => {
	it('resolves a file in the root', () => {
		assert.equal(inside('/ws/data', 'building-hours/x.yaml'), '/ws/data/building-hours/x.yaml')
	})
	it('refuses a sibling whose name starts with the root', () => {
		assert.throws(() => inside('/ws/data', '../data-old/x.yaml'), /outside the workspace/u)
	})
})
```

- [ ] **Step 3: Run them to verify they fail**

Run: `node --test scripts/data-editor-documents.test.mjs`
Expected: FAIL, because the module cannot be found.

- [ ] **Step 4: Implement**

`scripts/data-editor-documents.mjs`:

```js
import {readFile, rename, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {isMap, isScalar, isSeq, parseDocument, visit} from 'yaml'

/** How a document is written back: the data files' own style, never re-wrapped. */
export const TO_STRING_OPTIONS = {lineWidth: 0, flowCollectionPadding: false}

/** A time such as `7:30am`, which the data files always single-quote. */
const TIME = /^(?:[1-9]|1[0-2]):[0-5]\d[ap]m$/u

/** Lists whose items the data files write one per line as flow maps. */
const FLOW_ROWS = new Set(['hours', 'links'])

/** `file` resolved inside `root`, or an error for a path that leaves it. */
export function inside(root, file) {
	let resolved = path.resolve(root, file)
	if (!resolved.startsWith(path.resolve(root) + path.sep)) {
		throw new Error(`${file} is outside the workspace`)
	}
	return resolved
}

/** `text` parsed and written back, which for a file in the repo's style is `text` again. */
export function roundTrip(text) {
	let doc = parseDocument(text)
	if (doc.errors.length > 0) throw new Error(doc.errors[0].message)
	return doc.toString(TO_STRING_OPTIONS)
}

/** A node for `value` styled like the data files: flow rows, quoted times. */
function styled(doc, parentPath, value) {
	let node = doc.createNode(value)
	let parent = doc.getIn(parentPath, true)
	let sibling = isSeq(parent) ? parent.items[0] : undefined
	if (isMap(node) && isMap(sibling) && sibling.flow) node.flow = true
	visit(node, {
		Pair(_, pair) {
			if (isScalar(pair.key) && FLOW_ROWS.has(String(pair.key.value)) && isSeq(pair.value)) {
				for (let row of pair.value.items) if (isMap(row)) row.flow = true
			}
		},
		Scalar(_, scalar) {
			if (typeof scalar.value === 'string' && TIME.test(scalar.value)) scalar.type = 'QUOTE_SINGLE'
		},
	})
	return node
}

/** Applies one edit, keeping an existing scalar's quoting when only its value changes. */
function apply(doc, op) {
	if (!Array.isArray(op.path) || op.path.length === 0) throw new Error('an edit needs a path')
	if (op.delete) {
		doc.deleteIn(op.path)
		return
	}
	let existing = doc.getIn(op.path, true)
	if (isScalar(existing) && (op.value === null || typeof op.value !== 'object')) {
		existing.value = op.value
		return
	}
	doc.setIn(op.path, styled(doc, op.path.slice(0, -1), op.value))
}

/**
 * The data files being edited. Each edit parses the file as it is on disk,
 * so comments survive and a file the app changed underneath (a revert, an
 * update to master) is never overwritten with a stale copy.
 */
export class DocumentStore {
	#root

	constructor(root) {
		this.#root = path.resolve(root)
	}

	async #parse(file) {
		let filename = inside(this.#root, file)
		let doc = parseDocument(await readFile(filename, 'utf8'))
		if (doc.errors.length > 0) throw new Error(`${file}: ${doc.errors[0].message}`)
		return {filename, doc}
	}

	/** `file`'s value. */
	async load(file) {
		return (await this.#parse(file)).doc.toJS()
	}

	/** Applies `ops` in order, writes the file, and returns its new value. */
	async edit(file, ops) {
		let {filename, doc} = await this.#parse(file)
		for (let op of ops) apply(doc, op)
		// a reader never sees half a file
		let next = `${filename}.next`
		await writeFile(next, doc.toString(TO_STRING_OPTIONS))
		await rename(next, filename)
		return doc.toJS()
	}
}
```

- [ ] **Step 5: Run the tests**

Run: `node --test scripts/data-editor-documents.test.mjs`
Expected: PASS. If a `roundTrip` case fails, the assertion diff shows which lines changed. Fix it only by adjusting `TO_STRING_OPTIONS` (the options are in the `yaml` package's `ToStringOptions`). If a file cannot round-trip with any options, stop and report it: the design depends on this.

- [ ] **Step 6: Add the test to the node test task and commit**

`scripts/*.test.mjs` is already in `[tasks."test:node"]`, so no change is needed there. Run `mise run lint format:check`, then:

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml scripts/data-editor-documents.mjs scripts/data-editor-documents.test.mjs
git commit -m "Edit data files by path without disturbing the rest of them"
```

### Task 5: Validate a file and list what the editor needs

**Files:**
- Create: `scripts/data-editor-pipeline.ts`, `scripts/data-editor-test-support.mjs`
- Test: `scripts/data-editor-pipeline.test.mjs`

**Interfaces:**
- Consumes: `loadScheduleData(fromDir, selection)` from `scripts/schedule-data.ts`
- Produces: `type Problem`, `keysOf(rest: string): (string|number)[]`, `problemsFrom(error: unknown, dataDir: string): Problem[]`, `validate(dataDir: string, file: string): Problem[]`, `listBuildings(dataDir: string): Building[]`, `readCalendar(dataDir: string): Calendar`

- [ ] **Step 1: Write the failing tests**

`scripts/data-editor-test-support.mjs` (shared by the data editor's tests, and not itself a test file, so the test runner's glob skips it):

```js
import {cp, mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {DATA_BASE} from './paths.mjs'

/** A scratch copy of the repo's data, which a test may break. */
export async function scratchData() {
	let root = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
	let dataDir = path.join(root, 'data')
	await cp(DATA_BASE, dataDir, {recursive: true})
	return {root, dataDir}
}
```

`scripts/data-editor-pipeline.test.mjs`:

```js
import assert from 'node:assert/strict'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {describe, it} from 'node:test'
import {DATA_BASE} from './paths.mjs'
import {keysOf, listBuildings, problemsFrom, readCalendar, validate} from './data-editor-pipeline.ts'
import {scratchData} from './data-editor-test-support.mjs'

describe('keysOf', () => {
	it('reads a JSON pointer', () => {
		assert.deepEqual(keysOf('/schedule/0/hours/1/to'), ['schedule', 0, 'hours', 1, 'to'])
	})
	it('reads a dotted path', () => {
		assert.deepEqual(keysOf('.breakSchedule.fall.schedule[0].notes'), [
			'breakSchedule',
			'fall',
			'schedule',
			0,
			'notes',
		])
	})
})

describe('problemsFrom', () => {
	let dataDir = '/ws/data'
	it('ties a schema error to its file and field', () => {
		let error = new Error('/ws/data/building-hours/cage.yaml/schedule/0/hours/0/from must match pattern "^x$"')
		assert.deepEqual(problemsFrom(error, dataDir), [
			{
				file: 'building-hours/cage.yaml',
				message: 'must match pattern "^x$"',
				path: ['schedule', 0, 'hours', 0, 'from'],
			},
		])
	})
	it('splits several errors', () => {
		let error = new Error('/ws/data/breaks.yaml/breaks must be object; /ws/data/breaks.yaml/timezone must be string')
		assert.equal(problemsFrom(error, dataDir).length, 2)
	})
	it('reads a break-message error', () => {
		let error = new Error(
			'/ws/data/building-hours/cage.yaml.breakSchedule.fall.schedule[0].notes: break closure messages must not end with a period',
		)
		let [problem] = problemsFrom(error, dataDir)
		assert.deepEqual(problem.path, ['breakSchedule', 'fall', 'schedule', 0, 'notes'])
		assert.equal(problem.message, 'break closure messages must not end with a period')
	})
	it('keeps an error it cannot place', () => {
		assert.deepEqual(problemsFrom(new Error('something else'), dataDir), [
			{file: null, message: 'something else', path: null},
		])
	})
})

describe('validate', () => {
	it('finds nothing wrong with the repo data', async () => {
		let {dataDir} = await scratchData()
		assert.deepEqual(validate(dataDir, 'building-hours/1-1-cage.yaml'), [])
	})
	it('places a bad time', async () => {
		let {dataDir} = await scratchData()
		let file = path.join(dataDir, 'building-hours/1-1-cage.yaml')
		await writeFile(file, (await readFile(file, 'utf8')).replace("from: '7:30am'", "from: '7:30'"))
		let problems = validate(dataDir, 'building-hours/1-1-cage.yaml')
		assert.ok(
			problems.some(
				(p) => p.file === 'building-hours/1-1-cage.yaml' && p.path?.slice(0, 4).join('/') === 'schedule/0/hours/0',
			),
			JSON.stringify(problems),
		)
	})
})

describe('listBuildings', () => {
	it('lists every hours file with its name and category, in order', () => {
		let buildings = listBuildings(DATA_BASE)
		assert.ok(buildings.some((b) => b.file === 'building-hours/1-1-cage.yaml' && b.name === 'The Cage' && b.category === 'Food'))
		let keys = buildings.map((b) => `${b.category}\u0000${b.name}`)
		assert.deepEqual(keys, [...keys].sort((a, b) => a.localeCompare(b)))
	})
})

describe('readCalendar', () => {
	it('lists the breaks and the template names', () => {
		let calendar = readCalendar(DATA_BASE)
		assert.ok(calendar.breaks.some((b) => b.key === 'weekOne' && b.name === 'New Student Orientation'))
		assert.ok(calendar.templates.includes('library-fall-closed'))
	})
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test scripts/data-editor-pipeline.test.mjs`
Expected: FAIL, because the module cannot be found.

- [ ] **Step 3: Implement**

`scripts/data-editor-pipeline.ts`:

```ts
import {readFileSync, readdirSync} from 'node:fs'
import path from 'node:path'
import {load} from 'js-yaml'
import {isDataEntry} from './data-entries.mjs'
import {loadScheduleData} from './schedule-data.ts'

/** Something wrong with the data, at a path inside `file` when the message names one. */
export type Problem = {file: string | null; message: string; path: (string | number)[] | null}

/** An hours file as the editor's sidebar lists it. */
export type Building = {file: string; name: string; category: string}

/** The break calendar as the break-schedule editor offers it. */
export type Calendar = {
	breaks: {key: string; name: string; start: string; end: string; templates: string[]}[]
	templates: string[]
}

type Key = string | number

const keyOf = (text: string): Key => (/^\d+$/u.test(text) ? Number(text) : text)

/** The keys in `/schedule/0/hours` (Ajv's pointers) or `.breakSchedule.fall[0]` (the schedule checks'). */
export function keysOf(rest: string): Key[] {
	if (rest.startsWith('/')) {
		return rest
			.slice(1)
			.split('/')
			.filter(Boolean)
			.map((key) => keyOf(key.replaceAll('~1', '/').replaceAll('~0', '~')))
	}
	return [...rest.matchAll(/\.([^.[\]]+)|\[(\d+)\]/gu)].map((match) =>
		match[1] !== undefined ? match[1] : Number(match[2]),
	)
}

/** The problems in an error from `loadScheduleData`, each tied to the file whose label begins it. */
export function problemsFrom(error: unknown, dataDir: string): Problem[] {
	let text = error instanceof Error ? error.message : String(error)
	return text.split('; ').map((part) => {
		let match = /^(\S+?\.ya?ml)([^\s:]*):?\s+(.*)$/su.exec(part)
		let label = match?.[1]
		let rest = match?.[2] ?? ''
		let message = match?.[3]
		if (label === undefined || message === undefined) return {file: null, message: part, path: null}
		return {file: path.relative(dataDir, label), message, path: rest === '' ? null : keysOf(rest)}
	})
}

/** `file` checked as `mise run validate-data` checks it: its schema, then the whole schedule graph. */
export function validate(dataDir: string, file: string): Problem[] {
	let filename = path.join(dataDir, file)
	const kind = file === 'breaks.yaml' ? 'calendar' : 'space'
	try {
		loadScheduleData(dataDir, {kind, filename})
		return []
	} catch (error) {
		return problemsFrom(error, dataDir)
	}
}

const readYaml = (filename: string): unknown => load(readFileSync(filename, 'utf8'), {filename})

const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

/** Every hours file, sorted by category and then name. */
export function listBuildings(dataDir: string): Building[] {
	let dir = path.join(dataDir, 'building-hours')
	let buildings = readdirSync(dir)
		.filter(isDataEntry)
		.map((entry) => {
			let data = asRecord(readYaml(path.join(dir, entry)))
			return {
				file: path.join('building-hours', entry),
				name: typeof data['name'] === 'string' ? data['name'] : entry,
				category: typeof data['category'] === 'string' ? data['category'] : '',
			}
		})
	let key = (b: Building) => `${b.category}\u0000${b.name}`
	return buildings.sort((a, b) => key(a).localeCompare(key(b)))
}

/** The breaks in `breaks.yaml` and the templates a building may name. */
export function readCalendar(dataDir: string): Calendar {
	let data = asRecord(readYaml(path.join(dataDir, 'breaks.yaml')))
	let breaks = Object.entries(asRecord(data['breaks'])).map(([key, raw]) => {
		let entry = asRecord(raw)
		return {
			key,
			name: String(entry['name'] ?? key),
			start: String(entry['start'] ?? ''),
			end: String(entry['end'] ?? ''),
			templates: Object.keys(asRecord(entry['templates'])),
		}
	})
	return {breaks, templates: Object.keys(asRecord(data['templates']))}
}
```

- [ ] **Step 4: Run the tests**

Run: `node --test scripts/data-editor-pipeline.test.mjs && mise run tsc`
Expected: PASS. If "places a bad time" fails, print the real message (`console.log(validate(...))`) and adjust the regular expression in `problemsFrom` to the real format. Then add that exact message as a new `problemsFrom` case.

- [ ] **Step 5: Commit**

```bash
git add scripts/data-editor-pipeline.ts scripts/data-editor-pipeline.test.mjs scripts/data-editor-test-support.mjs
git commit -m "Place schedule validation problems at the field they concern"
```

### Task 6: Build atomically and serve the build

**Files:**
- Modify: `scripts/data-editor-pipeline.ts` (add `build`)
- Create: `scripts/data-editor-serve.mjs`
- Test: `scripts/data-editor-pipeline.test.mjs` (append), `scripts/data-editor-serve.test.mjs`

**Interfaces:**
- Produces: `build({bundleData, dataDir, outDir}): Promise<{ok: true} | {ok: false; problems: Problem[]}>`, `serve({root, port, host?}): Promise<import('node:http').Server>`

- [ ] **Step 1: Write the failing tests**

Append to `scripts/data-editor-pipeline.test.mjs` (adding `build` to the import, and `existsSync` from `node:fs`):

```js
const BUNDLE_DATA = path.join(import.meta.dirname, 'bundle-data.mjs')

describe('build', () => {
	it('writes a whole build into outDir', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		assert.deepEqual(await build({bundleData: BUNDLE_DATA, dataDir, outDir}), {ok: true})
		assert.ok(existsSync(path.join(outDir, 'building-hours.json')))
		assert.ok(existsSync(path.join(outDir, 'breaks.json')))
	})

	it('keeps the last good build when the data is broken', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		await build({bundleData: BUNDLE_DATA, dataDir, outDir})
		let before = await readFile(path.join(outDir, 'building-hours.json'), 'utf8')
		let file = path.join(dataDir, 'building-hours/1-1-cage.yaml')
		await writeFile(file, (await readFile(file, 'utf8')).replace("from: '7:30am'", "from: '7:30'"))
		let result = await build({bundleData: BUNDLE_DATA, dataDir, outDir})
		assert.equal(result.ok, false)
		assert.ok(result.problems.some((p) => p.file === 'building-hours/1-1-cage.yaml'), JSON.stringify(result))
		assert.equal(await readFile(path.join(outDir, 'building-hours.json'), 'utf8'), before)
		assert.ok(!existsSync(`${outDir}.next`))
	})
})
```

`scripts/data-editor-serve.test.mjs`:

```js
import assert from 'node:assert/strict'
import {mkdir, mkdtemp, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {after, before, describe, it} from 'node:test'
import {serve} from './data-editor-serve.mjs'

describe('serve', () => {
	let server
	let base
	before(async () => {
		let parent = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
		let root = path.join(parent, 'out')
		await mkdir(path.join(root, 'img/spaces'), {recursive: true})
		await writeFile(path.join(root, 'bus-times.json'), '{"ok":true}')
		await writeFile(path.join(root, 'img/spaces/cage.webp'), 'RIFF')
		await writeFile(path.join(parent, 'secret.txt'), 'no')
		server = await serve({root, port: 0, host: '127.0.0.1'})
		base = `http://127.0.0.1:${server.address().port}`
	})
	after(() => server.close())

	it('serves a JSON file, never cached', async () => {
		let response = await fetch(`${base}/bus-times.json`)
		assert.equal(response.status, 200)
		assert.equal(response.headers.get('content-type'), 'application/json')
		assert.equal(response.headers.get('cache-control'), 'no-store')
		assert.deepEqual(await response.json(), {ok: true})
	})
	it('serves an image', async () => {
		let response = await fetch(`${base}/img/spaces/cage.webp`)
		assert.equal(response.headers.get('content-type'), 'image/webp')
	})
	it('answers 404 for a missing file', async () => {
		assert.equal((await fetch(`${base}/nope.json`)).status, 404)
	})
	it('never serves outside its root', async () => {
		assert.equal((await fetch(`${base}/%2e%2e/secret.txt`)).status, 404)
	})
	it('answers 400 for a malformed path', async () => {
		assert.equal((await fetch(`${base}/%E0%A4%A`)).status, 400)
	})
	it('answers 405 for a POST', async () => {
		assert.equal((await fetch(`${base}/bus-times.json`, {method: 'POST'})).status, 405)
	})
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test scripts/data-editor-pipeline.test.mjs scripts/data-editor-serve.test.mjs`
Expected: FAIL. `build` is not exported, and the serve module does not exist.

- [ ] **Step 3: Implement `build`**

Append to `scripts/data-editor-pipeline.ts` (merging imports: `spawn` from `node:child_process`, `existsSync` from `node:fs`, `rename` and `rm` from `node:fs/promises`):

```ts
/** What a failed `bundle-data` said last: its error's message, or its last line. */
export function lastError(stderr: string): string {
	let thrown = /^(?:\w*Error|YAMLException): (.*)$/mu.exec(stderr)
	if (thrown?.[1]) return thrown[1]
	return stderr.trim().split('\n').at(-1) ?? 'bundle-data failed'
}

function run(command: string, args: string[]): Promise<{code: number; stderr: string}> {
	return new Promise((resolve, reject) => {
		let child = spawn(command, args, {stdio: ['ignore', 'ignore', 'pipe']})
		let stderr = ''
		child.stderr.setEncoding('utf8')
		child.stderr.on('data', (chunk: string) => {
			stderr += chunk
		})
		child.once('error', reject)
		child.once('close', (code) => {
			resolve({code: code ?? 1, stderr})
		})
	})
}

/**
 * Runs `bundle-data` into a fresh folder and swaps it in for `outDir`, so the
 * data server only ever serves a whole build. A failure leaves `outDir` alone.
 */
export async function build({
	bundleData,
	dataDir,
	outDir,
}: {
	bundleData: string
	dataDir: string
	outDir: string
}): Promise<{ok: true} | {ok: false; problems: Problem[]}> {
	let next = `${outDir}.next`
	let old = `${outDir}.old`
	await rm(next, {recursive: true, force: true})
	let {code, stderr} = await run(process.execPath, [bundleData, dataDir, next])
	if (code !== 0) {
		await rm(next, {recursive: true, force: true})
		return {ok: false, problems: problemsFrom(new Error(lastError(stderr)), dataDir)}
	}
	await rm(old, {recursive: true, force: true})
	if (existsSync(outDir)) await rename(outDir, old)
	await rename(next, outDir)
	await rm(old, {recursive: true, force: true})
	return {ok: true}
}
```

- [ ] **Step 4: Implement `serve`**

`scripts/data-editor-serve.mjs`:

```js
import {createReadStream} from 'node:fs'
import {stat} from 'node:fs/promises'
import {createServer} from 'node:http'
import path from 'node:path'

/** The types of what `bundle-data` writes. */
const TYPES = {
	'.json': 'application/json',
	'.webp': 'image/webp',
	'.css': 'text/css',
	'.geojson': 'application/geo+json',
}

/**
 * Serves the files under `root` to the phone and to the local Worker. `root`
 * is read on every request, so a build swapped in is served at once.
 */
export function serve({root, port, host = '::'}) {
	let base = path.resolve(root)
	let server = createServer(async (request, response) => {
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			response.writeHead(405, {Allow: 'GET, HEAD'}).end()
			return
		}
		let pathname
		try {
			pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
		} catch {
			response.writeHead(400).end()
			return
		}
		let file = path.join(base, pathname)
		let info = file.startsWith(base + path.sep) ? await stat(file).catch(() => undefined) : undefined
		if (!info?.isFile()) {
			response.writeHead(404, {'Cache-Control': 'no-store'}).end()
			return
		}
		response.writeHead(200, {
			'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
			'Content-Length': info.size,
			'Cache-Control': 'no-store',
		})
		if (request.method === 'HEAD') {
			response.end()
			return
		}
		createReadStream(file).pipe(response)
	})
	return new Promise((resolve, reject) => {
		server.once('error', reject)
		server.listen(port, host, () => {
			server.off('error', reject)
			resolve(server)
		})
	})
}
```

- [ ] **Step 5: Run the tests**

Run: `node --test scripts/data-editor-pipeline.test.mjs scripts/data-editor-serve.test.mjs && mise run tsc`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/data-editor-pipeline.ts scripts/data-editor-pipeline.test.mjs scripts/data-editor-serve.mjs scripts/data-editor-serve.test.mjs
git commit -m "Swap each data build in whole and serve it to the local Worker"
```

### Task 7: The helper's stdio protocol, bundled

**Files:**
- Create: `scripts/data-editor-helper.mjs`, `scripts/build-data-editor-helper.mjs`, `macos/DataEditor/.gitignore`
- Modify: `mise.toml` (a new `[tasks."data-editor:helper"]`)
- Test: `scripts/data-editor-helper.test.mjs`, `scripts/build-data-editor-helper.test.mjs`

**Interfaces:**
- Consumes: `DocumentStore` (Task 4); `validate`, `listBuildings`, `readCalendar`, `build` (Tasks 5–6); `serve` (Task 6)
- Produces: `createHandlers({dataDir, outDir, bundleData})`, `handle(handlers, line): Promise<Reply>`, and the protocol table above. Built output goes to `macos/DataEditor/build/helper/`: `data-editor-helper.mjs`, `bundle-data.mjs`, `helper-stamp.json` (`{"scriptsTree": "<sha>", "modulesTree": "<sha>"}`).

- [ ] **Step 1: Write the failing tests**

`scripts/data-editor-helper.test.mjs`:

```js
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import path from 'node:path'
import {createInterface} from 'node:readline'
import {describe, it} from 'node:test'
import {createHandlers, handle} from './data-editor-helper.mjs'
import {scratchData} from './data-editor-test-support.mjs'

const BUNDLE_DATA = path.join(import.meta.dirname, 'bundle-data.mjs')

async function handlers() {
	let {root, dataDir} = await scratchData()
	return createHandlers({dataDir, outDir: path.join(root, 'out'), bundleData: BUNDLE_DATA})
}

describe('handle', () => {
	it('answers a method with its result', async () => {
		let reply = await handle(await handlers(), JSON.stringify({id: 1, method: 'load', params: {file: 'building-hours/1-1-cage.yaml'}}))
		assert.equal(reply.id, 1)
		assert.equal(reply.result.value.name, 'The Cage')
		assert.deepEqual(reply.result.problems, [])
	})
	it('returns problems with an edit', async () => {
		let reply = await handle(
			await handlers(),
			JSON.stringify({
				id: 2,
				method: 'edit',
				params: {file: 'building-hours/1-1-cage.yaml', ops: [{path: ['schedule', 0, 'hours', 0, 'from'], value: 'noon'}]},
			}),
		)
		assert.ok(reply.result.problems.length > 0)
	})
	it('answers an unknown method with an error', async () => {
		let reply = await handle(await handlers(), '{"id":3,"method":"rm"}')
		assert.deepEqual(reply, {id: 3, error: {message: 'no method rm'}})
	})
	it('does not treat inherited names as methods', async () => {
		let reply = await handle(await handlers(), '{"id":4,"method":"toString"}')
		assert.deepEqual(reply.error, {message: 'no method toString'})
	})
	it('answers a line that is not JSON', async () => {
		assert.deepEqual(await handle(await handlers(), 'nope'), {id: null, error: {message: 'not JSON'}})
	})
	it('turns a thrown error into an error reply', async () => {
		let reply = await handle(await handlers(), '{"id":5,"method":"load","params":{"file":"../x.yaml"}}')
		assert.match(reply.error.message, /outside the workspace/u)
	})
})

describe('the helper process', () => {
	it('answers requests in order over stdio', async () => {
		let {root, dataDir} = await scratchData()
		let child = spawn(process.execPath, [
			path.join(import.meta.dirname, 'data-editor-helper.mjs'),
			'--data',
			dataDir,
			'--out',
			path.join(root, 'out'),
		])
		let lines = createInterface({input: child.stdout})[Symbol.asyncIterator]()
		child.stdin.write('{"id":1,"method":"list"}\n{"id":2,"method":"calendar"}\n')
		let first = JSON.parse((await lines.next()).value)
		let second = JSON.parse((await lines.next()).value)
		child.stdin.end()
		assert.equal(first.id, 1)
		assert.ok(first.result.length > 10)
		assert.equal(second.id, 2)
		assert.ok(Array.isArray(second.result.breaks))
	})
})
```

`scripts/build-data-editor-helper.test.mjs`:

```js
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {cp, mkdtemp, readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {createInterface} from 'node:readline'
import {describe, it} from 'node:test'
import {buildHelper} from './build-data-editor-helper.mjs'
import {DATA_BASE, REPO_ROOT} from './paths.mjs'

describe('the bundled helper', () => {
	it('builds the data from a workspace that has no repo around it', async () => {
		let ws = await mkdtemp(path.join(tmpdir(), 'data-editor-ws-'))
		await buildHelper({outDir: path.join(ws, 'scripts')})
		await cp(DATA_BASE, path.join(ws, 'data'), {recursive: true})
		await cp(path.join(REPO_ROOT, 'images'), path.join(ws, 'images'), {recursive: true})
		let child = spawn(process.execPath, [
			path.join(ws, 'scripts/data-editor-helper.mjs'),
			'--data',
			path.join(ws, 'data'),
			'--out',
			path.join(ws, 'out'),
		])
		let lines = createInterface({input: child.stdout})[Symbol.asyncIterator]()
		child.stdin.write('{"id":1,"method":"build"}\n')
		let reply = JSON.parse((await lines.next()).value)
		child.stdin.end()
		assert.deepEqual(reply, {id: 1, result: {ok: true}})
		let stamp = JSON.parse(await readFile(path.join(ws, 'scripts/helper-stamp.json'), 'utf8'))
		assert.match(stamp.scriptsTree, /^[0-9a-f]{40}$/u)
		assert.match(stamp.modulesTree, /^[0-9a-f]{40}$/u)
	})
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test scripts/data-editor-helper.test.mjs scripts/build-data-editor-helper.test.mjs`
Expected: FAIL, because the modules cannot be found.

- [ ] **Step 3: Implement the helper**

`scripts/data-editor-helper.mjs`:

```js
#!/usr/bin/env node
// The Mac data editor's pipeline helper: one JSON request per line on stdin,
// one reply per line on stdout, handled in order. See
// documentation/plans/2026-11-05-mac-data-editor.md for the protocol.

import path from 'node:path'
import {createInterface} from 'node:readline'
import {parseArgs} from 'node:util'
import {DocumentStore} from './data-editor-documents.mjs'
import {build, listBuildings, readCalendar, validate} from './data-editor-pipeline.ts'
import {serve} from './data-editor-serve.mjs'

/** The protocol's methods over one data directory and its build folder. */
export function createHandlers({dataDir, outDir, bundleData}) {
	let store = new DocumentStore(dataDir)
	let server
	return {
		list: () => listBuildings(dataDir),
		calendar: () => readCalendar(dataDir),
		load: async ({file}) => ({value: await store.load(file), problems: validate(dataDir, file)}),
		edit: async ({file, ops}) => ({value: await store.edit(file, ops), problems: validate(dataDir, file)}),
		build: () => build({bundleData, dataDir, outDir}),
		serve: async ({port}) => {
			server ??= await serve({root: outDir, port})
			return {port: server.address().port}
		},
		close: () => server?.close(),
	}
}

/** The reply to one request line. */
export async function handle(handlers, line) {
	let request
	try {
		request = JSON.parse(line)
	} catch {
		return {id: null, error: {message: 'not JSON'}}
	}
	let method = request?.method
	let handler = typeof method === 'string' && method !== 'close' && Object.hasOwn(handlers, method) ? handlers[method] : undefined
	if (!handler) return {id: request?.id ?? null, error: {message: `no method ${String(method)}`}}
	try {
		return {id: request.id, result: (await handler(request.params ?? {})) ?? null}
	} catch (error) {
		return {id: request.id, error: {message: error instanceof Error ? error.message : String(error)}}
	}
}

if (import.meta.main) {
	let {values} = parseArgs({
		options: {
			data: {type: 'string'},
			out: {type: 'string'},
			'bundle-data': {type: 'string', default: path.join(import.meta.dirname, 'bundle-data.mjs')},
		},
	})
	if (!values.data || !values.out) {
		console.error('usage: data-editor-helper.mjs --data <dir> --out <dir> [--bundle-data <file>]')
		process.exit(1)
	}
	let handlers = createHandlers({
		dataDir: path.resolve(values.data),
		outDir: path.resolve(values.out),
		bundleData: values['bundle-data'],
	})
	let queue = Promise.resolve()
	let lines = createInterface({input: process.stdin})
	lines.on('line', (line) => {
		queue = queue.then(async () => {
			process.stdout.write(`${JSON.stringify(await handle(handlers, line))}\n`)
		})
	})
	// the app closing stdin is the one way to stop
	lines.on('close', () => {
		void queue.then(() => {
			handlers.close()
			process.exit(0)
		})
	})
}
```

- [ ] **Step 4: Implement the bundler**

`scripts/build-data-editor-helper.mjs`:

```js
#!/usr/bin/env node
// Bundles the data editor's helper and bundle-data, each into one file with
// its dependencies, for the Mac app to run on its own Node. The app copies
// them into its workspace's `scripts/` folder, so the paths they work out
// from their own location (`../data`, `../images`) land in the workspace.

import {execFileSync} from 'node:child_process'
import {mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {build} from 'esbuild'
import {REPO_ROOT} from './paths.mjs'

/** The git tree of `dir` at HEAD, which the app compares with master's. */
const treeOf = (dir) => execFileSync('git', ['rev-parse', `HEAD:${dir}`], {cwd: REPO_ROOT, encoding: 'utf8'}).trim()

export async function buildHelper({outDir = path.join(REPO_ROOT, 'macos/DataEditor/build/helper')} = {}) {
	await mkdir(outDir, {recursive: true})
	await build({
		entryPoints: [
			path.join(REPO_ROOT, 'scripts/data-editor-helper.mjs'),
			path.join(REPO_ROOT, 'scripts/bundle-data.mjs'),
		],
		outdir: outDir,
		outExtension: {'.js': '.mjs'},
		bundle: true,
		platform: 'node',
		format: 'esm',
		target: 'node24',
		logLevel: 'warning',
		// the CommonJS dependencies (Ajv) require Node's builtins
		banner: {js: "import {createRequire as __createRequire} from 'node:module'; const require = __createRequire(import.meta.url);"},
	})
	await writeFile(
		path.join(outDir, 'helper-stamp.json'),
		`${JSON.stringify({scriptsTree: treeOf('scripts'), modulesTree: treeOf('modules')})}\n`,
	)
	return outDir
}

if (import.meta.main) {
	console.log(`data editor helper -> ${await buildHelper()}`)
}
```

`macos/DataEditor/.gitignore`:

```gitignore
/build/
```

In `mise.toml`, after `[tasks."bundle-data"]`:

```toml
[tasks."data-editor:helper"]
description = "Bundle the Mac data editor's pipeline helper"
wait_for = ["pnpm:install:*"]
run = "node scripts/build-data-editor-helper.mjs"
```

- [ ] **Step 5: Run the tests**

Run: `node --test scripts/data-editor-helper.test.mjs scripts/build-data-editor-helper.test.mjs`
Expected: PASS. If the bundled build fails with "Dynamic require of … is not supported", the banner is missing or wrong. If it fails on a path under `scripts/`, a module works out a path from `import.meta.url` in a way the bundle broke: fix that module so it uses `paths.mjs`.

- [ ] **Step 6: Run the whole node suite and commit**

Run: `mise run test:node lint format:check`
Expected: PASS.

```bash
git add scripts/data-editor-helper.mjs scripts/data-editor-helper.test.mjs scripts/build-data-editor-helper.mjs scripts/build-data-editor-helper.test.mjs macos/DataEditor/.gitignore mise.toml
git commit -m "Give the data editor a helper process that edits, checks, builds and serves"
```

---

## Part C: DataEditorKit (Swift package)

All Swift work needs a Mac with Xcode 27 selected (`sudo xcode-select -s /Applications/Xcode_27.0.app`). Run package tests with `swift test --package-path macos/DataEditor/DataEditorKit`.

### Task 8: JSON values, the helper client and the workspace

**Files:**
- Create: `macos/DataEditor/DataEditorKit/Package.swift`
- Create: `Sources/DataEditorKit/JSONValue.swift`, `HelperClient.swift`, `Workspace.swift`
- Create: `Tests/DataEditorKitTests/StubProtocol.swift`, `HelperClientTests.swift`, `WorkspaceTests.swift`, `Fixtures/fake-helper.sh`

(Paths under `Sources/` and `Tests/` are relative to `macos/DataEditor/DataEditorKit/`.)

**Interfaces:**
- Produces:
  - `enum JSONValue: Codable, Hashable, Sendable` with cases `string`, `number`, `bool`, `null`, `array`, `object`, subscripts `[String]` and `[Int]`, and accessors `string`, `array`, `bool`
  - `enum PathKey: Codable, Hashable, Sendable, ExpressibleByStringLiteral, ExpressibleByIntegerLiteral` with cases `key(String)` and `index(Int)`
  - `struct EditOp`, with `static func set(_ path: [PathKey], _ value: JSONValue)` and `static func delete(_ path: [PathKey])`
  - `struct Problem: Decodable, Hashable, Sendable { file: String?; message: String; path: [PathKey]? }`
  - `struct BuildingSummary`, `struct BreakCalendar`, `struct Loaded { value: JSONValue; problems: [Problem] }`
  - `struct BuildResult { ok: Bool; problems: [Problem] }`
  - `actor HelperClient` with `init(executable:arguments:)`, `start()`, `call(_:_:)`, `buildings()`, `calendar()`, `load(_:)`, `edit(_:_:)`, `build()`, `serve(port:)` and `stop()`
  - `struct HelperStamp: Codable, Sendable { scriptsTree, modulesTree }`
  - `struct Snapshot: Codable, Sendable { commit, scriptsTree, modulesTree }` with `isCompatible(with: HelperStamp) -> Bool`
  - `final class Workspace: Sendable` with `root`, `dataDirectory`, `outDirectory`, `snapshot`, `latestCommit()`, `download(commit:)`, `update(to:) -> [String]`, `conflicts`, `keepMine(_:)`, `keepLatest(_:)`, `changedFiles()`, `contents(of:)`, `baseContents(of:)` and `revert(_:)`

- [ ] **Step 1: Create the package**

`macos/DataEditor/DataEditorKit/Package.swift`:

```swift
// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "DataEditorKit",
    platforms: [.macOS("27.0")],
    products: [.library(name: "DataEditorKit", targets: ["DataEditorKit"])],
    targets: [
        .target(name: "DataEditorKit"),
        .testTarget(
            name: "DataEditorKitTests",
            dependencies: ["DataEditorKit"],
            resources: [.copy("Fixtures")]
        ),
    ]
)
```

- [ ] **Step 2: Write the failing tests**

`Tests/DataEditorKitTests/Fixtures/fake-helper.sh` (make it executable with `chmod +x`):

```sh
#!/bin/sh
# Stands in for the Node helper: echoes each request back as its result,
# fails the method "fail", and exits on the method "exit".
while IFS= read -r line; do
  id=$(printf '%s' "$line" | sed -E 's/^\{"id":([0-9]+).*/\1/')
  case "$line" in
    *'"method":"fail"'*) printf '{"id":%s,"error":{"message":"it failed"}}\n' "$id" ;;
    *'"method":"exit"'*) exit 0 ;;
    *) printf '{"id":%s,"result":{"echo":%s}}\n' "$id" "$line" ;;
  esac
done
```

`Tests/DataEditorKitTests/StubProtocol.swift`:

```swift
import Foundation

/// Answers a session's requests from a closure, and records them. Each session
/// gets its own stub, found by a header, so suites can run in parallel.
final class StubProtocol: URLProtocol, @unchecked Sendable {
    final class Stub: @unchecked Sendable {
        let respond: @Sendable (URLRequest) -> (Int, Data)
        private let lock = NSLock()
        private var recorded: [URLRequest] = []
        init(respond: @escaping @Sendable (URLRequest) -> (Int, Data)) { self.respond = respond }
        var requests: [URLRequest] { lock.withLock { recorded } }
        func record(_ request: URLRequest) { lock.withLock { recorded.append(request) } }
    }

    private static let lock = NSLock()
    nonisolated(unsafe) private static var stubs: [String: Stub] = [:]
    private static let header = "X-Stub-ID"

    static func session(_ respond: @escaping @Sendable (URLRequest) -> (Int, Data)) -> (URLSession, Stub) {
        let id = UUID().uuidString
        let stub = Stub(respond: respond)
        lock.withLock { stubs[id] = stub }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubProtocol.self]
        configuration.httpAdditionalHeaders = [header: id]
        return (URLSession(configuration: configuration), stub)
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func stopLoading() {}

    override func startLoading() {
        var request = self.request
        if request.httpBody == nil, let stream = request.httpBodyStream {
            request.httpBody = Data(reading: stream)
        }
        let id = request.value(forHTTPHeaderField: Self.header) ?? ""
        guard let stub = Self.lock.withLock({ Self.stubs[id] }) else {
            client?.urlProtocol(self, didFailWithError: URLError(.cannotConnectToHost))
            return
        }
        stub.record(request)
        let (status, body) = stub.respond(request)
        if status < 0 {
            client?.urlProtocol(self, didFailWithError: URLError(.notConnectedToInternet))
            return
        }
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: body)
        client?.urlProtocolDidFinishLoading(self)
    }
}

extension Data {
    init(reading stream: InputStream) {
        self.init()
        stream.open()
        defer { stream.close() }
        var buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let count = stream.read(&buffer, maxLength: buffer.count)
            if count <= 0 { break }
            append(buffer, count: count)
        }
    }
}

/// A JSON body for a stub's answer.
func body(_ json: String) -> Data { Data(json.utf8) }
```

`Tests/DataEditorKitTests/HelperClientTests.swift`:

```swift
import Foundation
import Testing
@testable import DataEditorKit

private func fakeHelper() async throws -> HelperClient {
    let script = Bundle.module.url(forResource: "fake-helper", withExtension: "sh", subdirectory: "Fixtures")!
    let client = try HelperClient(executable: URL(filePath: "/bin/sh"), arguments: [script.path])
    await client.start()
    return client
}

private struct Echo: Decodable, Sendable { let echo: JSONValue }

struct HelperClientTests {
    @Test func returnsTheResultForItsRequest() async throws {
        let client = try await fakeHelper()
        let reply: Echo = try await client.call("load", ["file": "building-hours/1-1-cage.yaml"])
        #expect(reply.echo["method"] == .string("load"))
        #expect(reply.echo["params"]?["file"] == .string("building-hours/1-1-cage.yaml"))
    }

    @Test func throwsTheHelpersError() async throws {
        let client = try await fakeHelper()
        await #expect(throws: HelperClient.Failure(message: "it failed")) {
            let _: Echo = try await client.call("fail", [String: String]())
        }
    }

    @Test func matchesConcurrentRepliesToTheirRequests() async throws {
        let client = try await fakeHelper()
        async let a: Echo = client.call("a", [String: String]())
        async let b: Echo = client.call("b", [String: String]())
        let (first, second) = try await (a, b)
        #expect(first.echo["method"] == .string("a"))
        #expect(second.echo["method"] == .string("b"))
    }

    @Test func failsWaitingRequestsWhenTheHelperStops() async throws {
        let client = try await fakeHelper()
        await #expect(throws: HelperClient.Failure(message: "The helper stopped")) {
            let _: Echo = try await client.call("exit", [String: String]())
        }
    }

    @Test func encodesEditOps() throws {
        let ops: [EditOp] = [.set(["schedule", 0, "to"], .string("9:00pm")), .delete(["links", 1])]
        let json = String(decoding: try JSONEncoder.sorted.encode(ops), as: UTF8.self)
        #expect(json == #"[{"path":["schedule",0,"to"],"value":"9:00pm"},{"delete":true,"path":["links",1]}]"#)
    }
}
```

`Tests/DataEditorKitTests/WorkspaceTests.swift`:

```swift
import Foundation
import Testing
@testable import DataEditorKit

/// A repo at `commit` with one data file, the image groups and one image.
private func stubRepo(commit: String = "c1", failing failPath: String? = nil, cageHours: String = "name: The Cage\n") -> (URLSession, StubProtocol.Stub) {
    StubProtocol.session { request in
        let url = request.url!.absoluteString
        if let failPath, url.hasSuffix(failPath) { return (-1, Data()) }
        switch url {
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/commits/master":
            return (200, body(commit))
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/git/trees/\(commit)":
            return (200, body(#"{"tree":[{"path":"data","type":"tree","sha":"tdata"},{"path":"images","type":"tree","sha":"timages"},{"path":"scripts","type":"tree","sha":"tscripts"},{"path":"modules","type":"tree","sha":"tmodules"}]}"#))
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/git/trees/tdata?recursive=1":
            return (200, body(#"{"truncated":false,"tree":[{"path":"building-hours","type":"tree","sha":"x"},{"path":"building-hours/1-1-cage.yaml","type":"blob","sha":"a"}]}"#))
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/git/trees/timages?recursive=1":
            return (200, body(#"{"truncated":false,"tree":[{"path":"groups.json","type":"blob","sha":"g"},{"path":"spaces/cage.webp","type":"blob","sha":"w"},{"path":"spaces/source/cage.jpg","type":"blob","sha":"j"}]}"#))
        case "https://raw.githubusercontent.com/StoDevX/AAO-React-Native/\(commit)/data/building-hours/1-1-cage.yaml":
            return (200, body(cageHours))
        case "https://raw.githubusercontent.com/StoDevX/AAO-React-Native/\(commit)/images/groups.json":
            return (200, body(#"["spaces"]"#))
        case "https://raw.githubusercontent.com/StoDevX/AAO-React-Native/\(commit)/images/spaces/cage.webp":
            return (200, body("RIFF"))
        default:
            return (404, Data())
        }
    }
}

private func temporaryRoot() -> URL {
    FileManager.default.temporaryDirectory.appending(path: "workspace-\(UUID().uuidString)")
}

struct WorkspaceTests {
    @Test func downloadsTheDataAndThePublishedImages() async throws {
        let (session, stub) = stubRepo()
        let workspace = Workspace(root: temporaryRoot(), session: session)
        let snapshot = try await workspace.download(commit: try await workspace.latestCommit())
        #expect(snapshot == Snapshot(commit: "c1", scriptsTree: "tscripts", modulesTree: "tmodules"))
        #expect(workspace.snapshot == snapshot)
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(FileManager.default.fileExists(atPath: workspace.root.appending(path: "images/spaces/cage.webp").path))
        // the source photos are not published, so not fetched
        #expect(!stub.requests.contains { $0.url!.path.hasSuffix("cage.jpg") })
    }

    @Test func listsAndRevertsChangedFiles() async throws {
        let (session, _) = stubRepo()
        let workspace = Workspace(root: temporaryRoot(), session: session)
        _ = try await workspace.download(commit: "c1")
        #expect(try workspace.changedFiles() == [])
        try body("name: The Cage Grill\n").write(to: workspace.dataDirectory.appending(path: "building-hours/1-1-cage.yaml"))
        #expect(try workspace.changedFiles() == ["building-hours/1-1-cage.yaml"])
        try workspace.revert("building-hours/1-1-cage.yaml")
        #expect(try workspace.changedFiles() == [])
    }

    @Test func leavesTheWorkspaceAloneWhenADownloadFailsPartway() async throws {
        let root = temporaryRoot()
        let (good, _) = stubRepo()
        _ = try await Workspace(root: root, session: good).download(commit: "c1")
        let (failing, _) = stubRepo(failing: "cage.webp", cageHours: "name: Changed\n")
        let workspace = Workspace(root: root, session: failing)
        await #expect(throws: URLError.self) { _ = try await workspace.download(commit: "c1") }
        #expect(workspace.snapshot?.commit == "c1")
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(try workspace.changedFiles() == [])
    }

    @Test func keepsEditsWhenUpdatingPastCommitsThatDidNotTouchThem() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == [])
        #expect(workspace.snapshot?.commit == "c2")
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage Grill\n"))
    }

    @Test func setsAsideAnEditThatMasterAlsoChanged() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: The Cage at Buntrock\n")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == ["building-hours/1-1-cage.yaml"])
        #expect(workspace.conflicts == ["building-hours/1-1-cage.yaml"])
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage at Buntrock\n"))
        try workspace.keepMine("building-hours/1-1-cage.yaml")
        #expect(workspace.conflicts == [])
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage Grill\n"))
    }

    @Test func treatsAMergedEditAsNoConflict() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: The Cage Grill\n")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == [])
        #expect(try workspace.changedFiles() == [])
    }

    @Test func comparesTreesWithTheBundledHelper() {
        let snapshot = Snapshot(commit: "c1", scriptsTree: "s", modulesTree: "m")
        #expect(snapshot.isCompatible(with: HelperStamp(scriptsTree: "s", modulesTree: "m")))
        #expect(!snapshot.isCompatible(with: HelperStamp(scriptsTree: "s2", modulesTree: "m")))
    }
}
```

- [ ] **Step 3: Run them to verify they fail**

Run: `swift test --package-path macos/DataEditor/DataEditorKit`
Expected: FAIL to compile, because `HelperClient`, `Workspace` and the other types are not defined.

- [ ] **Step 4: Implement `JSONValue.swift`**

```swift
import Foundation

/// Any JSON value, as the helper sends a data file.
public enum JSONValue: Codable, Hashable, Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case null
    case array([JSONValue])
    case object([String: JSONValue])

    public init(from decoder: any Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([JSONValue].self) { self = .array(value) }
        else { self = .object(try container.decode([String: JSONValue].self)) }
    }

    public func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .null: try container.encodeNil()
        case .array(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        }
    }

    public subscript(key: String) -> JSONValue? {
        if case .object(let object) = self { object[key] } else { nil }
    }

    public subscript(index: Int) -> JSONValue? {
        if case .array(let array) = self, array.indices.contains(index) { array[index] } else { nil }
    }

    public var string: String? { if case .string(let value) = self { value } else { nil } }
    public var array: [JSONValue]? { if case .array(let value) = self { value } else { nil } }
    public var bool: Bool? { if case .bool(let value) = self { value } else { nil } }
}

/// One step of a path into a data file: a key or an index.
public enum PathKey: Codable, Hashable, Sendable, ExpressibleByStringLiteral, ExpressibleByIntegerLiteral {
    case key(String)
    case index(Int)

    public init(stringLiteral value: String) { self = .key(value) }
    public init(integerLiteral value: Int) { self = .index(value) }

    public init(from decoder: any Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let index = try? container.decode(Int.self) { self = .index(index) }
        else { self = .key(try container.decode(String.self)) }
    }

    public func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .key(let key): try container.encode(key)
        case .index(let index): try container.encode(index)
        }
    }
}

extension PathKey: CustomStringConvertible {
    /// How a problem's path reads in the editor: `schedule › #1 › hours`.
    public var description: String {
        switch self {
        case .key(let key): key
        case .index(let index): "#\(index + 1)"
        }
    }
}

/// An edit the helper applies to a data file: set a value at a path, or delete it.
public struct EditOp: Encodable, Hashable, Sendable {
    public let path: [PathKey]
    public let value: JSONValue?
    public let delete: Bool

    public static func set(_ path: [PathKey], _ value: JSONValue) -> EditOp { EditOp(path: path, value: value, delete: false) }
    public static func delete(_ path: [PathKey]) -> EditOp { EditOp(path: path, value: nil, delete: true) }

    private enum CodingKeys: String, CodingKey { case path, value, delete }

    public func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(path, forKey: .path)
        if delete { try container.encode(true, forKey: .delete) } else { try container.encode(value ?? .null, forKey: .value) }
    }
}

/// Something wrong with the data, at a path inside `file` when the helper could place it.
public struct Problem: Decodable, Hashable, Sendable {
    public let file: String?
    public let message: String
    public let path: [PathKey]?

    public init(file: String?, message: String, path: [PathKey]?) {
        self.file = file
        self.message = message
        self.path = path
    }
}

extension JSONEncoder {
    /// Keys in order, so a line always starts with its `id`.
    static var sorted: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        return encoder
    }
}
```

- [ ] **Step 5: Implement `HelperClient.swift`**

```swift
import Foundation

/// The pipeline helper, a child process spoken to in JSON lines.
public actor HelperClient {
    public struct Failure: Error, Equatable, Sendable {
        public let message: String
    }

    private struct Request<P: Encodable>: Encodable {
        let id: Int
        let method: String
        let params: P
    }

    private struct Reply: Decodable {
        struct Message: Decodable { let message: String }
        let id: Int?
        let result: JSONValue?
        let error: Message?
    }

    private let process = Process()
    private let input: FileHandle
    private let output: FileHandle
    private var nextID = 1
    private var pending: [Int: CheckedContinuation<JSONValue, any Error>] = [:]
    private var stopped = false

    public init(executable: URL, arguments: [String], environment: [String: String]? = nil) throws {
        let stdin = Pipe()
        let stdout = Pipe()
        process.executableURL = executable
        process.arguments = arguments
        if let environment { process.environment = environment }
        process.standardInput = stdin
        process.standardOutput = stdout
        process.standardError = FileHandle.standardError
        try process.run()
        input = stdin.fileHandleForWriting
        output = stdout.fileHandleForReading
    }

    /// Starts reading replies. Call once, before the first `call`.
    public func start() {
        Task { await listen() }
    }

    private func listen() async {
        do {
            for try await line in output.bytes.lines {
                receive(Data(line.utf8))
            }
        } catch {}
        stopped = true
        for continuation in pending.values { continuation.resume(throwing: Failure(message: "The helper stopped")) }
        pending.removeAll()
    }

    private func receive(_ line: Data) {
        guard let reply = try? JSONDecoder().decode(Reply.self, from: line),
              let id = reply.id, let continuation = pending.removeValue(forKey: id) else { return }
        if let error = reply.error {
            continuation.resume(throwing: Failure(message: error.message))
        } else {
            continuation.resume(returning: reply.result ?? .null)
        }
    }

    /// Sends `method` and decodes its result as `R`.
    public func call<R: Decodable & Sendable>(_ method: String, _ params: some Encodable & Sendable) async throws -> R {
        if stopped { throw Failure(message: "The helper stopped") }
        let id = nextID
        nextID += 1
        let line = try JSONEncoder.sorted.encode(Request(id: id, method: method, params: params)) + Data("\n".utf8)
        let result = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<JSONValue, any Error>) in
            pending[id] = continuation
            do {
                try input.write(contentsOf: line)
            } catch {
                pending[id] = nil
                continuation.resume(throwing: error)
            }
        }
        return try JSONDecoder().decode(R.self, from: try JSONEncoder().encode(result))
    }

    /// Closes the helper's input, which is how it is told to stop.
    public func stop() {
        try? input.close()
    }
}

/// An hours file as the sidebar lists it.
public struct BuildingSummary: Decodable, Hashable, Sendable, Identifiable {
    public let file: String
    public let name: String
    public let category: String
    public var id: String { file }
}

/// The breaks a building may give its own hours for, and the templates it may name.
public struct BreakCalendar: Decodable, Hashable, Sendable {
    public struct Break: Decodable, Hashable, Sendable, Identifiable {
        public let key: String
        public let name: String
        public let start: String
        public let end: String
        public let templates: [String]
        public var id: String { key }
    }
    public let breaks: [Break]
    public let templates: [String]
}

/// A data file's value and what is wrong with it.
public struct Loaded: Decodable, Hashable, Sendable {
    public let value: JSONValue
    public let problems: [Problem]
}

/// Whether a build went in, and if not, why not.
public struct BuildResult: Decodable, Hashable, Sendable {
    public let ok: Bool
    public let problems: [Problem]

    private enum CodingKeys: String, CodingKey { case ok, problems }
    public init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        ok = try container.decode(Bool.self, forKey: .ok)
        problems = try container.decodeIfPresent([Problem].self, forKey: .problems) ?? []
    }
}

private struct Served: Decodable, Sendable { let port: Int }
private struct NoParams: Encodable, Sendable {}
private struct FileParams: Encodable, Sendable { let file: String }
private struct EditParams: Encodable, Sendable { let file: String; let ops: [EditOp] }
private struct PortParams: Encodable, Sendable { let port: Int }

extension HelperClient {
    public func buildings() async throws -> [BuildingSummary] { try await call("list", NoParams()) }
    public func calendar() async throws -> BreakCalendar { try await call("calendar", NoParams()) }
    public func load(_ file: String) async throws -> Loaded { try await call("load", FileParams(file: file)) }
    public func edit(_ file: String, _ ops: [EditOp]) async throws -> Loaded { try await call("edit", EditParams(file: file, ops: ops)) }
    public func build() async throws -> BuildResult { try await call("build", NoParams()) }
    /// Serves the build on every address at `port`, and returns the port it got.
    public func serve(port: Int) async throws -> Int { (try await call("serve", PortParams(port: port)) as Served).port }
}
```

- [ ] **Step 6: Implement `Workspace.swift`**

```swift
import Foundation

/// The repository the data comes from.
public struct GitHubRepo: Sendable, Hashable {
    public let owner: String
    public let name: String
    public let branch: String
    public static let aao = GitHubRepo(owner: "StoDevX", name: "AAO-React-Native", branch: "master")
    public var fullName: String { "\(owner)/\(name)" }
}

/// The trees of `scripts/` and `modules/` the bundled helper was built from.
public struct HelperStamp: Codable, Hashable, Sendable {
    public let scriptsTree: String
    public let modulesTree: String
    public init(scriptsTree: String, modulesTree: String) {
        self.scriptsTree = scriptsTree
        self.modulesTree = modulesTree
    }
}

/// The commit a workspace was downloaded at.
public struct Snapshot: Codable, Hashable, Sendable {
    public let commit: String
    public let scriptsTree: String
    public let modulesTree: String

    /// Whether the bundled helper was built from the scripts this data expects.
    public func isCompatible(with stamp: HelperStamp) -> Bool {
        scriptsTree == stamp.scriptsTree && modulesTree == stamp.modulesTree
    }
}

/// The data being edited: `data/` and the published `images/` at a commit, a
/// pristine copy of both under `base/`, and the build under `out/`.
public final class Workspace: Sendable {
    public let root: URL
    private let session: URLSession
    private let repo: GitHubRepo

    public init(root: URL, session: URLSession = .shared, repo: GitHubRepo = .aao) {
        self.root = root
        self.session = session
        self.repo = repo
    }

    public var dataDirectory: URL { root.appending(path: "data") }
    public var outDirectory: URL { root.appending(path: "out") }
    private var baseDataDirectory: URL { root.appending(path: "base/data") }
    private var snapshotFile: URL { root.appending(path: "snapshot.json") }

    public var snapshot: Snapshot? {
        guard let data = try? Data(contentsOf: snapshotFile) else { return nil }
        return try? JSONDecoder().decode(Snapshot.self, from: data)
    }

    private struct Tree: Decodable {
        struct Entry: Decodable { let path: String; let type: String; let sha: String }
        let tree: [Entry]
        let truncated: Bool?
    }

    private func get(_ url: URL, accept: String = "application/vnd.github+json") async throws -> Data {
        var request = URLRequest(url: url)
        request.setValue(accept, forHTTPHeaderField: "Accept")
        let (data, response) = try await session.data(for: request)
        guard let status = (response as? HTTPURLResponse)?.statusCode, (200..<300).contains(status) else {
            throw URLError(.badServerResponse, userInfo: [NSURLErrorFailingURLErrorKey: url])
        }
        return data
    }

    private var api: URL { URL(string: "https://api.github.com/repos/\(repo.fullName)")! }

    /// The newest commit on the repo's default branch.
    public func latestCommit() async throws -> String {
        let data = try await get(api.appending(path: "commits/\(repo.branch)"), accept: "application/vnd.github.sha")
        return String(decoding: data, as: UTF8.self).trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func tree(_ sha: String, recursive: Bool) async throws -> Tree {
        var url = api.appending(path: "git/trees/\(sha)")
        if recursive { url.append(queryItems: [URLQueryItem(name: "recursive", value: "1")]) }
        let tree = try JSONDecoder().decode(Tree.self, from: try await get(url))
        if tree.truncated == true { throw URLError(.dataLengthExceedsMaximum) }
        return tree
    }

    private func fetch(_ url: URL, to destination: URL) async throws {
        try FileManager.default.createDirectory(at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
        try await get(url, accept: "*/*").write(to: destination)
    }

    /// The files of `data/` and the images `bundle-data` publishes, at `commit`.
    private func files(at commit: String) async throws -> (paths: [String], snapshot: Snapshot) {
        let top = try await tree(commit, recursive: false)
        func sha(_ name: String) throws -> String {
            guard let entry = top.tree.first(where: { $0.path == name && $0.type == "tree" }) else { throw URLError(.fileDoesNotExist) }
            return entry.sha
        }
        let data = try await tree(try sha("data"), recursive: true).tree.filter { $0.type == "blob" }.map { "data/\($0.path)" }
        let images = try await tree(try sha("images"), recursive: true).tree
            .filter { $0.type == "blob" && ($0.path == "groups.json" || $0.path.split(separator: "/").count == 2 && $0.path.hasSuffix(".webp")) }
            .map { "images/\($0.path)" }
        return (data + images, Snapshot(commit: commit, scriptsTree: try sha("scripts"), modulesTree: try sha("modules")))
    }

    /// Downloads `commit` into a staging folder, then swaps it in whole. A
    /// failure partway leaves the workspace as it was. Local edits are dropped;
    /// the caller keeps any it means to replay.
    @discardableResult
    public func download(commit: String) async throws -> Snapshot {
        let (paths, snapshot) = try await files(at: commit)
        let fm = FileManager.default
        let staging = root.appending(path: "staging")
        try? fm.removeItem(at: staging)
        try fm.createDirectory(at: staging, withIntermediateDirectories: true)
        let raw = URL(string: "https://raw.githubusercontent.com/\(repo.fullName)/\(commit)/")!
        // eight at a time
        try await withThrowingTaskGroup(of: Void.self) { group in
            var remaining = paths[...]
            for _ in 0..<8 {
                guard let path = remaining.popFirst() else { break }
                group.addTask { try await self.fetch(raw.appending(path: path), to: staging.appending(path: path)) }
            }
            while try await group.next() != nil {
                guard let path = remaining.popFirst() else { continue }
                group.addTask { try await self.fetch(raw.appending(path: path), to: staging.appending(path: path)) }
            }
        }
        try fm.createDirectory(at: root, withIntermediateDirectories: true)
        for name in ["data", "images", "base"] { try? fm.removeItem(at: root.appending(path: name)) }
        try fm.createDirectory(at: root.appending(path: "base"), withIntermediateDirectories: true)
        try fm.copyItem(at: staging.appending(path: "data"), to: baseDataDirectory)
        try fm.moveItem(at: staging.appending(path: "data"), to: dataDirectory)
        try fm.moveItem(at: staging.appending(path: "images"), to: root.appending(path: "images"))
        try fm.removeItem(at: staging)
        try JSONEncoder().encode(snapshot).write(to: snapshotFile)
        return snapshot
    }

    private func relativeFiles(in directory: URL) -> Set<String> {
        guard let enumerator = FileManager.default.enumerator(at: directory, includingPropertiesForKeys: [.isRegularFileKey]) else { return [] }
        var files = Set<String>()
        let prefix = directory.standardizedFileURL.path + "/"
        for case let url as URL in enumerator where (try? url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true {
            files.insert(String(url.standardizedFileURL.path.dropFirst(prefix.count)))
        }
        return files
    }

    /// The data files that differ from the base commit: changed, added or removed.
    public func changedFiles() throws -> [String] {
        let current = relativeFiles(in: dataDirectory)
        let base = relativeFiles(in: baseDataDirectory)
        return current.union(base).filter { try! contents(of: $0) != baseContents(of: $0) }.sorted()
    }

    /// A data file's contents now, or nil if it was removed.
    public func contents(of file: String) throws -> Data? {
        try? Data(contentsOf: dataDirectory.appending(path: file))
    }

    /// A data file's contents at the base commit, or nil if it is new.
    public func baseContents(of file: String) throws -> Data? {
        try? Data(contentsOf: baseDataDirectory.appending(path: file))
    }

    private var conflictsDirectory: URL { root.appending(path: "conflicts") }

    /// Downloads `commit` and puts the contributor's edits back on top. An
    /// edit master already has (it was merged) is dropped. A file master also
    /// changed is a conflict: master's version stays in `data/`, the
    /// contributor's is kept aside until they choose with `keepMine` or
    /// `keepLatest`. Returns the conflicts.
    public func update(to commit: String) async throws -> [String] {
        let edits = try changedFiles().map { (file: $0, oldBase: try baseContents(of: $0), mine: try contents(of: $0)) }
        try await download(commit: commit)
        let fm = FileManager.default
        try? fm.removeItem(at: conflictsDirectory)
        var conflicts: [String] = []
        for edit in edits {
            let newBase = try baseContents(of: edit.file)
            if newBase == edit.mine { continue }
            if newBase == edit.oldBase {
                let target = dataDirectory.appending(path: edit.file)
                if let mine = edit.mine {
                    try fm.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
                    try mine.write(to: target)
                } else {
                    try? fm.removeItem(at: target)
                }
            } else {
                conflicts.append(edit.file)
                let kept = conflictsDirectory.appending(path: edit.file)
                try fm.createDirectory(at: kept.deletingLastPathComponent(), withIntermediateDirectories: true)
                try (edit.mine ?? Data()).write(to: kept)
            }
        }
        return conflicts
    }

    /// The files set aside by the last update, waiting for a choice.
    public var conflicts: [String] { relativeFiles(in: conflictsDirectory).sorted() }

    /// Resolves a conflict with the contributor's version.
    public func keepMine(_ file: String) throws {
        let kept = conflictsDirectory.appending(path: file)
        let target = dataDirectory.appending(path: file)
        try? FileManager.default.removeItem(at: target)
        try FileManager.default.moveItem(at: kept, to: target)
    }

    /// Resolves a conflict with master's version.
    public func keepLatest(_ file: String) throws {
        try FileManager.default.removeItem(at: conflictsDirectory.appending(path: file))
    }

    /// Puts a data file back as it was at the base commit.
    public func revert(_ file: String) throws {
        let target = dataDirectory.appending(path: file)
        try? FileManager.default.removeItem(at: target)
        if let base = try baseContents(of: file) { try base.write(to: target) }
    }
}
```

- [ ] **Step 7: Run the tests**

Run: `swift test --package-path macos/DataEditor/DataEditorKit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add macos/DataEditor/DataEditorKit
git commit -m "Add the data editor's helper client and workspace"
```

### Task 9: Run the bundled ccc

**Files:**
- Create: `Sources/DataEditorKit/CccRunner.swift`, `Sources/DataEditorKit/PagesOrigin.swift`
- Test: `Tests/DataEditorKitTests/CccRunnerTests.swift`, `Tests/DataEditorKitTests/Fixtures/ccc-port-in-use.sh`, `Tests/DataEditorKitTests/Fixtures/ccc-crash.sh`, `Tests/DataEditorKitTests/Fixtures/ccc-ok.sh`

**Interfaces:**
- Consumes: `wranglerArgs` env vars (Task 3)
- Produces:
  - `actor CccRunner`, with `enum Status: Equatable, Sendable` (cases `stopped`, `starting`, `running`, `portInUse`, `crashed(Int32)`), `init(configuration:restartLimit:ready:)`, `statuses() -> AsyncStream<Status>`, `log`, `start()` and `stop()`
  - `struct CccRunner.Configuration` with `executable`, `arguments`, `workingDirectory`, `environment` and `static func bundled(node:cccRoot:pagesOrigin:state:)`
  - `func pagesOrigin(localHostName: String, port: Int) -> String`
  - `let cccLocalBase = URL(string: "http://localhost:8787/edu.stolaf/v1/")!`

- [ ] **Step 1: Write the failing tests**

Fixtures (each made executable with `chmod +x`):

`ccc-port-in-use.sh`:

```sh
#!/bin/sh
echo 'port 8787 is in use: is another `mise run dev` or `wrangler dev` running?' >&2
exit 1
```

`ccc-crash.sh`:

```sh
#!/bin/sh
echo "starting"
exit 3
```

`ccc-ok.sh`:

```sh
#!/bin/sh
echo "PAGES_ORIGIN_OVERRIDE=$PAGES_ORIGIN_OVERRIDE"
exec sleep 30
```

`CccRunnerTests.swift`:

```swift
import Foundation
import Testing
@testable import DataEditorKit

private func fixture(_ name: String) -> CccRunner.Configuration {
    let script = Bundle.module.url(forResource: name, withExtension: "sh", subdirectory: "Fixtures")!
    return CccRunner.Configuration(
        executable: URL(filePath: "/bin/sh"),
        arguments: [script.path],
        workingDirectory: FileManager.default.temporaryDirectory,
        environment: ["PAGES_ORIGIN_OVERRIDE": "http://editor-mac.local:8790/"]
    )
}

private func waitFor(_ runner: CccRunner, _ wanted: CccRunner.Status) async -> Bool {
    for await status in await runner.statuses() where status == wanted { return true }
    return false
}

@Suite(.timeLimit(.minutes(1)))
struct CccRunnerTests {
    @Test func reportsAPortInUse() async {
        let runner = CccRunner(configuration: fixture("ccc-port-in-use"), restartLimit: 3, ready: { false })
        await runner.start()
        #expect(await waitFor(runner, .portInUse))
    }

    @Test func givesUpAfterRepeatedCrashes() async {
        let runner = CccRunner(configuration: fixture("ccc-crash"), restartLimit: 2, ready: { false })
        await runner.start()
        #expect(await waitFor(runner, .crashed(3)))
        #expect(await runner.log.filter { $0 == "starting" }.count == 3)
    }

    @Test func isRunningOnceTheWorkerAnswers() async {
        let runner = CccRunner(configuration: fixture("ccc-ok"), restartLimit: 3, ready: { true })
        await runner.start()
        #expect(await waitFor(runner, .running))
        #expect(await runner.log.contains("PAGES_ORIGIN_OVERRIDE=http://editor-mac.local:8790/"))
        await runner.stop()
        #expect(await waitFor(runner, .stopped))
    }

    @Test func bundledConfigurationRunsTheDevScript() {
        let configuration = CccRunner.Configuration.bundled(
            node: URL(filePath: "/App/Runtime/node"),
            cccRoot: URL(filePath: "/App/Runtime/ccc"),
            pagesOrigin: "http://editor-mac.local:8790/",
            state: URL(filePath: "/Support/ccc")
        )
        #expect(configuration.arguments == ["source/dev/index.ts"])
        #expect(configuration.environment["PAGES_ORIGIN_OVERRIDE"] == "http://editor-mac.local:8790/")
        #expect(configuration.environment["CCC_PERSIST_TO"] == "/Support/ccc/wrangler-state")
        // the dev script runs wrangler's `#!/usr/bin/env node`
        #expect(configuration.environment["PATH"]?.hasPrefix("/App/Runtime:") == true)
    }

    @Test func pagesOriginUsesTheBonjourName() {
        #expect(pagesOrigin(localHostName: "Hawkens-MacBook-Pro", port: 8790) == "http://Hawkens-MacBook-Pro.local:8790/")
    }
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `swift test --package-path macos/DataEditor/DataEditorKit --filter CccRunnerTests`
Expected: FAIL to compile.

- [ ] **Step 3: Implement**

`Sources/DataEditorKit/PagesOrigin.swift`:

```swift
import Foundation

/// Where the phone and the local Worker read the build from. The Bonjour name
/// (System Settings → General → Sharing → Local hostname) is DNS-safe, where the
/// computer's display name may have spaces and apostrophes.
public func pagesOrigin(localHostName: String, port: Int) -> String {
    "http://\(localHostName).local:\(port)/"
}

/// The local Worker's St. Olaf routes, as the mDNS advert names them.
public let cccLocalBase = URL(string: "http://localhost:8787/edu.stolaf/v1/")!
```

`Sources/DataEditorKit/CccRunner.swift`:

```swift
import Foundation

/// Runs ccc-server's dev script, restarts it if it crashes, and keeps the tail of its log.
public actor CccRunner {
    public enum Status: Equatable, Sendable {
        case stopped, starting, running, portInUse
        case crashed(Int32)
    }

    public struct Configuration: Sendable {
        public let executable: URL
        public let arguments: [String]
        public let workingDirectory: URL
        public let environment: [String: String]

        public init(executable: URL, arguments: [String], workingDirectory: URL, environment: [String: String]) {
            self.executable = executable
            self.arguments = arguments
            self.workingDirectory = workingDirectory
            self.environment = environment
        }

        /// The bundled ccc, serving St. Olaf's data from `pagesOrigin`, with its state under `state`.
        public static func bundled(node: URL, cccRoot: URL, pagesOrigin: String, state: URL) -> Configuration {
            Configuration(
                executable: node,
                arguments: ["source/dev/index.ts"],
                workingDirectory: cccRoot,
                environment: [
                    "PATH": "\(node.deletingLastPathComponent().path):/usr/bin:/bin",
                    "HOME": state.path,
                    "XDG_CONFIG_HOME": state.appending(path: "config").path,
                    "WRANGLER_SEND_METRICS": "false",
                    "PAGES_ORIGIN_OVERRIDE": pagesOrigin,
                    "CCC_PERSIST_TO": state.appending(path: "wrangler-state").path,
                ]
            )
        }
    }

    public private(set) var status: Status = .stopped { didSet { for continuation in watchers.values { continuation.yield(status) } } }
    public private(set) var log: [String] = []

    private let configuration: Configuration
    private let restartLimit: Int
    private let ready: @Sendable () async -> Bool
    private var process: Process?
    private var restarts = 0
    private var stopping = false
    private var watchers: [UUID: AsyncStream<Status>.Continuation] = [:]

    /// `ready` says whether the Worker answers yet; the default asks `GET /` on port 8787.
    public init(configuration: Configuration, restartLimit: Int = 3, ready: (@Sendable () async -> Bool)? = nil) {
        self.configuration = configuration
        self.restartLimit = restartLimit
        self.ready = ready ?? {
            var request = URLRequest(url: URL(string: "http://localhost:8787/")!)
            request.timeoutInterval = 5
            let status = (try? await URLSession.shared.data(for: request))?.1 as? HTTPURLResponse
            return status?.statusCode == 200
        }
    }

    /// Every status from now on, starting with the current one.
    public func statuses() -> AsyncStream<Status> {
        let id = UUID()
        let (stream, continuation) = AsyncStream<Status>.makeStream()
        continuation.yield(status)
        watchers[id] = continuation
        continuation.onTermination = { _ in Task { await self.unwatch(id) } }
        return stream
    }

    private func unwatch(_ id: UUID) { watchers[id] = nil }

    public func start() {
        stopping = false
        restarts = 0
        launch()
    }

    public func stop() {
        stopping = true
        process?.terminate()
    }

    private func launch() {
        status = .starting
        let process = Process()
        process.executableURL = configuration.executable
        process.arguments = configuration.arguments
        process.currentDirectoryURL = configuration.workingDirectory
        process.environment = configuration.environment
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        process.terminationHandler = { finished in
            Task { await self.exited(finished.terminationStatus) }
        }
        do {
            try process.run()
        } catch {
            append("could not start ccc: \(error.localizedDescription)")
            status = .crashed(-1)
            return
        }
        self.process = process
        Task {
            for try await line in pipe.fileHandleForReading.bytes.lines { self.append(line) }
        }
        Task { await waitUntilReady(process) }
    }

    private func waitUntilReady(_ launched: Process) async {
        for _ in 0..<120 {
            guard process === launched, status == .starting else { return }
            if await ready() {
                if process === launched, status == .starting { status = .running }
                return
            }
            try? await Task.sleep(for: .milliseconds(500))
        }
    }

    private func append(_ line: String) {
        log.append(line)
        if log.count > 500 { log.removeFirst(log.count - 500) }
    }

    private func exited(_ code: Int32) async {
        // the reader may still be draining the pipe
        try? await Task.sleep(for: .milliseconds(100))
        process = nil
        if stopping {
            status = .stopped
        } else if log.suffix(5).contains(where: { $0.contains("is in use") }) {
            status = .portInUse
        } else if restarts < restartLimit {
            restarts += 1
            launch()
        } else {
            status = .crashed(code)
        }
    }
}
```

- [ ] **Step 4: Run the tests**

Run: `swift test --package-path macos/DataEditor/DataEditorKit --filter CccRunnerTests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add macos/DataEditor/DataEditorKit
git commit -m "Run and supervise the bundled ccc-server"
```

### Task 10: Submit changes as a pull request

**Files:**
- Create: `Sources/DataEditorKit/ChangeSubmitter.swift`, `Sources/DataEditorKit/GitHubSubmitter.swift`, `Sources/DataEditorKit/DeviceFlow.swift`, `Sources/DataEditorKit/TokenStore.swift`
- Test: `Tests/DataEditorKitTests/GitHubSubmitterTests.swift`, `Tests/DataEditorKitTests/DeviceFlowTests.swift`

**Interfaces:**
- Produces:
  - `struct Change { path: String; contents: Data? }`, where `path` is repo-relative, such as `data/building-hours/x.yaml`
  - `struct Submission: Codable, Hashable, Sendable { number: Int; url: URL; owner: String; branch: String }`
  - `enum SubmissionState { case open, changesRequested, merged, closed }`
  - `protocol ChangeSubmitter: Sendable` with `submit(changes:base:summary:appVersion:)`, `update(_:changes:summary:)` and `state(of:)`
  - `enum SubmitError: Error, Equatable { case signInRequired, missingBaseCommit, github(Int, String) }`
  - `protocol TokenStore: Sendable { func read() -> String?; func write(_ token: String?) }`, with `KeychainTokenStore` and `MemoryTokenStore`
  - `struct GitHubSubmitter: ChangeSubmitter`, with `init(tokens:session:repo:sleep:)`
  - `struct DeviceFlow`, with `init(clientID:session:sleep:)`, `start() -> DeviceCode` and `token(for:) -> String`

- [ ] **Step 1: Write the failing tests**

`Tests/DataEditorKitTests/GitHubSubmitterTests.swift`:

```swift
import Foundation
import Testing
@testable import DataEditorKit

private let api = "https://api.github.com"

/// GitHub as far as a submission sees it, for user `ole` whose fork already exists.
private func github(status401 paths: Set<String> = []) -> (URLSession, StubProtocol.Stub) {
    StubProtocol.session { request in
        let method = request.httpMethod ?? "GET"
        let path = request.url!.path
        if paths.contains(path) { return (401, body(#"{"message":"Bad credentials"}"#)) }
        switch (method, path) {
        case ("GET", "/user"): return (200, body(#"{"login":"ole"}"#))
        case ("POST", "/repos/StoDevX/AAO-React-Native/forks"): return (202, body(#"{"full_name":"ole/AAO-React-Native","owner":{"login":"ole"}}"#))
        case ("GET", "/repos/ole/AAO-React-Native"): return (200, body("{}"))
        case ("POST", "/repos/ole/AAO-React-Native/merge-upstream"): return (200, body("{}"))
        case ("POST", "/repos/ole/AAO-React-Native/git/blobs"): return (201, body(#"{"sha":"blob1"}"#))
        case ("GET", "/repos/ole/AAO-React-Native/git/commits/base1"): return (200, body(#"{"tree":{"sha":"tree0"}}"#))
        case ("GET", "/repos/ole/AAO-React-Native/git/commits/head1"): return (200, body(#"{"tree":{"sha":"tree1"}}"#))
        case ("GET", "/repos/ole/AAO-React-Native/git/ref/heads/data-editor/x"): return (200, body(#"{"object":{"sha":"head1"}}"#))
        case ("POST", "/repos/ole/AAO-React-Native/git/trees"): return (201, body(#"{"sha":"tree2"}"#))
        case ("POST", "/repos/ole/AAO-React-Native/git/commits"): return (201, body(#"{"sha":"commit2"}"#))
        case ("POST", "/repos/ole/AAO-React-Native/git/refs"): return (201, body("{}"))
        case ("PATCH", "/repos/ole/AAO-React-Native/git/refs/heads/data-editor/x"): return (200, body("{}"))
        case ("POST", "/repos/StoDevX/AAO-React-Native/pulls"): return (201, body(#"{"number":42,"html_url":"https://github.com/StoDevX/AAO-React-Native/pull/42"}"#))
        case ("GET", "/repos/StoDevX/AAO-React-Native/pulls/42"): return (200, body(#"{"state":"open","merged_at":null}"#))
        case ("GET", "/repos/StoDevX/AAO-React-Native/pulls/42/reviews"): return (200, body(#"[{"user":{"login":"drew"},"state":"COMMENTED"},{"user":{"login":"drew"},"state":"CHANGES_REQUESTED"}]"#))
        default: return (404, body(#"{"message":"Not Found"}"#))
        }
    }
}

private func json(_ request: URLRequest) -> JSONValue {
    try! JSONDecoder().decode(JSONValue.self, from: request.httpBody ?? Data())
}

private func submitter(_ session: URLSession, token: String? = "tok") -> (GitHubSubmitter, MemoryTokenStore) {
    let tokens = MemoryTokenStore(token)
    return (GitHubSubmitter(tokens: tokens, session: session, sleep: { _ in }), tokens)
}

private let change = Change(path: "data/building-hours/1-1-cage.yaml", contents: Data("name: The Cage\n".utf8))

struct GitHubSubmitterTests {
    @Test func opensAPullRequestFromAForkBranch() async throws {
        let (session, stub) = github()
        let (submitter, _) = submitter(session)
        let submission = try await submitter.submit(changes: [change], base: "base1", summary: "Close The Cage early on Fridays", appVersion: "1.0")
        #expect(submission.number == 42)
        #expect(submission.owner == "ole")
        #expect(submission.branch.hasPrefix("data-editor/close-the-cage-early-on-fridays-"))

        let requests = stub.requests
        let tree = json(requests.first { $0.url!.path.hasSuffix("/git/trees") }!)
        #expect(tree["base_tree"] == .string("tree0"))
        #expect(tree["tree"]?[0]?["path"] == .string("data/building-hours/1-1-cage.yaml"))
        #expect(tree["tree"]?[0]?["sha"] == .string("blob1"))
        let commit = json(requests.first { $0.url!.path.hasSuffix("/git/commits") && $0.httpMethod == "POST" }!)
        #expect(commit["parents"] == .array([.string("base1")]))
        let pull = json(requests.first { $0.url!.path.hasSuffix("/pulls") }!)
        #expect(pull["head"] == .string("ole:\(submission.branch)"))
        #expect(pull["base"] == .string("master"))
        #expect(pull["title"] == .string("Close The Cage early on Fridays"))
        #expect(requests.allSatisfy { $0.value(forHTTPHeaderField: "Authorization") == "Bearer tok" })
    }

    @Test func addsACommitToAnOpenPullRequest() async throws {
        let (session, stub) = github()
        let (submitter, _) = submitter(session)
        let open = Submission(number: 42, url: URL(string: "https://github.com/StoDevX/AAO-React-Native/pull/42")!, owner: "ole", branch: "data-editor/x")
        try await submitter.update(open, changes: [change], summary: "Fix the Friday close")
        let requests = stub.requests
        #expect(!requests.contains { $0.url!.path.hasSuffix("/pulls") && $0.httpMethod == "POST" })
        let commit = json(requests.first { $0.url!.path.hasSuffix("/git/commits") && $0.httpMethod == "POST" }!)
        #expect(commit["parents"] == .array([.string("head1")]))
        let patch = requests.first { $0.httpMethod == "PATCH" }!
        #expect(json(patch)["sha"] == .string("commit2"))
    }

    @Test func forgetsARejectedToken() async {
        let (session, _) = github(status401: ["/user"])
        let (submitter, tokens) = submitter(session)
        await #expect(throws: SubmitError.signInRequired) {
            _ = try await submitter.submit(changes: [change], base: "base1", summary: "x", appVersion: "1.0")
        }
        #expect(tokens.read() == nil)
    }

    @Test func asksForSignInWithoutAToken() async {
        let (session, stub) = github()
        let (submitter, _) = submitter(session, token: nil)
        await #expect(throws: SubmitError.signInRequired) {
            _ = try await submitter.submit(changes: [change], base: "base1", summary: "x", appVersion: "1.0")
        }
        #expect(stub.requests.isEmpty)
    }

    @Test func readsChangesRequested() async throws {
        let (session, _) = github()
        let (submitter, _) = submitter(session)
        let open = Submission(number: 42, url: URL(string: "https://github.com/StoDevX/AAO-React-Native/pull/42")!, owner: "ole", branch: "data-editor/x")
        #expect(try await submitter.state(of: open) == .changesRequested)
    }

    @Test func slugsTheBranchName() {
        #expect(GitHubSubmitter.slug("Close The Cage — early on Fridays!") == "close-the-cage-early-on-fridays")
        #expect(GitHubSubmitter.slug(String(repeating: "a", count: 80)).count == 40)
    }
}
```

`Tests/DataEditorKitTests/DeviceFlowTests.swift`:

```swift
import Foundation
import Testing
@testable import DataEditorKit

private final class Counter: @unchecked Sendable {
    private let lock = NSLock()
    private var value = 0
    func next() -> Int { lock.withLock { value += 1; return value } }
}

struct DeviceFlowTests {
    @Test func pollsUntilTheCodeIsApproved() async throws {
        let polls = Counter()
        let waits = SleepLog()
        let (session, _) = StubProtocol.session { request in
            switch request.url!.path {
            case "/login/device/code":
                return (200, body(#"{"device_code":"dev","user_code":"ABCD-1234","verification_uri":"https://github.com/login/device","interval":5,"expires_in":900}"#))
            case "/login/oauth/access_token":
                switch polls.next() {
                case 1: return (200, body(#"{"error":"authorization_pending"}"#))
                case 2: return (200, body(#"{"error":"slow_down","interval":10}"#))
                default: return (200, body(#"{"access_token":"tok","token_type":"bearer"}"#))
                }
            default: return (404, Data())
            }
        }
        let flow = DeviceFlow(clientID: "client", session: session, sleep: waits.record)
        let code = try await flow.start()
        #expect(code.userCode == "ABCD-1234")
        #expect(try await flow.token(for: code) == "tok")
        #expect(waits.durations == [.seconds(5), .seconds(5), .seconds(10)])
    }

    @Test func stopsWhenTheCodeIsDenied() async throws {
        let (session, _) = StubProtocol.session { request in
            request.url!.path == "/login/device/code"
                ? (200, body(#"{"device_code":"dev","user_code":"A","verification_uri":"https://github.com/login/device","interval":1,"expires_in":900}"#))
                : (200, body(#"{"error":"access_denied"}"#))
        }
        let flow = DeviceFlow(clientID: "client", session: session, sleep: { _ in })
        let code = try await flow.start()
        await #expect(throws: DeviceFlow.Failure.denied) { _ = try await flow.token(for: code) }
    }
}

final class SleepLog: @unchecked Sendable {
    private let lock = NSLock()
    private var recorded: [Duration] = []
    var durations: [Duration] { lock.withLock { recorded } }
    var record: @Sendable (Duration) async -> Void { { duration in self.lock.withLock { self.recorded.append(duration) } } }
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `swift test --package-path macos/DataEditor/DataEditorKit --filter "GitHubSubmitterTests|DeviceFlowTests"`
Expected: FAIL to compile.

- [ ] **Step 3: Implement `ChangeSubmitter.swift` and `TokenStore.swift`**

```swift
import Foundation

/// One changed file, at its path in the repo; nil contents means it was removed.
public struct Change: Hashable, Sendable {
    public let path: String
    public let contents: Data?
    public init(path: String, contents: Data?) {
        self.path = path
        self.contents = contents
    }
}

/// A pull request the app opened.
public struct Submission: Codable, Hashable, Sendable {
    public let number: Int
    public let url: URL
    /// the account whose fork holds the branch
    public let owner: String
    public let branch: String
}

public enum SubmissionState: Sendable, Equatable { case open, changesRequested, merged, closed }

public enum SubmitError: Error, Equatable, Sendable {
    case signInRequired
    /// the fork cannot see the commit the data was downloaded at yet
    case missingBaseCommit
    case github(Int, String)
}

/// Sends changes for review. GitHub today; a service that needs no account could take its place.
public protocol ChangeSubmitter: Sendable {
    func submit(changes: [Change], base: String, summary: String, appVersion: String) async throws -> Submission
    func update(_ submission: Submission, changes: [Change], summary: String) async throws
    func state(of submission: Submission) async throws -> SubmissionState
}
```

`TokenStore.swift`:

```swift
import Foundation
import Security

/// Where the GitHub token is kept between launches.
public protocol TokenStore: Sendable {
    func read() -> String?
    func write(_ token: String?)
}

/// The token in the login keychain, as a generic password.
public struct KeychainTokenStore: TokenStore {
    private let service = "com.drewvolz.allaboutolaf-data-editor.github"
    public init() {}

    private var query: [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service] }

    public func read() -> String? {
        var result: CFTypeRef?
        var query = self.query
        query[kSecReturnData as String] = true
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return String(decoding: data, as: UTF8.self)
    }

    public func write(_ token: String?) {
        SecItemDelete(query as CFDictionary)
        guard let token else { return }
        var item = query
        item[kSecValueData as String] = Data(token.utf8)
        SecItemAdd(item as CFDictionary, nil)
    }
}

/// A token held in memory, for tests.
public final class MemoryTokenStore: TokenStore, @unchecked Sendable {
    private let lock = NSLock()
    private var token: String?
    public init(_ token: String? = nil) { self.token = token }
    public func read() -> String? { lock.withLock { token } }
    public func write(_ token: String?) { lock.withLock { self.token = token } }
}
```

- [ ] **Step 4: Implement `GitHubSubmitter.swift`**

```swift
import Foundation

/// Opens and updates pull requests from the contributor's fork, through GitHub's API alone.
public struct GitHubSubmitter: ChangeSubmitter {
    private let tokens: any TokenStore
    private let session: URLSession
    private let repo: GitHubRepo
    private let sleep: @Sendable (Duration) async -> Void

    public init(tokens: any TokenStore, session: URLSession = .shared, repo: GitHubRepo = .aao,
                sleep: @escaping @Sendable (Duration) async -> Void = { try? await Task.sleep(for: $0) }) {
        self.tokens = tokens
        self.session = session
        self.repo = repo
        self.sleep = sleep
    }

    /// A branch-name-safe form of a summary: lowercase words joined by dashes, at most 40 characters.
    static func slug(_ text: String) -> String {
        let words = text.lowercased().split { !$0.isLetter && !$0.isNumber || !$0.isASCII }
        return String(words.joined(separator: "-").prefix(40)).trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    }

    private func send(_ method: String, _ path: String, _ payload: JSONValue? = nil) async throws -> JSONValue {
        guard let token = tokens.read() else { throw SubmitError.signInRequired }
        var request = URLRequest(url: URL(string: "https://api.github.com\(path)")!)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        if let payload { request.httpBody = try JSONEncoder().encode(payload) }
        let (data, response) = try await session.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status == 401 {
            tokens.write(nil)
            throw SubmitError.signInRequired
        }
        let value = (try? JSONDecoder().decode(JSONValue.self, from: data)) ?? .null
        guard (200..<300).contains(status) else { throw SubmitError.github(status, value["message"]?.string ?? "") }
        return value
    }

    /// The contributor's fork, made if they have none, synced with upstream where it can be.
    private func fork() async throws -> (owner: String, fullName: String) {
        let created = try await send("POST", "/repos/\(repo.fullName)/forks")
        guard let fullName = created["full_name"]?.string, let owner = created["owner"]?["login"]?.string else {
            throw SubmitError.github(0, "GitHub did not say where the fork is")
        }
        // forking finishes in the background
        for attempt in 0..<30 {
            if (try? await send("GET", "/repos/\(fullName)")) != nil { break }
            if attempt == 29 { throw SubmitError.github(0, "The fork was not ready in time") }
            await sleep(.seconds(1))
        }
        _ = try? await send("POST", "/repos/\(fullName)/merge-upstream", .object(["branch": .string(repo.branch)]))
        return (owner, fullName)
    }

    /// A commit of `changes` on top of `parent` in `fork`.
    private func commit(_ changes: [Change], parent: String, message: String, in fork: String) async throws -> String {
        let parentCommit: JSONValue
        do {
            parentCommit = try await send("GET", "/repos/\(fork)/git/commits/\(parent)")
        } catch SubmitError.github(404, _) {
            throw SubmitError.missingBaseCommit
        }
        guard let baseTree = parentCommit["tree"]?["sha"]?.string else { throw SubmitError.missingBaseCommit }
        var entries: [JSONValue] = []
        for change in changes {
            var sha = JSONValue.null
            if let contents = change.contents {
                let blob = try await send("POST", "/repos/\(fork)/git/blobs", .object([
                    "content": .string(contents.base64EncodedString()), "encoding": .string("base64"),
                ]))
                sha = blob["sha"] ?? .null
            }
            entries.append(.object(["path": .string(change.path), "mode": .string("100644"), "type": .string("blob"), "sha": sha]))
        }
        let tree = try await send("POST", "/repos/\(fork)/git/trees", .object(["base_tree": .string(baseTree), "tree": .array(entries)]))
        let commit = try await send("POST", "/repos/\(fork)/git/commits", .object([
            "message": .string(message), "tree": tree["sha"] ?? .null, "parents": .array([.string(parent)]),
        ]))
        guard let sha = commit["sha"]?.string else { throw SubmitError.github(0, "GitHub did not return the commit") }
        return sha
    }

    public func submit(changes: [Change], base: String, summary: String, appVersion: String) async throws -> Submission {
        _ = try await send("GET", "/user")
        let (owner, fullName) = try await fork()
        let stamp = Date.now.formatted(.iso8601.year().month().day().time(includingFractionalSeconds: false)).filter(\.isNumber)
        let branch = "data-editor/\(Self.slug(summary))-\(stamp)"
        let sha = try await commit(changes, parent: base, message: summary, in: fullName)
        _ = try await send("POST", "/repos/\(fullName)/git/refs", .object(["ref": .string("refs/heads/\(branch)"), "sha": .string(sha)]))
        let files = changes.map { "- `\($0.path)`" }.joined(separator: "\n")
        let body = "\(summary)\n\n\(files)\n\nSubmitted with the All About Olaf Data Editor \(appVersion), from \(base.prefix(7))."
        let pull = try await send("POST", "/repos/\(repo.fullName)/pulls", .object([
            "title": .string(summary), "head": .string("\(owner):\(branch)"), "base": .string(repo.branch),
            "body": .string(body), "maintainer_can_modify": .bool(true),
        ]))
        guard case .number(let number)? = pull["number"], let url = pull["html_url"]?.string.flatMap(URL.init(string:)) else {
            throw SubmitError.github(0, "GitHub did not return the pull request")
        }
        return Submission(number: Int(number), url: url, owner: owner, branch: branch)
    }

    public func update(_ submission: Submission, changes: [Change], summary: String) async throws {
        let fullName = "\(submission.owner)/\(repo.name)"
        let ref = try await send("GET", "/repos/\(fullName)/git/ref/heads/\(submission.branch)")
        guard let head = ref["object"]?["sha"]?.string else { throw SubmitError.github(0, "The pull request's branch is gone") }
        let sha = try await commit(changes, parent: head, message: summary, in: fullName)
        _ = try await send("PATCH", "/repos/\(fullName)/git/refs/heads/\(submission.branch)", .object(["sha": .string(sha)]))
    }

    public func state(of submission: Submission) async throws -> SubmissionState {
        let pull = try await send("GET", "/repos/\(repo.fullName)/pulls/\(submission.number)")
        if let merged = pull["merged_at"], merged != .null { return .merged }
        if pull["state"]?.string == "closed" { return .closed }
        let reviews = try await send("GET", "/repos/\(repo.fullName)/pulls/\(submission.number)/reviews").array ?? []
        var latest: [String: String] = [:]
        for review in reviews {
            if let user = review["user"]?["login"]?.string, let state = review["state"]?.string, state != "COMMENTED" { latest[user] = state }
        }
        return latest.values.contains("CHANGES_REQUESTED") ? .changesRequested : .open
    }
}
```

The tree changes only the changed files, so `changes` holds full contents for each one (`nil` for a removal). `update` sends the full current set of changed files, which is harmless: files that haven't changed again produce the same blobs.

- [ ] **Step 5: Implement `DeviceFlow.swift`**

```swift
import Foundation

/// GitHub's OAuth device flow: the contributor enters a short code at github.com.
public struct DeviceFlow: Sendable {
    public struct DeviceCode: Sendable, Hashable {
        public let deviceCode: String
        public let userCode: String
        public let verificationURL: URL
        public let interval: Int
    }

    public enum Failure: Error, Equatable, Sendable { case denied, expired, unexpected(String) }

    private let clientID: String
    private let session: URLSession
    private let sleep: @Sendable (Duration) async -> Void

    public init(clientID: String, session: URLSession = .shared,
                sleep: @escaping @Sendable (Duration) async -> Void = { try? await Task.sleep(for: $0) }) {
        self.clientID = clientID
        self.session = session
        self.sleep = sleep
    }

    private func post(_ path: String, _ form: [String: String]) async throws -> JSONValue {
        var request = URLRequest(url: URL(string: "https://github.com\(path)")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        var components = URLComponents()
        components.queryItems = form.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
        request.httpBody = Data((components.percentEncodedQuery ?? "").utf8)
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(JSONValue.self, from: data)
    }

    public func start() async throws -> DeviceCode {
        let reply = try await post("/login/device/code", ["client_id": clientID, "scope": "public_repo"])
        guard let device = reply["device_code"]?.string, let user = reply["user_code"]?.string,
              let url = reply["verification_uri"]?.string.flatMap(URL.init(string:)),
              case .number(let interval)? = reply["interval"] else {
            throw Failure.unexpected(reply["error_description"]?.string ?? "GitHub did not start sign-in")
        }
        return DeviceCode(deviceCode: device, userCode: user, verificationURL: url, interval: Int(interval))
    }

    /// Waits for the contributor to enter the code, and returns the token.
    public func token(for code: DeviceCode) async throws -> String {
        var interval = code.interval
        while true {
            await sleep(.seconds(interval))
            let reply = try await post("/login/oauth/access_token", [
                "client_id": clientID, "device_code": code.deviceCode,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            ])
            if let token = reply["access_token"]?.string { return token }
            switch reply["error"]?.string {
            case "authorization_pending": continue
            case "slow_down":
                if case .number(let next)? = reply["interval"] { interval = Int(next) } else { interval += 5 }
            case "access_denied": throw Failure.denied
            case "expired_token": throw Failure.expired
            default: throw Failure.unexpected(reply["error_description"]?.string ?? "sign-in failed")
            }
        }
    }
}
```

- [ ] **Step 6: Run the tests**

Run: `swift test --package-path macos/DataEditor/DataEditorKit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add macos/DataEditor/DataEditorKit
git commit -m "Submit data changes as a pull request from the contributor's fork"
```

### Task 11: The hours model, diffs and the build debouncer

**Files:**
- Create: `Sources/DataEditorKit/HoursDocument.swift`, `Sources/DataEditorKit/LineDiff.swift`, `Sources/DataEditorKit/Debouncer.swift`
- Test: `Tests/DataEditorKitTests/HoursDocumentTests.swift`, `Tests/DataEditorKitTests/LineDiffTests.swift`, `Tests/DataEditorKitTests/DebouncerTests.swift`

**Interfaces:**
- Produces:
  - `enum Weekday: String, CaseIterable` with cases `Mo` through `Su`, plus `next` and `label`
  - `struct ClockTime: Comparable`, with `init?(_ text: String)`, `init(minutes:)`, `minutes`, `text` and `static let quarterHours: [ClockTime]`
  - `struct HoursRow { days: [Weekday]; from: ClockTime?; to: ClockTime?; fromText: String; toText: String }`, with `segments() -> [Segment]` and `struct Segment: Hashable { day: Weekday; start: Int; end: Int }`
  - `struct Service { title: String; notes: String?; isPhysicallyOpen: Bool?; rows: [HoursRow] }`
  - `struct ScheduleEditor`, which builds `EditOp`s for one schedule at a `base: [PathKey]` path: `setTitle`, `setNotes`, `setTime`, `setDays`, `addRow`, `removeRow`, `addService`, `removeService` and `setClosed`
  - `struct HoursDocument`, with `init(value:)`, `name`, `category`, `services`, `exceptions: [(date: String, services: [Service])]`, `breakSchedule: [String: BreakEntry]` and `enum BreakEntry { case template(String), custom([Service]), other }`
  - `func lineDiff(old: String, new: String) -> [DiffLine]`, with `struct DiffLine: Hashable { kind: Kind; text: String }` and `enum Kind { case same, added, removed }`
  - `actor Debouncer`, with `init(delay:)` and `schedule(_:)`

- [ ] **Step 1: Write the failing tests**

`Tests/DataEditorKitTests/HoursDocumentTests.swift`:

```swift
import Foundation
import Testing
@testable import DataEditorKit

private let cage: JSONValue = .object([
    "name": .string("The Cage"),
    "category": .string("Food"),
    "schedule": .array([
        .object([
            "title": .string("Hours"),
            "notes": .string("The kitchen stops cooking at 8 p.m."),
            "hours": .array([
                .object(["days": .array([.string("Mo"), .string("Tu")]), "from": .string("7:30am"), "to": .string("8:00pm")]),
                .object(["days": .array([.string("Fr")]), "from": .string("8:00pm"), "to": .string("2:00am")]),
            ]),
        ]),
    ]),
    "exceptions": .array([
        .object(["date": .string("2026-11-26"), "schedule": .array([.object(["title": .string("Hours"), "isPhysicallyOpen": .bool(false), "hours": .array([])])])]),
    ]),
    "breakSchedule": .object(["fall": .string("library-fall-closed")]),
])

struct ClockTimeTests {
    @Test(arguments: [("12:00am", 0), ("12:30pm", 750), ("7:30am", 450), ("11:59pm", 1439)])
    func readsTimes(text: String, minutes: Int) {
        #expect(ClockTime(text)?.minutes == minutes)
        #expect(ClockTime(minutes: minutes).text == text)
    }

    @Test(arguments: ["7:30", "13:00pm", "0:30am", "7:3am", ""])
    func rejectsMalformedTimes(text: String) {
        #expect(ClockTime(text) == nil)
    }

    @Test func offersEveryQuarterHour() {
        #expect(ClockTime.quarterHours.count == 96)
        #expect(ClockTime.quarterHours.first?.text == "12:00am")
    }
}

struct HoursDocumentTests {
    @Test func readsTheSchedule() {
        let document = HoursDocument(value: cage)
        #expect(document.name == "The Cage")
        #expect(document.services.first?.rows.first?.days == [.Mo, .Tu])
        #expect(document.exceptions.first?.date == "2026-11-26")
        #expect(document.exceptions.first?.services.first?.isPhysicallyOpen == false)
        #expect(document.breakSchedule["fall"] == .template("library-fall-closed"))
    }

    @Test func splitsARowThatClosesAfterMidnight() {
        let row = HoursDocument(value: cage).services[0].rows[1]
        #expect(row.segments() == [
            HoursRow.Segment(day: .Fr, start: 1200, end: 1440),
            HoursRow.Segment(day: .Sa, start: 0, end: 120),
        ])
    }

    @Test func treatsMidnightToMidnightAsAllDay() {
        let row = HoursRow(days: [.Su], fromText: "12:00am", toText: "12:00am")
        #expect(row.segments() == [HoursRow.Segment(day: .Su, start: 0, end: 1440)])
    }

    @Test func wrapsSundayIntoMonday() {
        let row = HoursRow(days: [.Su], fromText: "10:00pm", toText: "1:00am")
        #expect(row.segments().last == HoursRow.Segment(day: .Mo, start: 0, end: 60))
    }

    @Test func editsAtTheSchedulesPath() {
        let editor = ScheduleEditor(base: ["exceptions", 0, "schedule"], services: HoursDocument(value: cage).exceptions[0].services)
        #expect(editor.setTime(service: 0, row: 1, end: .to, ClockTime(minutes: 600)) ==
            .set(["exceptions", 0, "schedule", 0, "hours", 1, "to"], .string("10:00am")))
        #expect(editor.addRow(service: 0) == .set(
            ["exceptions", 0, "schedule", 0, "hours", 0],
            .object(["days": .array(["Mo", "Tu", "We", "Th", "Fr"].map(JSONValue.string)), "from": .string("9:00am"), "to": .string("5:00pm")])
        ))
        #expect(editor.setNotes(service: 0, nil) == .delete(["exceptions", 0, "schedule", 0, "notes"]))
        #expect(editor.setDays(service: 0, row: 0, [.We, .Mo]) == .set(["exceptions", 0, "schedule", 0, "hours", 0, "days"], .array([.string("Mo"), .string("We")])))
    }

    @Test func refusesToRemoveTheLastService() {
        let editor = ScheduleEditor(base: ["schedule"], services: HoursDocument(value: cage).services)
        #expect(editor.removeService(0) == nil)
    }
}
```

`Tests/DataEditorKitTests/LineDiffTests.swift`:

```swift
import Testing
@testable import DataEditorKit

struct LineDiffTests {
    @Test func marksChangedLines() {
        let diff = lineDiff(old: "a\nb\nc\n", new: "a\nB\nc\n")
        #expect(diff == [
            DiffLine(kind: .same, text: "a"),
            DiffLine(kind: .removed, text: "b"),
            DiffLine(kind: .added, text: "B"),
            DiffLine(kind: .same, text: "c"),
        ])
    }

    @Test func showsANewFileAsAdded() {
        #expect(lineDiff(old: "", new: "x\n") == [DiffLine(kind: .added, text: "x")])
    }
}
```

`Tests/DataEditorKitTests/DebouncerTests.swift`:

```swift
import Testing
@testable import DataEditorKit

private actor Runs {
    var values: [Int] = []
    func add(_ value: Int) { values.append(value) }
}

struct DebouncerTests {
    @Test func runsOnlyTheLastOfARapidBurst() async throws {
        let debouncer = Debouncer(delay: .milliseconds(50))
        let runs = Runs()
        for value in 1...10 {
            await debouncer.schedule { await runs.add(value) }
            try await Task.sleep(for: .milliseconds(5))
        }
        try await Task.sleep(for: .milliseconds(200))
        #expect(await runs.values == [10])
    }

    @Test func runsAgainAfterAPause() async throws {
        let debouncer = Debouncer(delay: .milliseconds(20))
        let runs = Runs()
        await debouncer.schedule { await runs.add(1) }
        try await Task.sleep(for: .milliseconds(100))
        await debouncer.schedule { await runs.add(2) }
        try await Task.sleep(for: .milliseconds(100))
        #expect(await runs.values == [1, 2])
    }
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `swift test --package-path macos/DataEditor/DataEditorKit`
Expected: FAIL to compile.

- [ ] **Step 3: Implement `HoursDocument.swift`**

```swift
import Foundation

/// A day as the data files write it.
public enum Weekday: String, CaseIterable, Sendable, Hashable {
    case Mo, Tu, We, Th, Fr, Sa, Su

    public var next: Weekday { Self.allCases[(Self.allCases.firstIndex(of: self)! + 1) % 7] }

    public var label: String {
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][Self.allCases.firstIndex(of: self)!]
    }
}

/// A time of day as the data files write it: `7:30am`.
public struct ClockTime: Comparable, Hashable, Sendable {
    /// minutes since midnight, 0..<1440
    public let minutes: Int

    public init(minutes: Int) { self.minutes = ((minutes % 1440) + 1440) % 1440 }

    public init?(_ text: String) {
        guard let match = text.wholeMatch(of: /(1[0-2]|[1-9]):([0-5]\d)(am|pm)/),
              let hour = Int(match.1), let minute = Int(match.2) else { return nil }
        let base = hour % 12 + (match.3 == "pm" ? 12 : 0)
        self.init(minutes: base * 60 + minute)
    }

    public var text: String {
        let hour = minutes / 60
        let twelve = hour % 12 == 0 ? 12 : hour % 12
        return "\(twelve):\(String(format: "%02d", minutes % 60))\(hour < 12 ? "am" : "pm")"
    }

    public static func < (a: ClockTime, b: ClockTime) -> Bool { a.minutes < b.minutes }

    public static let quarterHours: [ClockTime] = stride(from: 0, to: 1440, by: 15).map(ClockTime.init(minutes:))
}

/// One row of hours: some days, open from one time to another.
public struct HoursRow: Hashable, Sendable {
    /// A stretch of one day that a row covers, in minutes since midnight.
    public struct Segment: Hashable, Sendable {
        public let day: Weekday
        public let start: Int
        public let end: Int
    }

    public let days: [Weekday]
    public let fromText: String
    public let toText: String
    public var from: ClockTime? { ClockTime(fromText) }
    public var to: ClockTime? { ClockTime(toText) }

    public init(days: [Weekday], fromText: String, toText: String) {
        self.days = days
        self.fromText = fromText
        self.toText = toText
    }

    /// The stretches of each day this row covers. A close at or before the open
    /// runs past midnight into the next day; midnight to midnight is all day.
    public func segments() -> [Segment] {
        guard let from, let to else { return [] }
        return days.flatMap { day -> [Segment] in
            if to.minutes > from.minutes { return [Segment(day: day, start: from.minutes, end: to.minutes)] }
            if to.minutes == 0 { return [Segment(day: day, start: from.minutes, end: 1440)] }
            return [Segment(day: day, start: from.minutes, end: 1440), Segment(day: day.next, start: 0, end: to.minutes)]
        }
    }
}

/// One service block: a title, its rows, and how it is marked.
public struct Service: Hashable, Sendable {
    public let title: String
    public let notes: String?
    public let isPhysicallyOpen: Bool?
    public let rows: [HoursRow]
}

func services(in value: JSONValue?) -> [Service] {
    (value?.array ?? []).map { block in
        Service(
            title: block["title"]?.string ?? "",
            notes: block["notes"]?.string,
            isPhysicallyOpen: block["isPhysicallyOpen"]?.bool,
            rows: (block["hours"]?.array ?? []).map { row in
                HoursRow(
                    days: (row["days"]?.array ?? []).compactMap { $0.string.flatMap(Weekday.init(rawValue:)) },
                    fromText: row["from"]?.string ?? "",
                    toText: row["to"]?.string ?? ""
                )
            }
        )
    }
}

/// An hours file, read for the editor.
public struct HoursDocument: Sendable {
    public enum BreakEntry: Hashable, Sendable {
        /// a template named in breaks.yaml
        case template(String)
        /// this building's own hours for the break
        case custom([Service])
        /// a schedule with its own exceptions, which the editor shows but does not edit
        case other
    }

    public let value: JSONValue
    public init(value: JSONValue) { self.value = value }

    public var name: String { value["name"]?.string ?? "" }
    public var category: String { value["category"]?.string ?? "" }
    public var services: [Service] { DataEditorKit.services(in: value["schedule"]) }

    public var exceptions: [(date: String, services: [Service])] {
        (value["exceptions"]?.array ?? []).map { ($0["date"]?.string ?? "", DataEditorKit.services(in: $0["schedule"])) }
    }

    public var breakSchedule: [String: BreakEntry] {
        guard case .object(let entries)? = value["breakSchedule"] else { return [:] }
        return entries.mapValues { entry in
            if let name = entry.string { return .template(name) }
            if entry.array != nil { return .custom(DataEditorKit.services(in: entry)) }
            return .other
        }
    }
}

/// Builds the edits for one schedule, wherever in the file it is.
public struct ScheduleEditor: Sendable {
    public enum End: String, Sendable { case from, to }

    public let base: [PathKey]
    public let services: [Service]

    public init(base: [PathKey], services: [Service]) {
        self.base = base
        self.services = services
    }

    private func path(_ service: Int, _ rest: PathKey...) -> [PathKey] { base + [.index(service)] + rest }

    public func setTitle(service: Int, _ title: String) -> EditOp { .set(path(service, "title"), .string(title)) }

    public func setNotes(service: Int, _ notes: String?) -> EditOp {
        guard let notes, !notes.isEmpty else { return .delete(path(service, "notes")) }
        return .set(path(service, "notes"), .string(notes))
    }

    public func setTime(service: Int, row: Int, end: End, _ time: ClockTime) -> EditOp {
        .set(path(service, "hours", .index(row), .key(end.rawValue)), .string(time.text))
    }

    /// Days in week order, as the files write them.
    public func setDays(service: Int, row: Int, _ days: [Weekday]) -> EditOp {
        let ordered = Weekday.allCases.filter(days.contains)
        return .set(path(service, "hours", .index(row), "days"), .array(ordered.map { .string($0.rawValue) }))
    }

    public func addRow(service: Int) -> EditOp {
        .set(path(service, "hours", .index(services[service].rows.count)), .object([
            "days": .array(["Mo", "Tu", "We", "Th", "Fr"].map(JSONValue.string)),
            "from": .string("9:00am"), "to": .string("5:00pm"),
        ]))
    }

    public func removeRow(service: Int, row: Int) -> EditOp { .delete(path(service, "hours", .index(row))) }

    public func addService(title: String) -> EditOp {
        .set(base + [.index(services.count)], .object([
            "title": .string(title),
            "hours": .array([.object(["days": .array([.string("Mo")]), "from": .string("9:00am"), "to": .string("5:00pm")])]),
        ]))
    }

    /// Nil for the last service: a schedule needs at least one.
    public func removeService(_ service: Int) -> EditOp? {
        services.count > 1 ? .delete(base + [.index(service)]) : nil
    }

    /// Marks a service closed (no rows, not physically open), or open again.
    public func setClosed(service: Int, _ closed: Bool) -> [EditOp] {
        closed
            ? [.set(path(service, "hours"), .array([])), .set(path(service, "isPhysicallyOpen"), .bool(false))]
            : [.delete(path(service, "isPhysicallyOpen")), addRow(service: service)]
    }
}
```

- [ ] **Step 4: Implement `LineDiff.swift` and `Debouncer.swift`**

```swift
import Foundation

public struct DiffLine: Hashable, Sendable {
    public enum Kind: Sendable { case same, added, removed }
    public let kind: Kind
    public let text: String
}

/// `new` against `old`, line by line, with each removal shown just before what replaced it.
public func lineDiff(old: String, new: String) -> [DiffLine] {
    let split = { (text: String) in text.split(separator: "\n", omittingEmptySubsequences: false).map(String.init).dropLast(text.hasSuffix("\n") ? 1 : 0) }
    let a = Array(split(old)), b = Array(split(new))
    let difference = b.difference(from: a)
    var removed = Set<Int>(), inserted = Set<Int>()
    for change in difference {
        switch change {
        case .remove(let offset, _, _): removed.insert(offset)
        case .insert(let offset, _, _): inserted.insert(offset)
        }
    }
    var lines: [DiffLine] = []
    var i = 0, j = 0
    while i < a.count || j < b.count {
        if i < a.count, removed.contains(i) { lines.append(DiffLine(kind: .removed, text: a[i])); i += 1 }
        else if j < b.count, inserted.contains(j) { lines.append(DiffLine(kind: .added, text: b[j])); j += 1 }
        else { lines.append(DiffLine(kind: .same, text: b[j])); i += 1; j += 1 }
    }
    return lines
}
```

```swift
import Foundation

/// Runs only the last of a burst of work, once `delay` has passed with nothing newer.
public actor Debouncer {
    private let delay: Duration
    private var task: Task<Void, Never>?

    public init(delay: Duration) { self.delay = delay }

    public func schedule(_ work: @escaping @Sendable () async -> Void) {
        task?.cancel()
        task = Task { [delay] in
            try? await Task.sleep(for: delay)
            guard !Task.isCancelled else { return }
            await work()
        }
    }
}
```

- [ ] **Step 5: Run the tests**

Run: `swift test --package-path macos/DataEditor/DataEditorKit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add macos/DataEditor/DataEditorKit
git commit -m "Model building hours for editing, with diffs and debounced builds"
```

---

## Part D: the app

### Task 12: The Xcode project and the app's model

**Files:**
- Create: `macos/DataEditor/DataEditor.xcodeproj` (in Xcode), `macos/DataEditor/DataEditor/DataEditorApp.swift`, `AppModel.swift`, `Runtime.swift`, `Info.plist`, `DataEditor.entitlements`
- Create: `macos/DataEditor/DataEditorTests/RuntimeTests.swift`

**Interfaces:**
- Consumes: everything in DataEditorKit
- Produces: `@MainActor @Observable final class AppModel`, with `phase`, `buildings`, `selection`, `document`, `problems`, `buildProblems`, `changedFiles`, `cccStatus`, `cccLog`, `pagesOrigin`, `calendar`, `submission`, `submissionState`, `newerCommit`, `conflicts`, `launch()`, `select(_:)`, `apply(_:)`, `revert(_:)`, `diff(for:)`, `submit(summary:)`, `refreshSubmission()`, `updateWorkspace()`, `keepMine(_:)` and `keepLatest(_:)`. Also `struct Runtime`, with `node`, `helperDirectory`, `cccRoot`, `stamp()` and `installHelper(into:)`.

- [ ] **Step 1: Create the project in Xcode 27**

1. File → New → Project → macOS → App. Product Name `DataEditor`, Team `NFMTHAZVS9`, Organization Identifier `com.drewvolz`, Interface SwiftUI, Language Swift, Testing System Swift Testing with XCUITest. Save it in `macos/DataEditor/`, without a new git repository.
2. Set the target's Bundle Identifier to `com.drewvolz.allaboutolaf-data-editor`, Minimum Deployments to macOS 27.0, and Architectures to `arm64` only (`ARCHS = arm64`, `ONLY_ACTIVE_ARCH = NO` for Release).
3. Under Signing & Capabilities, remove App Sandbox and keep Hardened Runtime. Under Hardened Runtime, check nothing: the app itself needs no exceptions, because Node and workerd are separate binaries signed with their own entitlements (Task 15).
4. Build Settings: `SWIFT_VERSION = 6.0`, `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor`, `SWIFT_APPROACHABLE_CONCURRENCY = YES` (as in Radio), `ENABLE_USER_SCRIPT_SANDBOXING = NO` (Task 15's Run Script writes into the bundle), `INFOPLIST_FILE = DataEditor/Info.plist`, `GENERATE_INFOPLIST_FILE = YES`.
5. File → Add Package Dependencies → Add Local… → `macos/DataEditor/DataEditorKit`. Add the `DataEditorKit` library to the app target and the test target.
6. Share the scheme (Product → Scheme → Manage Schemes → Shared), so `xcshareddata/xcschemes/DataEditor.xcscheme` is committed, as Radio's is.

`macos/DataEditor/DataEditor/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDisplayName</key>
	<string>All About Olaf Data Editor</string>
	<key>DataEditorGitHubClientID</key>
	<string>$(DATA_EDITOR_GITHUB_CLIENT_ID)</string>
	<key>NSLocalNetworkUsageDescription</key>
	<string>The Data Editor shares your edits with All About Olaf on your phone over your local network.</string>
	<key>NSBonjourServices</key>
	<array>
		<string>_ccc-server._tcp.</string>
	</array>
</dict>
</plist>
```

Add the build setting `DATA_EDITOR_GITHUB_CLIENT_ID`, with its value from Task 14 Step 1. The setting may stay empty until then; the submit sheet says so if it is.

- [ ] **Step 2: Write the failing test**

`macos/DataEditor/DataEditorTests/RuntimeTests.swift`:

```swift
import Foundation
import Testing
@testable import DataEditor

struct RuntimeTests {
    @Test func installsTheHelperIntoTheWorkspace() throws {
        let fm = FileManager.default
        let resources = fm.temporaryDirectory.appending(path: "runtime-\(UUID().uuidString)")
        let helper = resources.appending(path: "helper")
        try fm.createDirectory(at: helper, withIntermediateDirectories: true)
        try Data("// helper".utf8).write(to: helper.appending(path: "data-editor-helper.mjs"))
        try Data("// bundle".utf8).write(to: helper.appending(path: "bundle-data.mjs"))
        try Data(#"{"scriptsTree":"s","modulesTree":"m"}"#.utf8).write(to: helper.appending(path: "helper-stamp.json"))
        let runtime = Runtime(root: resources)
        let workspace = fm.temporaryDirectory.appending(path: "ws-\(UUID().uuidString)")

        try runtime.installHelper(into: workspace)
        try runtime.installHelper(into: workspace)

        #expect(fm.fileExists(atPath: workspace.appending(path: "scripts/data-editor-helper.mjs").path))
        #expect(fm.fileExists(atPath: workspace.appending(path: "scripts/bundle-data.mjs").path))
        #expect(try runtime.stamp().scriptsTree == "s")
    }
}
```

- [ ] **Step 3: Run it to verify it fails**

Run: `xcodebuild test -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor -destination 'platform=macOS,arch=arm64' -only-testing:DataEditorTests/RuntimeTests`
Expected: FAIL to compile, because `Runtime` is undefined.

- [ ] **Step 4: Implement `Runtime.swift`**

```swift
import DataEditorKit
import Foundation

/// What the app bundles under `Contents/Resources/Runtime`: Node, the helper, and ccc-server.
struct Runtime {
    let root: URL

    static let bundled = Runtime(root: Bundle.main.resourceURL!.appending(path: "Runtime"))

    var node: URL { root.appending(path: "node") }
    var helperDirectory: URL { root.appending(path: "helper") }
    var cccRoot: URL { root.appending(path: "ccc") }

    func stamp() throws -> HelperStamp {
        try JSONDecoder().decode(HelperStamp.self, from: Data(contentsOf: helperDirectory.appending(path: "helper-stamp.json")))
    }

    /// Copies the helper into `workspace/scripts/`, where the paths it works
    /// out from its own location (`../data`, `../images`) are the workspace's.
    func installHelper(into workspace: URL) throws {
        let fm = FileManager.default
        let scripts = workspace.appending(path: "scripts")
        try? fm.removeItem(at: scripts)
        try fm.createDirectory(at: workspace, withIntermediateDirectories: true)
        try fm.copyItem(at: helperDirectory, to: scripts)
    }
}
```

- [ ] **Step 5: Implement `AppModel.swift`**

```swift
import AppKit
import DataEditorKit
import Foundation
import Observation
import SystemConfiguration

/// Everything the windows show, and the one place that talks to the helper, ccc and GitHub.
@MainActor @Observable
final class AppModel {
    enum Phase: Equatable {
        case starting, downloading, ready, needsAppUpdate
        case failed(String)
    }

    var phase: Phase = .starting
    var buildings: [BuildingSummary] = []
    var calendar: BreakCalendar?
    var selection: String? { didSet { if let selection, selection != oldValue { Task { await select(selection) } } } }
    var document: HoursDocument?
    var problems: [Problem] = []
    var buildProblems: [Problem] = []
    var changedFiles: [String] = []
    var cccStatus: CccRunner.Status = .stopped
    var cccLog: [String] = []
    var pagesOrigin: String?
    var submission: Submission? { didSet { saveSubmission() } }
    var submissionState: SubmissionState?
    /// master's newest commit, when it is not the one being edited
    var newerCommit: String?
    var conflicts: [String] = []

    let tokens = KeychainTokenStore()
    private let runtime: Runtime
    private let support: URL
    /// UI tests run the repo's own helper on the test runner's Node, and no ccc
    private let testHelper: (node: URL, scripts: URL)?
    private let workspace: Workspace
    private var helper: HelperClient?
    private var ccc: CccRunner?
    private let builds = Debouncer(delay: .milliseconds(500))

    static let port = 8790

    init(runtime: Runtime = .bundled) {
        self.runtime = runtime
        let defaults = UserDefaults.standard
        support = defaults.string(forKey: "UITestWorkspace").map { URL(filePath: $0) }
            ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appending(path: "DataEditor")
        if let node = defaults.string(forKey: "UITestNode"), let scripts = defaults.string(forKey: "UITestHelper") {
            testHelper = (URL(filePath: node), URL(filePath: scripts))
        } else {
            testHelper = nil
        }
        workspace = Workspace(root: support.appending(path: "workspace"))
        submission = (try? Data(contentsOf: support.appending(path: "submission.json"))).flatMap { try? JSONDecoder().decode(Submission.self, from: $0) }
    }

    var githubClientID: String { Bundle.main.object(forInfoDictionaryKey: "DataEditorGitHubClientID") as? String ?? "" }
    var appVersion: String { Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "dev" }
    var baseCommit: String? { workspace.snapshot?.commit }

    func launch() async {
        do {
            if workspace.snapshot == nil {
                phase = .downloading
                try await workspace.download(commit: try await workspace.latestCommit())
            }
            let node: URL
            let script: URL
            if let testHelper {
                (node, script) = (testHelper.node, testHelper.scripts.appending(path: "data-editor-helper.mjs"))
            } else {
                guard let snapshot = workspace.snapshot, snapshot.isCompatible(with: try runtime.stamp()) else {
                    phase = .needsAppUpdate
                    return
                }
                try runtime.installHelper(into: workspace.root)
                (node, script) = (runtime.node, workspace.root.appending(path: "scripts/data-editor-helper.mjs"))
            }
            let helper = try HelperClient(executable: node, arguments: [
                script.path, "--data", workspace.dataDirectory.path, "--out", workspace.outDirectory.path,
            ])
            await helper.start()
            self.helper = helper
            buildProblems = try await helper.build().problems
            if testHelper == nil {
                let port = try await helper.serve(port: Self.port)
                let origin = DataEditorKit.pagesOrigin(localHostName: Self.localHostName(), port: port)
                pagesOrigin = origin
                let ccc = CccRunner(configuration: .bundled(node: runtime.node, cccRoot: runtime.cccRoot, pagesOrigin: origin, state: support.appending(path: "ccc")))
                self.ccc = ccc
                Task { for await status in await ccc.statuses() { self.cccStatus = status; self.cccLog = await ccc.log } }
                await ccc.start()
            }
            buildings = try await helper.buildings()
            calendar = try await helper.calendar()
            changedFiles = try workspace.changedFiles()
            conflicts = workspace.conflicts
            phase = .ready
            if testHelper == nil {
                await refreshSubmission()
                let latest = try? await workspace.latestCommit()
                newerCommit = latest == workspace.snapshot?.commit ? nil : latest
            }
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    func restartCcc() async { await ccc?.start() }

    func select(_ file: String) async {
        guard let helper else { return }
        do {
            let loaded = try await helper.load(file)
            document = HoursDocument(value: loaded.value)
            problems = loaded.problems
        } catch {
            document = nil
            problems = [Problem(file: file, message: error.localizedDescription, path: nil)]
        }
    }

    func apply(_ ops: [EditOp]) async {
        guard let helper, let file = selection, !ops.isEmpty else { return }
        do {
            let edited = try await helper.edit(file, ops)
            document = HoursDocument(value: edited.value)
            problems = edited.problems
            changedFiles = try workspace.changedFiles()
            if edited.problems.isEmpty {
                await builds.schedule { await self.rebuild() }
            }
        } catch {
            problems = [Problem(file: file, message: error.localizedDescription, path: nil)]
        }
    }

    private func rebuild() async {
        guard let helper else { return }
        buildProblems = (try? await helper.build().problems) ?? [Problem(file: nil, message: "The build did not run", path: nil)]
        cccLog = await ccc?.log ?? []
    }

    func revert(_ file: String) async {
        try? workspace.revert(file)
        await afterFilesChanged()
    }

    func diff(for file: String) -> [DiffLine] {
        let text = { (data: Data?) in data.map { String(decoding: $0, as: UTF8.self) } ?? "" }
        return lineDiff(old: text(try? workspace.baseContents(of: file)), new: text(try? workspace.contents(of: file)))
    }

    /// Opens a pull request, or adds a commit to the open one.
    func submit(summary: String) async throws {
        guard let base = baseCommit else { return }
        let submitter = GitHubSubmitter(tokens: tokens)
        let changes = changedFiles.map { Change(path: "data/\($0)", contents: try? workspace.contents(of: $0)) }
        if let submission, submissionState == .open || submissionState == .changesRequested {
            try await submitter.update(submission, changes: changes, summary: summary)
        } else {
            submission = try await submitter.submit(changes: changes, base: base, summary: summary, appVersion: appVersion)
        }
        await refreshSubmission()
    }

    func refreshSubmission() async {
        guard let submission else { submissionState = nil; return }
        submissionState = try? await GitHubSubmitter(tokens: tokens).state(of: submission)
    }

    /// Moves to master's newest commit, keeping the contributor's edits. A
    /// merged pull request's edits are on master by then, so it is forgotten.
    func updateWorkspace() async {
        do {
            conflicts = try await workspace.update(to: try await workspace.latestCommit())
            newerCommit = nil
            if submissionState == .merged || submissionState == .closed {
                submission = nil
                submissionState = nil
            }
            if testHelper == nil, let snapshot = workspace.snapshot, !snapshot.isCompatible(with: try runtime.stamp()) {
                phase = .needsAppUpdate
                return
            }
            await afterFilesChanged()
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    func keepMine(_ file: String) async {
        try? workspace.keepMine(file)
        conflicts = workspace.conflicts
        await afterFilesChanged()
    }

    func keepLatest(_ file: String) async {
        try? workspace.keepLatest(file)
        conflicts = workspace.conflicts
        await afterFilesChanged()
    }

    /// The helper reads files afresh for each request, so only the lists, the open file and the build need refreshing.
    private func afterFilesChanged() async {
        changedFiles = (try? workspace.changedFiles()) ?? []
        buildings = (try? await helper?.buildings()) ?? buildings
        calendar = (try? await helper?.calendar()) ?? calendar
        if let selection { await select(selection) }
        await rebuild()
    }

    private func saveSubmission() {
        let file = support.appending(path: "submission.json")
        if let submission, let data = try? JSONEncoder().encode(submission) { try? data.write(to: file) }
        else { try? FileManager.default.removeItem(at: file) }
    }

    /// The Mac's Bonjour name (Sharing → Local hostname), without `.local`.
    static func localHostName() -> String {
        (SCDynamicStoreCopyLocalHostName(nil) as String?) ?? ProcessInfo.processInfo.hostName.replacingOccurrences(of: ".local", with: "")
    }
}
```

`updateWorkspace` is offered whenever master has moved (`newerCommit`) and after a merge (Task 14).

- [ ] **Step 6: Implement `DataEditorApp.swift`**

```swift
import SwiftUI

@main
struct DataEditorApp: App {
    @State private var model = AppModel()

    var body: some Scene {
        WindowGroup("Data Editor") {
            ContentView()
                .environment(model)
                .task { await model.launch() }
        }
        Window("Data Browser", id: "browser") {
            DataBrowserView().environment(model)
        }
    }
}
```

Until Tasks 13–14 add them, stub `ContentView` and `DataBrowserView` as `Text("…")` views in `ContentView.swift`, so the target compiles.

- [ ] **Step 7: Run the test and build**

Run: `xcodebuild test -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor -destination 'platform=macOS,arch=arm64' -only-testing:DataEditorTests/RuntimeTests`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add macos/DataEditor/DataEditor.xcodeproj macos/DataEditor/DataEditor macos/DataEditor/DataEditorTests
git commit -m "Add the data editor app and the model that drives it"
```

### Task 13: The hours editor

**Files:**
- Create: `macos/DataEditor/DataEditor/ContentView.swift` (replacing the stub), `BuildingList.swift`, `HoursDetailView.swift`, `ScheduleSection.swift`, `WeekTimeline.swift`, `ServerStatusView.swift`
- Test: `macos/DataEditor/DataEditorUITests/HoursEditorUITests.swift`

**Interfaces:**
- Consumes: `AppModel` (Task 12); `HoursDocument`, `ScheduleEditor`, `ClockTime`, `Weekday` and `HoursRow.Segment` (Task 11)
- Produces: accessibility identifiers that the UI test relies on: `building-list`, `row-time-from-<service>-<row>`, `row-time-to-<service>-<row>`, `add-row-<service>`, `problems`, `server-status`

- [ ] **Step 1: Write the failing UI test**

UI tests start the app without the network or the bundled runtime, through the launch arguments `AppModel` already reads (Task 12): `-UITestWorkspace <support dir>`, `-UITestNode <node>` and `-UITestHelper <repo>/scripts`. With them, the app runs the repo's own helper on that Node, and starts no ccc. The test learns where Node is from `DATA_EDITOR_NODE`, which xcodebuild passes to the test runner when it is set as `TEST_RUNNER_DATA_EDITOR_NODE`.

`macos/DataEditor/DataEditorUITests/HoursEditorUITests.swift`:

```swift
import XCTest

final class HoursEditorUITests: XCTestCase {
    /// A workspace with the repo's data, as if downloaded, and the repo's helper.
    private func launch() throws -> XCUIApplication {
        let repo = URL(filePath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let support = FileManager.default.temporaryDirectory.appending(path: "ui-\(UUID().uuidString)")
        let workspace = support.appending(path: "workspace")
        try FileManager.default.createDirectory(at: workspace.appending(path: "base"), withIntermediateDirectories: true)
        try FileManager.default.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "data"))
        try FileManager.default.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "base/data"))
        try FileManager.default.copyItem(at: repo.appending(path: "images"), to: workspace.appending(path: "images"))
        try Data(#"{"commit":"c1","scriptsTree":"s","modulesTree":"m"}"#.utf8).write(to: workspace.appending(path: "snapshot.json"))
        let app = XCUIApplication()
        let node = try XCTUnwrap(ProcessInfo.processInfo.environment["DATA_EDITOR_NODE"], "run with TEST_RUNNER_DATA_EDITOR_NODE=$(mise which node)")
        app.launchArguments = ["-UITestWorkspace", support.path, "-UITestNode", node, "-UITestHelper", repo.appending(path: "scripts").path]
        app.launch()
        return app
    }

    func testEditingATimeShowsAProblemAndThenTheChange() throws {
        let app = try launch()
        app.outlines["building-list"].staticTexts["The Cage"].click()

        let to = app.popUpButtons["row-time-to-0-0"]
        XCTAssertTrue(to.waitForExistence(timeout: 10))
        to.click()
        app.menuItems["9:00pm"].click()

        app.buttons["Changes"].click()
        XCTAssertTrue(app.staticTexts["building-hours/1-1-cage.yaml"].waitForExistence(timeout: 5))
    }

    func testAddingARowAddsItToTheTimeline() throws {
        let app = try launch()
        app.outlines["building-list"].staticTexts["The Cage"].click()
        let add = app.buttons["add-row-0"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        let before = app.popUpButtons.matching(identifier: "row-time-from-0-2").count
        add.click()
        XCTAssertTrue(app.popUpButtons["row-time-from-0-2"].waitForExistence(timeout: 5))
        XCTAssertEqual(before, 0)
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `TEST_RUNNER_DATA_EDITOR_NODE="$(mise which node)" xcodebuild test -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor -destination 'platform=macOS,arch=arm64' -only-testing:DataEditorUITests/HoursEditorUITests`
Expected: FAIL, because `building-list` is not found.

- [ ] **Step 3: Implement the views**

`ContentView.swift`:

```swift
import DataEditorKit
import SwiftUI

struct ContentView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    @State private var showingChanges = false

    var body: some View {
        switch model.phase {
        case .starting, .downloading:
            ProgressView(model.phase == .downloading ? "Downloading the app's data…" : "Starting…").padding(40)
        case .needsAppUpdate:
            ContentUnavailableView("An update is needed to edit this data", systemImage: "arrow.down.app",
                                   description: Text("The data now expects newer scripts than this copy of the Data Editor has. Choose Check for Updates… in the app menu."))
        case .failed(let message):
            ContentUnavailableView {
                Label("The Data Editor could not start", systemImage: "exclamationmark.triangle")
            } description: { Text(message) } actions: {
                Button("Try Again") { Task { await model.launch() } }
            }
        case .ready:
            NavigationSplitView {
                BuildingList()
            } detail: {
                if let document = model.document {
                    HoursDetailView(document: document)
                } else {
                    ContentUnavailableView("Choose a building", systemImage: "clock")
                }
            }
            .toolbar {
                ToolbarItem { ServerStatusView() }
                ToolbarItem {
                    Button("Changes", systemImage: "doc.badge.ellipsis") { showingChanges = true }
                        .badge(model.changedFiles.count)
                }
                ToolbarItem { Button("Data Browser", systemImage: "curlybraces") { openWindow(id: "browser") } }
            }
            .sheet(isPresented: $showingChanges) { ChangesView() }
        }
    }
}

struct DataBrowserView: View {
    var body: some View { Text("The data browser arrives in Task 14.") }
}

struct ChangesView: View {
    var body: some View { Text("Changes arrive in Task 14.") }
}
```

`BuildingList.swift`:

```swift
import DataEditorKit
import SwiftUI

struct BuildingList: View {
    @Environment(AppModel.self) private var model

    private var categories: [(String, [BuildingSummary])] {
        Dictionary(grouping: model.buildings, by: \.category).sorted { $0.key < $1.key }
    }

    var body: some View {
        @Bindable var model = model
        List(selection: $model.selection) {
            ForEach(categories, id: \.0) { category, buildings in
                Section(category.isEmpty ? "Other" : category) {
                    ForEach(buildings) { building in
                        Label(building.name, systemImage: model.changedFiles.contains(building.file) ? "pencil.circle.fill" : "building.2")
                            .tag(building.file)
                    }
                }
            }
        }
        .accessibilityIdentifier("building-list")
        .navigationSplitViewColumnWidth(min: 220, ideal: 260)
    }
}
```

`HoursDetailView.swift`:

```swift
import DataEditorKit
import SwiftUI

struct HoursDetailView: View {
    @Environment(AppModel.self) private var model
    let document: HoursDocument

    var body: some View {
        Form {
            if !model.problems.isEmpty || !model.buildProblems.isEmpty {
                Section {
                    ForEach(Array((model.problems + model.buildProblems).enumerated()), id: \.offset) { _, problem in
                        Label {
                            VStack(alignment: .leading) {
                                Text(problem.message)
                                if let path = problem.path { Text(path.map(\.description).joined(separator: " › ")).font(.caption).foregroundStyle(.secondary) }
                            }
                        } icon: { Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange) }
                    }
                } header: { Text("Problems") }
                .accessibilityIdentifier("problems")
            }

            Section("This week") { WeekTimeline(services: document.services) }

            ScheduleSection(title: "Usual hours", editor: ScheduleEditor(base: ["schedule"], services: document.services))

            Section("Exceptions") {
                ForEach(Array(document.exceptions.enumerated()), id: \.offset) { index, exception in
                    DisclosureGroup(exception.date) {
                        ScheduleSection(title: nil, editor: ScheduleEditor(base: ["exceptions", .index(index), "schedule"], services: exception.services))
                        Button("Remove this exception", role: .destructive) { Task { await model.apply([.delete(["exceptions", .index(index)])]) } }
                    }
                }
                AddExceptionButton(count: document.exceptions.count)
            }

            BreaksSection(document: document)
        }
        .formStyle(.grouped)
        .navigationTitle(document.name)
        .navigationSubtitle(document.category)
    }
}

private struct AddExceptionButton: View {
    @Environment(AppModel.self) private var model
    let count: Int
    @State private var date = Date.now

    var body: some View {
        HStack {
            DatePicker("New exception", selection: $date, displayedComponents: .date)
            Button("Add") {
                let day = date.formatted(.iso8601.year().month().day())
                Task {
                    await model.apply([.set(["exceptions", .index(count)], .object([
                        "date": .string(day),
                        "schedule": .array([.object(["title": .string("Hours"), "isPhysicallyOpen": .bool(false), "hours": .array([])])]),
                    ]))])
                }
            }
        }
    }
}

private struct BreaksSection: View {
    @Environment(AppModel.self) private var model
    let document: HoursDocument

    var body: some View {
        Section("Breaks") {
            ForEach(model.calendar?.breaks ?? []) { item in
                let entry = document.breakSchedule[item.key]
                let path: [PathKey] = ["breakSchedule", .key(item.key)]
                VStack(alignment: .leading) {
                    Picker("\(item.name) (\(item.start) to \(item.end))", selection: Binding<String>(
                        get: {
                            switch entry {
                            case .template(let name)?: "template:\(name)"
                            case .custom?: "custom"
                            case .other?: "other"
                            case nil: "usual"
                            }
                        },
                        set: { choice in
                            Task {
                                if choice == "usual" { await model.apply([.delete(path)]) }
                                else if choice == "custom" {
                                    await model.apply([.set(path, .array([.object(["title": .string("Hours"), "isPhysicallyOpen": .bool(false), "hours": .array([])])]))])
                                } else if choice.hasPrefix("template:") {
                                    await model.apply([.set(path, .string(String(choice.dropFirst("template:".count))))])
                                }
                            }
                        }
                    )) {
                        Text("The break's default").tag("usual")
                        ForEach(item.templates + (model.calendar?.templates ?? []), id: \.self) { name in Text(name).tag("template:\(name)") }
                        Text("Hours of its own").tag("custom")
                        if case .other? = entry { Text("Set in the file").tag("other") }
                    }
                    if case .custom(let services)? = entry {
                        ScheduleSection(title: nil, editor: ScheduleEditor(base: path, services: services))
                    }
                }
            }
        }
    }
}
```

`ScheduleSection.swift`:

```swift
import DataEditorKit
import SwiftUI

/// The services of one schedule, each with its rows, editable.
struct ScheduleSection: View {
    @Environment(AppModel.self) private var model
    let title: String?
    let editor: ScheduleEditor

    private func apply(_ ops: EditOp...) { Task { await model.apply(ops) } }

    var body: some View {
        ForEach(Array(editor.services.enumerated()), id: \.offset) { s, service in
            Section {
                TextField("Title", text: Binding(get: { service.title }, set: { apply(editor.setTitle(service: s, $0)) }))
                TextField("Notes", text: Binding(get: { service.notes ?? "" }, set: { apply(editor.setNotes(service: s, $0)) }), axis: .vertical)
                Toggle("Closed", isOn: Binding(get: { service.isPhysicallyOpen == false && service.rows.isEmpty },
                                              set: { closed in Task { await model.apply(editor.setClosed(service: s, closed)) } }))
                ForEach(Array(service.rows.enumerated()), id: \.offset) { r, row in
                    RowEditor(row: row, service: s, index: r, editor: editor)
                }
                HStack {
                    Button("Add hours", systemImage: "plus") { apply(editor.addRow(service: s)) }
                        .accessibilityIdentifier("add-row-\(s)")
                    Spacer()
                    if let remove = editor.removeService(s) {
                        Button("Remove \(service.title.isEmpty ? "service" : service.title)", role: .destructive) { apply(remove) }
                    }
                }
            } header: {
                Text(s == 0 ? (title ?? service.title) : service.title)
            }
        }
        Button("Add a service", systemImage: "plus.rectangle.on.rectangle") { apply(editor.addService(title: "New service")) }
    }
}

private struct RowEditor: View {
    @Environment(AppModel.self) private var model
    let row: HoursRow
    let service: Int
    let index: Int
    let editor: ScheduleEditor

    var body: some View {
        HStack {
            ForEach(Weekday.allCases, id: \.self) { day in
                Toggle(day.label, isOn: Binding(
                    get: { row.days.contains(day) },
                    set: { on in
                        let days = on ? row.days + [day] : row.days.filter { $0 != day }
                        if !days.isEmpty { Task { await model.apply([editor.setDays(service: service, row: index, days)]) } }
                    }
                ))
                .toggleStyle(.button)
            }
            Spacer()
            TimePicker(text: row.fromText, identifier: "row-time-from-\(service)-\(index)") { time in
                Task { await model.apply([editor.setTime(service: service, row: index, end: .from, time)]) }
            }
            Text("to")
            TimePicker(text: row.toText, identifier: "row-time-to-\(service)-\(index)") { time in
                Task { await model.apply([editor.setTime(service: service, row: index, end: .to, time)]) }
            }
            if let to = row.to, let from = row.from, to <= from, to.minutes != 0 {
                Text("next day").font(.caption).foregroundStyle(.secondary)
            }
            Button("Remove", systemImage: "minus.circle") { Task { await model.apply([editor.removeRow(service: service, row: index)]) } }
                .labelStyle(.iconOnly)
        }
    }
}

/// Every quarter hour, plus the file's own value if it is between them.
private struct TimePicker: View {
    let text: String
    let identifier: String
    let set: (ClockTime) -> Void

    private var options: [ClockTime] {
        guard let current = ClockTime(text), !ClockTime.quarterHours.contains(current) else { return ClockTime.quarterHours }
        return (ClockTime.quarterHours + [current]).sorted()
    }

    var body: some View {
        Picker("", selection: Binding(get: { ClockTime(text) ?? ClockTime(minutes: 0) }, set: set)) {
            ForEach(options, id: \.self) { Text($0.text).tag($0) }
        }
        .labelsHidden()
        .fixedSize()
        .accessibilityIdentifier(identifier)
    }
}
```

`WeekTimeline.swift`:

```swift
import DataEditorKit
import SwiftUI

/// The week at a glance: one line per day, one lane per service.
struct WeekTimeline: View {
    let services: [Service]
    private let colors: [Color] = [.accentColor, .orange, .green, .purple, .pink, .teal]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(Weekday.allCases, id: \.self) { day in
                HStack(spacing: 8) {
                    Text(day.label).font(.caption.monospaced()).frame(width: 32, alignment: .leading)
                    GeometryReader { geometry in
                        ZStack(alignment: .topLeading) {
                            RoundedRectangle(cornerRadius: 3).fill(.quaternary)
                            ForEach(Array(services.enumerated()), id: \.offset) { lane, service in
                                ForEach(service.rows.flatMap { $0.segments() }.filter { $0.day == day }, id: \.self) { segment in
                                    let width = geometry.size.width
                                    let laneHeight = geometry.size.height / CGFloat(max(services.count, 1))
                                    RoundedRectangle(cornerRadius: 2)
                                        .fill(colors[lane % colors.count])
                                        .frame(width: width * CGFloat(segment.end - segment.start) / 1440, height: laneHeight - 1)
                                        .offset(x: width * CGFloat(segment.start) / 1440, y: CGFloat(lane) * laneHeight)
                                        .help("\(service.title): \(ClockTime(minutes: segment.start).text) to \(ClockTime(minutes: segment.end).text)")
                                }
                            }
                        }
                    }
                    .frame(height: 14)
                }
            }
            HStack {
                ForEach(Array(services.enumerated()), id: \.offset) { lane, service in
                    Label(service.title, systemImage: "circle.fill").foregroundStyle(colors[lane % colors.count]).font(.caption)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("The week's hours")
    }
}
```

`ServerStatusView.swift`:

```swift
import DataEditorKit
import SwiftUI

/// Whether the phone can preview the edits, and how to point it here.
struct ServerStatusView: View {
    @Environment(AppModel.self) private var model
    @State private var showing = false

    private var summary: (String, Color) {
        switch model.cccStatus {
        case .running: ("Preview on", .green)
        case .starting: ("Starting preview…", .yellow)
        case .portInUse: ("Port 8787 is in use", .red)
        case .crashed: ("Preview stopped", .red)
        case .stopped: ("Preview off", .secondary)
        }
    }

    var body: some View {
        Button { showing.toggle() } label: {
            Label(summary.0, systemImage: "circle.fill").foregroundStyle(summary.1)
        }
        .accessibilityIdentifier("server-status")
        .popover(isPresented: $showing) {
            VStack(alignment: .leading, spacing: 12) {
                Text("See your edits on your phone").font(.headline)
                Text("""
                1. Make sure your phone is on the same Wi-Fi as this Mac.
                2. In All About Olaf, turn on dev mode from the notice on the Home screen.
                3. Go to Developer → Server URL and choose “ccc-server edu.stolaf (\(Host.current().localizedName ?? "this Mac"))”.
                4. Pull to refresh the hours.
                """)
                if model.cccStatus == .portInUse {
                    Text("Something else on this Mac is using port 8787, probably another copy of ccc-server. Quit it, then start the preview again.").foregroundStyle(.red)
                }
                if case .crashed = model.cccStatus {
                    Button("Start the preview again") { Task { await model.restartCcc() } }
                }
                if let origin = model.pagesOrigin { Text("Serving data at \(origin)").font(.caption).textSelection(.enabled) }
                DisclosureGroup("Log") {
                    ScrollView { Text(model.cccLog.suffix(40).joined(separator: "\n")).font(.caption.monospaced()).textSelection(.enabled) }
                        .frame(height: 160)
                }
            }
            .padding()
            .frame(width: 420)
        }
    }
}
```

- [ ] **Step 4: Run the UI tests**

Run: `TEST_RUNNER_DATA_EDITOR_NODE="$(mise which node)" xcodebuild test -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor -destination 'platform=macOS,arch=arm64' -only-testing:DataEditorUITests/HoursEditorUITests`
Expected: PASS.

- [ ] **Step 5: Try it by hand**

Run the app from Xcode with the three UI-test launch arguments set in the scheme (Edit Scheme → Run → Arguments, disabled by default). Check by eye that a time can be changed, a row added and a day toggled; that the timeline follows each change; and that typing an invalid note such as an empty title shows a problem. Remove the arguments from the scheme afterwards.

- [ ] **Step 6: Commit**

```bash
git add macos/DataEditor
git commit -m "Edit a building's hours, exceptions and break schedules"
```

### Task 14: Changes, submitting, and the data browser

**Files:**
- Create: `macos/DataEditor/DataEditor/ChangesView.swift`, `SubmitSheet.swift`, `DataBrowserView.swift` (removing the stubs from `ContentView.swift`)
- Test: `macos/DataEditor/DataEditorUITests/ChangesUITests.swift`

**Interfaces:**
- Consumes: `AppModel.diff(for:)`, `revert`, `submit`, `submission`, `submissionState`, `tokens`, `githubClientID` (Task 12); `DeviceFlow` (Task 10); `cccLocalBase` (Task 9)

- [ ] **Step 1: Register the GitHub OAuth App (maintainer)**

A StoDevX owner opens github.com → StoDevX → Settings → Developer settings → OAuth Apps → New OAuth App:
- Name: "All About Olaf Data Editor"
- Homepage URL and Authorization callback URL: `https://github.com/StoDevX/AAO-React-Native`
- Check "Enable Device Flow"

Put the Client ID (it is not a secret) in the app target's `DATA_EDITOR_GITHUB_CLIENT_ID` build setting. Do not generate a client secret; the device flow does not use one.

- [ ] **Step 2: Write the failing UI test**

`macos/DataEditor/DataEditorUITests/ChangesUITests.swift`:

```swift
import XCTest

final class ChangesUITests: XCTestCase {
    func testRevertingAChangeEmptiesTheList() throws {
        let app = try HoursEditorUITests.launchWithRepoData()
        app.outlines["building-list"].staticTexts["The Cage"].click()
        let to = app.popUpButtons["row-time-to-0-0"]
        XCTAssertTrue(to.waitForExistence(timeout: 10))
        to.click()
        app.menuItems["9:00pm"].click()

        app.buttons["Changes"].click()
        let file = app.staticTexts["building-hours/1-1-cage.yaml"]
        XCTAssertTrue(file.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["+       - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '9:00pm'}"].exists)
        app.buttons["revert-building-hours/1-1-cage.yaml"].click()
        XCTAssertTrue(app.staticTexts["No changes yet"].waitForExistence(timeout: 5))
    }
}
```

Make `launch()` in `HoursEditorUITests` a `static func launchWithRepoData() throws -> XCUIApplication`, and have its two tests call it. If The Cage's first row is not `[Mo, Tu, We, Th, Fr]` in the current data, change the expected line to match the file.

- [ ] **Step 3: Run it to verify it fails**

Run: `TEST_RUNNER_DATA_EDITOR_NODE="$(mise which node)" xcodebuild test -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor -destination 'platform=macOS,arch=arm64' -only-testing:DataEditorUITests/ChangesUITests`
Expected: FAIL, because the file name is not found and the stub is shown instead.

- [ ] **Step 4: Implement**

`ChangesView.swift`:

```swift
import DataEditorKit
import SwiftUI

struct ChangesView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var submitting = false

    var body: some View {
        VStack(alignment: .leading) {
            if let submission = model.submission {
                SubmissionBanner(submission: submission)
            }
            if model.newerCommit != nil, model.submissionState != .merged {
                HStack {
                    Label("Newer data is available. Your edits will be kept.", systemImage: "arrow.down.circle")
                    Spacer()
                    Button("Update") { Task { await model.updateWorkspace() } }
                }
                .padding(.horizontal)
            }
            ForEach(model.conflicts, id: \.self) { file in
                HStack {
                    Label("\(file) changed on GitHub too. Which version should stay?", systemImage: "exclamationmark.2")
                    Spacer()
                    Button("Mine") { Task { await model.keepMine(file) } }
                    Button("GitHub's") { Task { await model.keepLatest(file) } }
                }
                .padding(.horizontal)
            }
            if model.changedFiles.isEmpty {
                ContentUnavailableView("No changes yet", systemImage: "checkmark.circle")
            } else {
                List {
                    ForEach(model.changedFiles, id: \.self) { file in
                        Section {
                            DiffView(lines: model.diff(for: file))
                        } header: {
                            HStack {
                                Text(file)
                                Spacer()
                                Button("Revert", role: .destructive) { Task { await model.revert(file) } }
                                    .accessibilityIdentifier("revert-\(file)")
                            }
                        }
                    }
                }
            }
            HStack {
                Button("Close") { dismiss() }.keyboardShortcut(.cancelAction)
                Spacer()
                Button(model.submissionState == .open || model.submissionState == .changesRequested ? "Update Pull Request…" : "Submit for Review…") { submitting = true }
                    .disabled(model.changedFiles.isEmpty || !model.conflicts.isEmpty || !model.problems.isEmpty || !model.buildProblems.isEmpty)
                    .keyboardShortcut(.defaultAction)
            }
            .padding()
        }
        .frame(minWidth: 640, minHeight: 480)
        .sheet(isPresented: $submitting) { SubmitSheet() }
        .task { await model.refreshSubmission() }
    }
}

private struct DiffView: View {
    let lines: [DiffLine]
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
                if line.kind != .same {
                    Text((line.kind == .added ? "+ " : "- ") + line.text)
                        .font(.body.monospaced())
                        .foregroundStyle(line.kind == .added ? .green : .red)
                        .textSelection(.enabled)
                }
            }
        }
    }
}

private struct SubmissionBanner: View {
    @Environment(AppModel.self) private var model
    let submission: Submission

    var body: some View {
        HStack {
            switch model.submissionState {
            case .merged?:
                Label("Pull request #\(submission.number) was merged.", systemImage: "checkmark.seal.fill").foregroundStyle(.green)
                Spacer()
                Button("Get the Latest Data") { Task { await model.updateWorkspace() } }
            case .changesRequested?:
                Label("A reviewer asked for changes on #\(submission.number).", systemImage: "text.bubble")
                Spacer()
                Link("Read the review", destination: submission.url)
            case .closed?:
                Label("Pull request #\(submission.number) was closed without merging.", systemImage: "xmark.circle")
                Spacer()
                Link("See why", destination: submission.url)
            default:
                Label("Pull request #\(submission.number) is waiting for review.", systemImage: "clock")
                Spacer()
                Link("Open on GitHub", destination: submission.url)
            }
        }
        .padding()
    }
}
```

`SubmitSheet.swift`:

```swift
import DataEditorKit
import SwiftUI

struct SubmitSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @State private var summary = ""
    @State private var code: DeviceFlow.DeviceCode?
    @State private var working = false
    @State private var error: String?

    var body: some View {
        Form {
            if model.githubClientID.isEmpty {
                Text("This copy of the Data Editor was built without a GitHub sign-in, so it cannot submit changes.").foregroundStyle(.red)
            }
            TextField("What changed?", text: $summary, prompt: Text("Close The Cage at 9 p.m. on Fridays"))
            if let code {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Sign in to GitHub").font(.headline)
                    Text("Enter this code on the page that opened:")
                    Text(code.userCode).font(.title.monospaced()).textSelection(.enabled)
                    Button("Open github.com/login/device") { openURL(code.verificationURL) }
                }
            }
            if let error { Text(error).foregroundStyle(.red) }
        }
        .formStyle(.grouped)
        .frame(width: 460)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            ToolbarItem(placement: .confirmationAction) {
                Button(working ? "Submitting…" : "Submit") { Task { await submit() } }
                    .disabled(summary.trimmingCharacters(in: .whitespaces).isEmpty || working || model.githubClientID.isEmpty)
            }
        }
    }

    private func submit() async {
        working = true
        defer { working = false }
        error = nil
        do {
            if model.tokens.read() == nil { try await signIn() }
            do {
                try await model.submit(summary: summary)
            } catch SubmitError.signInRequired {
                try await signIn()
                try await model.submit(summary: summary)
            }
            dismiss()
        } catch SubmitError.missingBaseCommit {
            error = "GitHub is still setting up your copy of the repository. Try again in a minute."
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func signIn() async throws {
        let flow = DeviceFlow(clientID: model.githubClientID)
        let code = try await flow.start()
        self.code = code
        openURL(code.verificationURL)
        model.tokens.write(try await flow.token(for: code))
        self.code = nil
    }
}
```

`DataBrowserView.swift`:

```swift
import DataEditorKit
import SwiftUI

/// Any St. Olaf route, from the local Worker and from production, side by side.
struct DataBrowserView: View {
    @State private var route = "spaces/hours"
    @State private var local = ""
    @State private var production = ""

    private static let productionBase = URL(string: "https://stolaf.frogpond.tech/v1/")!

    var body: some View {
        VStack {
            HStack {
                TextField("Route", text: $route).onSubmit { Task { await load() } }
                Button("Load") { Task { await load() } }.keyboardShortcut(.defaultAction)
            }
            .padding([.horizontal, .top])
            HSplitView {
                Pane(title: "This Mac", text: local)
                Pane(title: "Production", text: production)
            }
        }
        .frame(minWidth: 900, minHeight: 500)
        .task { await load() }
    }

    private func load() async {
        let path = route.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
        async let a = fetch(cccLocalBase.appending(path: path))
        async let b = fetch(Self.productionBase.appending(path: path))
        (local, production) = await (a, b)
    }

    private func fetch(_ url: URL) async -> String {
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let pretty = (try? JSONSerialization.jsonObject(with: data))
                .flatMap { try? JSONSerialization.data(withJSONObject: $0, options: [.prettyPrinted, .sortedKeys]) }
                .map { String(decoding: $0, as: UTF8.self) } ?? String(decoding: data, as: UTF8.self)
            return "\(status) \(response.url?.absoluteString ?? url.absoluteString)\n\n\(pretty)"
        } catch {
            return "\(url.absoluteString)\n\n\(error.localizedDescription)"
        }
    }

    private struct Pane: View {
        let title: String
        let text: String
        var body: some View {
            VStack(alignment: .leading) {
                Text(title).font(.headline)
                ScrollView([.vertical, .horizontal]) {
                    Text(text).font(.caption.monospaced()).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding()
        }
    }
}
```

The diff rows are prefixed `+ ` and `- ` plus the file's own indentation. Make the UI test's expected text match `DiffView`'s output exactly: `"+ " + "      - {days: …}"`.

- [ ] **Step 5: Run the tests**

Run: `TEST_RUNNER_DATA_EDITOR_NODE="$(mise which node)" xcodebuild test -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor -destination 'platform=macOS,arch=arm64'`
Expected: PASS.

- [ ] **Step 6: Submit for real once, against a fork**

With a real client ID, change an hours file and submit from your own GitHub account. Check that the PR appears on StoDevX/AAO-React-Native from `<you>:data-editor/…`, with only that file changed and the base commit as its parent. Submit again and check that a second commit lands on the same PR. Close the PR afterwards.

- [ ] **Step 7: Commit**

```bash
git add macos/DataEditor
git commit -m "Review, revert and submit changes, and browse the local Worker's data"
```

---

## Part E: shipping

### Task 15: Bundle the runtime into the app

**Files:**
- Create: `macos/DataEditor/ccc-server.ref`, `macos/DataEditor/scripts/embed-runtime.sh`, `macos/DataEditor/Runtime.entitlements`
- Modify: the Xcode target (a Run Script phase), `mise.toml` (`[tasks."data-editor:runtime"]`)
- Test: `macos/DataEditor/e2e/preview.test.mjs`

**Interfaces:**
- Consumes: the helper bundle (Task 7); the ccc-server change (Tasks 1–3, merged)
- Produces: `macos/DataEditor/build/runtime/{node, helper/, ccc/}`, copied to `DataEditor.app/Contents/Resources/Runtime/`

- [ ] **Step 1: Write the failing end-to-end test**

`macos/DataEditor/e2e/preview.test.mjs`:

```js
// The whole preview path: the helper edits and builds, ccc-server serves the
// edit. Needs CCC_ROOT, a ccc-server checkout with `npm ci` done, at the
// commit in ../ccc-server.ref. Run: CCC_ROOT=… node --test macos/DataEditor/e2e/preview.test.mjs

import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {cp, mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {createInterface} from 'node:readline'
import {after, before, describe, it} from 'node:test'
import {setTimeout as sleep} from 'node:timers/promises'
import {DATA_BASE, REPO_ROOT} from '../../../scripts/paths.mjs'

const CCC_ROOT = process.env['CCC_ROOT']
const PORT = 8790
const ORIGIN = `http://127.0.0.1:${PORT}/`

describe('previewing an edit through ccc-server', {skip: !CCC_ROOT && 'CCC_ROOT is not set'}, () => {
	let helper
	let ccc
	let lines
	let id = 0
	const call = async (method, params = {}) => {
		helper.stdin.write(`${JSON.stringify({id: ++id, method, params})}\n`)
		let reply = JSON.parse((await lines.next()).value)
		assert.equal(reply.error, undefined, JSON.stringify(reply.error))
		return reply.result
	}

	before(async () => {
		let ws = await mkdtemp(path.join(tmpdir(), 'preview-'))
		await cp(DATA_BASE, path.join(ws, 'data'), {recursive: true})
		helper = spawn(process.execPath, [
			path.join(REPO_ROOT, 'scripts/data-editor-helper.mjs'),
			'--data',
			path.join(ws, 'data'),
			'--out',
			path.join(ws, 'out'),
		])
		lines = createInterface({input: helper.stdout})[Symbol.asyncIterator]()
		ccc = spawn(process.execPath, ['source/dev/index.ts'], {
			cwd: CCC_ROOT,
			env: {...process.env, PAGES_ORIGIN_OVERRIDE: ORIGIN, CCC_PERSIST_TO: path.join(ws, 'ccc')},
			stdio: 'inherit',
		})
		for (let i = 0; i < 120; i++) {
			if (await fetch('http://localhost:8787/').then((r) => r.ok, () => false)) return
			await sleep(500)
		}
		throw new Error('ccc-server did not start')
	})
	after(() => {
		helper?.stdin.end()
		ccc?.kill('SIGTERM')
	})

	it('serves the edited hours', async () => {
		let {problems} = await call('edit', {
			file: 'building-hours/1-1-cage.yaml',
			ops: [{path: ['schedule', 0, 'hours', 0, 'to'], value: '11:45pm'}],
		})
		assert.deepEqual(problems, [])
		assert.deepEqual(await call('build'), {ok: true})
		await call('serve', {port: PORT})
		let hours = await (await fetch('http://localhost:8787/edu.stolaf/v1/spaces/hours?breaks=none')).json()
		assert.match(JSON.stringify(hours), /11:45pm/u)
	})

	it('redirects a data file to the Mac', async () => {
		let response = await fetch('http://localhost:8787/edu.stolaf/v1/transit/bus', {redirect: 'manual'})
		assert.equal(response.headers.get('location'), `${ORIGIN}bus-times.json`)
	})
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `git clone https://github.com/frog-pond/ccc-server /tmp/ccc && (cd /tmp/ccc && git checkout <the merge commit from Task 3> && npm ci)`, then `CCC_ROOT=/tmp/ccc node --test macos/DataEditor/e2e/preview.test.mjs`.
Expected: PASS if Parts A and B are complete. Then check that the test really exercises the change: run it against a ccc commit from before Task 1, and it should fail on the redirect. If it passes there, the test is not reaching the new code; fix the test.

- [ ] **Step 3: Write the embed script**

`macos/DataEditor/ccc-server.ref`: one line, the ccc-server merge commit SHA from Task 3.

`macos/DataEditor/Runtime.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<!-- V8 in Node and workerd compiles JavaScript at run time -->
	<key>com.apple.security.cs.allow-jit</key>
	<true/>
	<key>com.apple.security.cs.allow-unsigned-executable-memory</key>
	<true/>
	<!-- native addons in node_modules are signed by us, but loaded by a binary Node built -->
	<key>com.apple.security.cs.disable-library-validation</key>
	<true/>
</dict>
</plist>
```

`macos/DataEditor/scripts/embed-runtime.sh`:

```bash
#!/usr/bin/env bash
# Builds macos/DataEditor/build/runtime: Node, the helper bundle, and a
# ccc-server checkout with its dependencies, all for arm64 macOS.
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "$here/../.." && pwd)"
out="$here/build/runtime"
node_version="$(sed -nE 's/^node = "([0-9.]+)"$/\1/p' "$repo/mise.toml")"
ccc_ref="$(tr -d '[:space:]' < "$here/ccc-server.ref")"

rm -rf "$out"
mkdir -p "$out"

# Node, checked against the release's published checksums
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
tarball="node-v$node_version-darwin-arm64.tar.gz"
curl -fsSL "https://nodejs.org/dist/v$node_version/$tarball" -o "$work/$tarball"
curl -fsSL "https://nodejs.org/dist/v$node_version/SHASUMS256.txt" -o "$work/SHASUMS256.txt"
(cd "$work" && grep " $tarball\$" SHASUMS256.txt | shasum -a 256 -c -)
tar -xzf "$work/$tarball" -C "$work"
cp "$work/node-v$node_version-darwin-arm64/bin/node" "$out/node"

# the helper
node "$repo/scripts/build-data-editor-helper.mjs"
cp -R "$here/build/helper" "$out/helper"

# ccc-server at the pinned commit
git clone --quiet https://github.com/frog-pond/ccc-server "$out/ccc"
git -C "$out/ccc" checkout --quiet "$ccc_ref"
(cd "$out/ccc" && PATH="$out:$PATH" npm ci --no-audit --no-fund)
rm -rf "$out/ccc/.git"

echo "runtime -> $out ($(du -sh "$out" | cut -f1))"
```

Make it executable. Add to `mise.toml`:

```toml
[tasks."data-editor:runtime"]
description = "Build the Mac data editor's bundled Node, helper and ccc-server"
wait_for = ["pnpm:install:*"]
run = "macos/DataEditor/scripts/embed-runtime.sh"
```

- [ ] **Step 4: Copy the runtime into the app in a Run Script phase**

In the DataEditor target, add a Run Script build phase after "Copy Bundle Resources", named "Embed Runtime":

```bash
set -euo pipefail
runtime="$SRCROOT/build/runtime"
if [ ! -x "$runtime/node" ]; then
  echo "error: run \`mise run data-editor:runtime\` first" >&2
  exit 1
fi
rsync -a --delete "$runtime/" "$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/Runtime/"
```

Input file: `$(SRCROOT)/build/runtime/node`. Output file: `$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/Runtime/node`.

- [ ] **Step 5: Run the bundled app by hand**

Run `mise run data-editor:runtime`, build and run in Xcode, then:

1. On first launch, the app downloads the data. macOS asks whether `node` may accept incoming network connections: allow it.
2. The toolbar shows "Preview on" within about 20 seconds.
3. Change a time at The Cage. On a phone on the same Wi-Fi, with dev mode on and Developer → Server URL set to this Mac, pull to refresh: the new time shows.
4. Open the Data Browser on `spaces/hours`: the "This Mac" column has the edit and the Production column does not.

Note each result in the PR description.

- [ ] **Step 6: Commit**

```bash
git add macos/DataEditor/ccc-server.ref macos/DataEditor/scripts/embed-runtime.sh macos/DataEditor/Runtime.entitlements macos/DataEditor/e2e macos/DataEditor/DataEditor.xcodeproj mise.toml
git commit -m "Bundle Node, the helper and ccc-server into the data editor"
```

### Task 16: Sign, notarize, release and update

**Files:**
- Create: `macos/DataEditor/scripts/sign-and-notarize.sh`, `.github/workflows/data-editor.yml`
- Modify: the Xcode project (Sparkle package, Check for Updates menu item), `macos/DataEditor/DataEditor/Info.plist` (`SUFeedURL`, `SUPublicEDKey`), `macos/DataEditor/DataEditor/DataEditorApp.swift`

**Interfaces:**
- Consumes: the runtime (Task 15)
- Produces: releases tagged `data-editor-v<version>` with `DataEditor-<version>.zip`, and an appcast at `https://github.com/StoDevX/AAO-React-Native/releases/download/data-editor-appcast/appcast.xml`

- [ ] **Step 1: Set up the secrets (maintainer)**

In the repo's Actions secrets:
- `DATA_EDITOR_CERT_P12` (base64) and `DATA_EDITOR_CERT_PASSWORD`: a "Developer ID Application" certificate for team NFMTHAZVS9.
- `DATA_EDITOR_NOTARY_KEY` (the `.p8`, base64), `DATA_EDITOR_NOTARY_KEY_ID` and `DATA_EDITOR_NOTARY_ISSUER`: an App Store Connect API key with the Developer role.
- `DATA_EDITOR_SPARKLE_KEY`: the private EdDSA key printed by Sparkle's `generate_keys -x private.key`. Put the public key it prints into Info.plist as `SUPublicEDKey`.
- Repository variable `DATA_EDITOR_GITHUB_CLIENT_ID`: the client ID from Task 14.

Create the release that holds the appcast once: `gh release create data-editor-appcast --title "Data Editor appcast" --notes "Sparkle's update feed for the Data Editor." --prerelease`.

- [ ] **Step 2: Add Sparkle**

File → Add Package Dependencies → `https://github.com/sparkle-project/Sparkle`, Up to Next Major from the latest 2.x release. Add `Sparkle` to the app target. In Info.plist:

```xml
	<key>SUFeedURL</key>
	<string>https://github.com/StoDevX/AAO-React-Native/releases/download/data-editor-appcast/appcast.xml</string>
	<key>SUPublicEDKey</key>
	<string>(the public key from Step 1)</string>
```

In `DataEditorApp.swift`:

```swift
import Sparkle
import SwiftUI

@main
struct DataEditorApp: App {
    @State private var model = AppModel()
    private let updater = SPUStandardUpdaterController(startingUpdater: true, updaterDelegate: nil, userDriverDelegate: nil)

    var body: some Scene {
        WindowGroup("Data Editor") {
            ContentView()
                .environment(model)
                .task { await model.launch() }
        }
        .commands {
            CommandGroup(after: .appInfo) {
                Button("Check for Updates…") { updater.checkForUpdates(nil) }
            }
        }
        Window("Data Browser", id: "browser") {
            DataBrowserView().environment(model)
        }
    }
}
```

- [ ] **Step 3: Write the signing script**

`macos/DataEditor/scripts/sign-and-notarize.sh`:

```bash
#!/usr/bin/env bash
# Signs every binary inside the archived app, then the app; notarizes and staples it.
# usage: sign-and-notarize.sh <DataEditor.app> "<Developer ID Application: …>"
set -euo pipefail
app="$1"
identity="$2"
here="$(cd "$(dirname "$0")/.." && pwd)"
runtime="$app/Contents/Resources/Runtime"

# Mach-O files inside the runtime: node, workerd, esbuild and native addons.
find "$runtime" -type f \( -perm -u+x -o -name '*.node' -o -name '*.dylib' \) -print0 |
  while IFS= read -r -d '' file; do
    if file -b "$file" | grep -q 'Mach-O'; then
      codesign --force --timestamp --options runtime --entitlements "$here/Runtime.entitlements" --sign "$identity" "$file"
    fi
  done

codesign --force --timestamp --options runtime --sign "$identity" "$app"
codesign --verify --deep --strict --verbose=2 "$app"

zip="$(dirname "$app")/DataEditor.zip"
ditto -c -k --keepParent "$app" "$zip"
xcrun notarytool submit "$zip" --key "$NOTARY_KEY_PATH" --key-id "$NOTARY_KEY_ID" --issuer "$NOTARY_ISSUER" --wait
xcrun stapler staple "$app"
rm "$zip"
ditto -c -k --keepParent "$app" "$zip"
spctl --assess --type execute --verbose "$app"
echo "$zip"
```

- [ ] **Step 4: Write the workflow**

`.github/workflows/data-editor.yml`:

```yaml
name: Data Editor

on:
  pull_request:
    paths: ['macos/DataEditor/**', 'scripts/data-editor-*', 'scripts/build-data-editor-helper.*', 'scripts/schedule-data.ts', '.github/workflows/data-editor.yml']
  push:
    tags: ['data-editor-v*']

permissions:
  contents: read

env:
  xcode_version: 'Xcode_27.0'

jobs:
  preview:
    runs-on: ubuntu-26.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: jdx/mise-action@82a612c5ab8bcda7cc5db6b7e81a8e7584c3dc6e # v5.2.3
      - run: pnpm install --frozen-lockfile
      - run: node --test scripts/data-editor-*.test.mjs scripts/build-data-editor-helper.test.mjs
      - name: Check out ccc-server at the pinned commit
        run: |
          git clone --quiet https://github.com/frog-pond/ccc-server "$RUNNER_TEMP/ccc"
          git -C "$RUNNER_TEMP/ccc" checkout --quiet "$(tr -d '[:space:]' < macos/DataEditor/ccc-server.ref)"
          (cd "$RUNNER_TEMP/ccc" && npm ci --no-audit --no-fund)
      - run: node --test macos/DataEditor/e2e/preview.test.mjs
        env:
          CCC_ROOT: ${{ runner.temp }}/ccc

  app:
    runs-on: xcode-27
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - run: sudo xcode-select -s /Applications/${{ env.xcode_version }}.app
      - uses: jdx/mise-action@82a612c5ab8bcda7cc5db6b7e81a8e7584c3dc6e # v5.2.3
      - run: pnpm install --frozen-lockfile
      - run: swift test --package-path macos/DataEditor/DataEditorKit
      - run: TEST_RUNNER_DATA_EDITOR_NODE="$(mise which node)" xcodebuild test -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor -destination 'platform=macOS,arch=arm64' CODE_SIGNING_ALLOWED=NO

  release:
    if: startsWith(github.ref, 'refs/tags/data-editor-v')
    needs: [preview, app]
    runs-on: xcode-27
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - run: sudo xcode-select -s /Applications/${{ env.xcode_version }}.app
      - uses: jdx/mise-action@82a612c5ab8bcda7cc5db6b7e81a8e7584c3dc6e # v5.2.3
      - run: pnpm install --frozen-lockfile
      - run: mise run data-editor:runtime
      - name: Import the signing certificate
        env:
          CERT: ${{ secrets.DATA_EDITOR_CERT_P12 }}
          CERT_PASSWORD: ${{ secrets.DATA_EDITOR_CERT_PASSWORD }}
        run: |
          keychain="$RUNNER_TEMP/signing.keychain-db"
          security create-keychain -p "" "$keychain"
          security set-keychain-settings -lut 3600 "$keychain"
          security unlock-keychain -p "" "$keychain"
          echo "$CERT" | base64 --decode > "$RUNNER_TEMP/cert.p12"
          security import "$RUNNER_TEMP/cert.p12" -k "$keychain" -P "$CERT_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple: -s -k "" "$keychain"
          security list-keychains -d user -s "$keychain" $(security list-keychains -d user | tr -d '"')
      - name: Archive
        env:
          VERSION: ${{ github.ref_name }}
          CLIENT_ID: ${{ vars.DATA_EDITOR_GITHUB_CLIENT_ID }}
        run: |
          version="${VERSION#data-editor-v}"
          xcodebuild archive -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor \
            -archivePath "$RUNNER_TEMP/DataEditor.xcarchive" -destination 'generic/platform=macOS' \
            MARKETING_VERSION="$version" CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER" \
            DATA_EDITOR_GITHUB_CLIENT_ID="$CLIENT_ID" CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="Developer ID Application"
      - name: Sign and notarize
        env:
          NOTARY_KEY: ${{ secrets.DATA_EDITOR_NOTARY_KEY }}
          NOTARY_KEY_ID: ${{ secrets.DATA_EDITOR_NOTARY_KEY_ID }}
          NOTARY_ISSUER: ${{ secrets.DATA_EDITOR_NOTARY_ISSUER }}
        run: |
          export NOTARY_KEY_PATH="$RUNNER_TEMP/notary.p8"
          echo "$NOTARY_KEY" | base64 --decode > "$NOTARY_KEY_PATH"
          macos/DataEditor/scripts/sign-and-notarize.sh "$RUNNER_TEMP/DataEditor.xcarchive/Products/Applications/DataEditor.app" "Developer ID Application"
      - name: Publish the release and the appcast
        env:
          GH_TOKEN: ${{ github.token }}
          SPARKLE_KEY: ${{ secrets.DATA_EDITOR_SPARKLE_KEY }}
          VERSION: ${{ github.ref_name }}
        run: |
          version="${VERSION#data-editor-v}"
          dist="$RUNNER_TEMP/dist"
          mkdir -p "$dist"
          mv "$RUNNER_TEMP/DataEditor.xcarchive/Products/Applications/DataEditor.zip" "$dist/DataEditor-$version.zip"
          gh release create "$VERSION" "$dist/DataEditor-$version.zip" --title "Data Editor $version" --generate-notes
          sparkle="$(find ~/Library/Developer/Xcode/DerivedData -path '*/SourcePackages/artifacts/sparkle/Sparkle/bin' -type d | head -1)"
          gh release download data-editor-appcast --pattern appcast.xml --dir "$dist" || true
          echo "$SPARKLE_KEY" > "$RUNNER_TEMP/sparkle.key"
          "$sparkle/generate_appcast" --ed-key-file "$RUNNER_TEMP/sparkle.key" \
            --download-url-prefix "https://github.com/${GITHUB_REPOSITORY}/releases/download/$VERSION/" "$dist"
          gh release upload data-editor-appcast "$dist/appcast.xml" --clobber
```

After the first release, check the `generate_appcast` path. If `find` returns nothing, download the matching `Sparkle-<version>.tar.xz` from Sparkle's releases in this step instead and use its `bin/`.

- [ ] **Step 5: Check the workflow**

Run: `mise run lint:actions`
Expected: PASS. Fix whatever actionlint and zizmor report.

- [ ] **Step 6: Make a test release**

Push the branch and tag `data-editor-v0.1.0` on it. Then:
1. The release has `DataEditor-0.1.0.zip`.
2. On a Mac that has never seen the app, download it, unzip it and open it: no Gatekeeper warning.
3. `appcast.xml` on the `data-editor-appcast` release lists 0.1.0.
4. Tag `data-editor-v0.1.1`. Check for Updates in 0.1.0 offers 0.1.1 and installs it.

Delete the two test releases afterwards if they shouldn't stay.

- [ ] **Step 7: Commit, push, open the PR**

```bash
git add macos/DataEditor .github/workflows/data-editor.yml
git commit -m "Sign, notarize and release the data editor, with Sparkle updates"
git push -u origin mac-data-editor
```

Open a draft PR titled "Add a Mac app for editing the building hours", with the results of Task 13 Step 5, Task 14 Step 6, Task 15 Step 5 and Task 16 Step 6.
