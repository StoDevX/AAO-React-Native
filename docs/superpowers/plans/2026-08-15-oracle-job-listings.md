# Oracle Job Listings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Student Work screen by fetching listings from Oracle Recruiting Cloud's Candidate Experience REST API instead of ccc-server's dead `/jobs` endpoint.

**Architecture:** A new client-side module `@frogpond/ccc-jobs` resolves the jobs site through `@frogpond/data-sources`, builds Oracle `finder` queries against it, and parses the responses. Job descriptions are HTML with bold-labelled paragraphs; five labels become form rows and the rest converts to markdown for the native markdown renderer. Both screens are rewritten against the new types.

**Tech Stack:** TypeScript, React Native 0.86.2, expo-router, React Query 5, zod 4.4.3, htmlparser2 (via `@frogpond/html-lib`), `@expo/ui` 57.0.9 SwiftUI primitives, `@frogpond/markdown`, Jest.

**Spec:** `docs/superpowers/specs/2026-08-15-oracle-job-listings-design.md`

## Global Constraints

- Work in the `oracle-job-listings` worktree, on branch `oracle-job-listings`.
- Run `mise run agent:setup` once before starting; run `mise run agent:pre-commit` before every commit. Do not commit if any step fails. Never skip the pre-commit hook.
- TypeScript everywhere; no `any`.
- oxfmt style: tabs, single quotes, no semicolons. `let` over `const` for locals, matching surrounding code.
- Commit messages: imperative mood, capitalised, no trailing full stop, no conventional-commit prefix.
- No new `moment` imports. New date code uses `date-fns` 4.4.0.
- Never put a bare string in an `@expo/ui` `ReactNode` prop — it crashes at mount and neither tsc nor Jest catches it. Every string goes inside `<Text>`.
- `StyleSheet.create()` for all styles; no inline style objects.
- Oracle tenant base: `https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com`, site `CX_1`.

---

### Task 1: `htmlToMarkdown` in `@frogpond/html-lib`

Converts the description HTML to markdown for `@frogpond/markdown`. Lives in `html-lib` because that module already owns HTML parsing and the htmlparser2 DOM.

**Files:**
- Modify: `modules/html-lib/index.ts`
- Test: `modules/html-lib/__tests__/html-to-markdown.test.ts`

**Interfaces:**
- Consumes: `parseHtml` from `modules/html-lib/index.ts` (already exported)
- Produces: `htmlToMarkdown(html: string): string` and `nodeToMarkdown(node: AnyNode): string`, both exported from `@frogpond/html-lib`

- [ ] **Step 1: Write the failing test**

Create `modules/html-lib/__tests__/html-to-markdown.test.ts`:

```ts
import {htmlToMarkdown} from '../index'

describe('htmlToMarkdown', () => {
	test('a paragraph becomes a plain line', () => {
		expect(htmlToMarkdown('<p>Game operations staff.</p>')).toBe('Game operations staff.')
	})

	test('paragraphs are separated by a blank line', () => {
		expect(htmlToMarkdown('<p>One</p><p>Two</p>')).toBe('One\n\nTwo')
	})

	test('a font-weight:700 span becomes strong', () => {
		expect(htmlToMarkdown('<p><span style="font-weight:700">Wage Range:</span> $12.00</p>')).toBe(
			'**Wage Range:** $12.00',
		)
	})

	test('b and strong are bold too', () => {
		expect(htmlToMarkdown('<p><b>a</b> and <strong>b</strong></p>')).toBe('**a** and **b**')
	})

	// `<span style="font-weight:700">Classification: </span>` is how this data
	// actually arrives. Emphasis with a trailing space inside it is not
	// emphasis at all in markdown, so the space moves outside the markers.
	test('trailing space inside bold moves outside the markers', () => {
		expect(htmlToMarkdown('<p><span style="font-weight:700">Classification: </span>Student</p>')).toBe(
			'**Classification:** Student',
		)
	})

	test('an unordered list becomes dashes', () => {
		expect(htmlToMarkdown('<ul><li>One</li><li>Two</li></ul>')).toBe('- One\n- Two')
	})

	test('an ordered list is numbered from one', () => {
		expect(htmlToMarkdown('<ol><li>One</li><li>Two</li></ol>')).toBe('1. One\n2. Two')
	})

	test('a nested list is indented under its item', () => {
		expect(htmlToMarkdown('<ul><li>One<ul><li>Inner</li></ul></li></ul>')).toBe('- One\n\t- Inner')
	})

	test('a link keeps its href', () => {
		expect(htmlToMarkdown('<p>See <a href="https://stolaf.edu">the site</a></p>')).toBe(
			'See [the site](https://stolaf.edu)',
		)
	})

	test('an anchor with no href renders as its text', () => {
		expect(htmlToMarkdown('<p>See <a>the site</a></p>')).toBe('See the site')
	})

	test('br becomes a hard line break', () => {
		expect(htmlToMarkdown('<p>One<br>Two</p>')).toBe('One  \nTwo')
	})

	test('markdown punctuation in text is escaped', () => {
		expect(htmlToMarkdown('<p>Pay is 10*12 per _hour_ [really]</p>')).toBe(
			'Pay is 10\\*12 per \\_hour\\_ \\[really\\]',
		)
	})

	test('a line-leading dash is escaped so it is not a list', () => {
		expect(htmlToMarkdown('<p>- not a list</p>')).toBe('\\- not a list')
	})

	test('a line-leading number is escaped so it is not an ordered list', () => {
		expect(htmlToMarkdown('<p>1. not a list</p>')).toBe('1\\. not a list')
	})

	test('entities are decoded', () => {
		expect(htmlToMarkdown('<p>Ole&nbsp;&amp; Lena</p>')).toBe('Ole & Lena')
	})

	test('script and style bodies are dropped', () => {
		expect(htmlToMarkdown('<p>Text</p><script>alert(1)</script>')).toBe('Text')
	})

	test('empty input is an empty string', () => {
		expect(htmlToMarkdown('')).toBe('')
	})

	test('a div wrapper does not add a level of nesting', () => {
		expect(htmlToMarkdown('<div><p>One</p><p>Two</p></div>')).toBe('One\n\nTwo')
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest modules/html-lib/__tests__/html-to-markdown.test.ts`
Expected: FAIL — `htmlToMarkdown` is not exported from `../index`.

- [ ] **Step 3: Write the implementation**

`modules/html-lib/index.ts` already imports `parseDocument`, `isText`, `isTag`, `AnyNode`, `ChildNode` and defines `parseHtml`. Add `Element` to its `domhandler` import, and re-export `isTag` alongside the existing `export {textContent, cssSelect}` — Task 4's description parser needs it, and importing `domhandler` directly from `ccc-jobs` would give that module a second dependency on html-lib's internals.

Then append:

```ts
/// Markdown's inline punctuation. Escaped everywhere text appears, so a
/// posting that writes "10*12 per hour" doesn't render as emphasis.
const INLINE_PUNCTUATION = /([\\`*_[\]])/gu

function escapeInline(text: string): string {
	return text.replace(INLINE_PUNCTUATION, '\\$1')
}

/// Block-leading punctuation only means something at the start of a line, so
/// it's escaped there rather than inline -- otherwise every hyphen in prose
/// would grow a backslash.
function escapeBlockStart(text: string): string {
	if (/^\d+\./u.test(text)) {
		return text.replace('.', '\\.')
	}
	return text.replace(/^([#>+-])/u, '\\$1')
}

const BOLD_TAGS = new Set(['b', 'strong'])
const BOLD_STYLE = /font-weight:\s*(?:700|800|900|bold)/iu

function isBold(node: Element): boolean {
	if (BOLD_TAGS.has(node.name.toLowerCase())) return true
	return BOLD_STYLE.test(node.attribs['style'] ?? '')
}

const ITALIC_TAGS = new Set(['i', 'em'])
const ITALIC_STYLE = /font-style:\s*italic/iu

function isItalic(node: Element): boolean {
	if (ITALIC_TAGS.has(node.name.toLowerCase())) return true
	return ITALIC_STYLE.test(node.attribs['style'] ?? '')
}

/// Emphasis markers cannot sit against whitespace -- `**bold: **` is literal
/// asterisks, not bold. The padding moves outside the markers instead.
function emphasise(inner: string, marker: string): string {
	let trimmed = inner.trim()
	if (!trimmed) return inner

	let leading = inner.slice(0, inner.length - inner.trimStart().length)
	let trailing = inner.slice(inner.trimEnd().length)
	return `${leading}${marker}${trimmed}${marker}${trailing}`
}

function renderInline(nodes: ChildNode[]): string {
	let out = ''

	for (let node of nodes) {
		if (isText(node)) {
			out += escapeInline(node.data)
			continue
		}

		if (!isTag(node)) continue

		let tag = node.name.toLowerCase()
		if (tag === 'script' || tag === 'style') continue

		if (tag === 'br') {
			// Two trailing spaces: markdown's hard line break, which keeps the
			// break without starting a new paragraph.
			out += '  \n'
			continue
		}

		if (tag === 'a') {
			let href = node.attribs['href']
			let text = renderInline(node.children)
			out += href ? `[${text}](${href})` : text
			continue
		}

		let inner = renderInline(node.children)
		if (isBold(node)) {
			out += emphasise(inner, '**')
		} else if (isItalic(node)) {
			out += emphasise(inner, '_')
		} else {
			out += inner
		}
	}

	return out
}

const BLOCK_CONTAINERS = new Set(['p', 'div', 'section', 'article', 'header', 'footer'])

function renderList(list: Element, depth: number): string {
	let ordered = list.name.toLowerCase() === 'ol'
	let indent = '\t'.repeat(depth)
	let items: string[] = []

	for (let child of list.children) {
		if (!isTag(child) || child.name.toLowerCase() !== 'li') continue

		let marker = ordered ? `${items.length + 1}. ` : '- '
		// A nested list already carries its own indentation, so its blocks are
		// joined in as-is. A `<p>` sibling inside an `<li>` would not be
		// indented; these descriptions don't contain one.
		let [first = '', ...rest] = renderBlocks(child.children, depth + 1)
		items.push([`${indent}${marker}${first}`, ...rest].join('\n'))
	}

	return items.join('\n')
}

function renderBlocks(nodes: ChildNode[], depth: number): string[] {
	let out: string[] = []
	let pending: ChildNode[] = []

	let flush = (): void => {
		if (pending.length === 0) return

		let text = renderInline(pending).trim()
		pending = []
		if (text) out.push(escapeBlockStart(text))
	}

	for (let node of nodes) {
		if (isTag(node)) {
			let tag = node.name.toLowerCase()

			if (tag === 'ul' || tag === 'ol') {
				flush()
				let list = renderList(node, depth)
				if (list) out.push(list)
				continue
			}

			if (BLOCK_CONTAINERS.has(tag)) {
				flush()
				out.push(...renderBlocks(node.children, depth))
				continue
			}
		}

		pending.push(node)
	}

	flush()
	return out
}

export function nodeToMarkdown(node: AnyNode): string {
	let children = 'children' in node ? (node.children as ChildNode[]) : []
	return renderBlocks(children, 0).join('\n\n').trim()
}

export function htmlToMarkdown(html: string): string {
	return nodeToMarkdown(parseHtml(html))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest modules/html-lib`
Expected: PASS, including the module's existing suites.

- [ ] **Step 5: Commit**

```bash
mise run agent:pre-commit
git add modules/html-lib/index.ts modules/html-lib/__tests__/html-to-markdown.test.ts
git commit -m "Convert HTML to markdown in html-lib"
```

---

### Task 2: A jobs rel in the source manifest

**Files:**
- Modify: `modules/data-sources/types.ts`
- Modify: `modules/data-sources/index.ts`
- Modify: `data/sources.yaml`
- Test: `modules/data-sources/__tests__/resolve.test.ts`

**Interfaces:**
- Produces: `REL_JOBS` exported from `@frogpond/data-sources`; a manifest link with rel `https://frogpond.tech/rel/jobs`, id `stolaf`, type `application/vnd.oracle.recruiting-ce+json`

`modules/data-sources/bundled.json` and `docs/sources.json` are both generated from `data/sources.yaml` by `scripts/build-sources.mjs`. Edit the YAML only; `mise run bundle-data` (which `agent:pre-commit` runs) regenerates them.

- [ ] **Step 1: Write the failing test**

Append to `modules/data-sources/__tests__/resolve.test.ts`:

```ts
describe('the jobs source', () => {
	test('the bundled manifest carries the St. Olaf jobs site', () => {
		let source = resolveSource(bundled, REL_JOBS, 'stolaf', [
			'application/vnd.oracle.recruiting-ce+json',
		])

		expect(source.href).toBe(
			'https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1',
		)
		expect(source.type).toBe('application/vnd.oracle.recruiting-ce+json')
	})
})
```

Add `REL_JOBS` to the file's existing import from `../types` (or `../index`), and reuse however the file already gets at the bundled manifest — read the top of `resolve.test.ts` and follow it rather than inventing a new import.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest modules/data-sources`
Expected: FAIL — `REL_JOBS` is not exported.

- [ ] **Step 3: Add the rel and the manifest entry**

In `modules/data-sources/types.ts`, beside the other rels:

```ts
export const REL_JOBS = 'https://frogpond.tech/rel/jobs'
```

In `modules/data-sources/index.ts`, add `REL_JOBS` to the existing `./types` export block.

In `data/sources.yaml`, append to `links`:

```yaml
  - rel: https://frogpond.tech/rel/jobs
    href: 'https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1'
    type: application/vnd.oracle.recruiting-ce+json
    titles: {und: Student Work}
    properties: {'https://frogpond.tech/ns/id': stolaf}
```

- [ ] **Step 4: Regenerate and run tests**

Run: `cd .claude/worktrees/oracle-job-listings && mise run bundle-data && npx jest modules/data-sources`
Expected: PASS, and `git diff` shows the new link in both `modules/data-sources/bundled.json` and `docs/sources.json`.

- [ ] **Step 5: Commit**

```bash
mise run agent:pre-commit
git add modules/data-sources data/sources.yaml docs/sources.json
git commit -m "Add a jobs rel to the source manifest"
```

---

### Task 3: The `ccc-jobs` module, fixtures, and the requisitions parser

**Files:**
- Create: `modules/ccc-jobs/package.json`
- Create: `modules/ccc-jobs/types.ts`
- Create: `modules/ccc-jobs/parsers/requisitions.ts`
- Create: `modules/ccc-jobs/__tests__/fixtures/requisitions.json`
- Create: `modules/ccc-jobs/__tests__/fixtures/categories.json`
- Create: `modules/ccc-jobs/__tests__/requisitions.test.ts`

**Interfaces:**
- Produces:
  - `JobSummary {id: string; title: string; postedDate: string; location: string | undefined}`
  - `JobCategory {id: number; name: string; count: number; jobs: JobSummary[]}`
  - `JobField {label: string; value: string}`
  - `JobDetail {id, title, category, schedule, location, postedDate, fields: JobField[], body: string, url: string}`
  - `parseCategories(body: unknown): Array<{id: number; name: string; count: number}>`
  - `parseRequisitions(body: unknown): JobSummary[]`

- [ ] **Step 1: Capture the fixtures**

From the worktree root:

```bash
mkdir -p modules/ccc-jobs/__tests__/fixtures
BASE=https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmRestApi/resources/latest

curl -s --compressed -G "$BASE/recruitingCEJobRequisitions" \
  --data-urlencode 'onlyData=true' \
  --data-urlencode 'expand=categoriesFacet' \
  --data-urlencode 'finder=findReqs;siteNumber=CX_1,facetsList=CATEGORIES,limit=1' \
  | python3 -m json.tool > modules/ccc-jobs/__tests__/fixtures/categories.json

curl -s --compressed -G "$BASE/recruitingCEJobRequisitions" \
  --data-urlencode 'onlyData=true' \
  --data-urlencode 'expand=requisitionList' \
  --data-urlencode 'finder=findReqs;siteNumber=CX_1,limit=200,sortBy=POSTING_DATES_DESC' \
  | python3 -m json.tool > modules/ccc-jobs/__tests__/fixtures/requisitions.json
```

Read both files afterwards and confirm they contain real data — `categories.json` should list "Student Work" and "Summer Student Work" with counts, and `requisitions.json` should hold a `requisitionList` of roughly 56 entries. If either is empty or an error document, stop and report it rather than writing tests against nothing.

- [ ] **Step 2: Write the failing test**

Create `modules/ccc-jobs/__tests__/requisitions.test.ts`:

```ts
import {parseCategories, parseRequisitions} from '../parsers/requisitions'
import categories from './fixtures/categories.json'
import requisitions from './fixtures/requisitions.json'

describe('parseCategories', () => {
	test('returns every category with its count', () => {
		let parsed = parseCategories(categories)

		expect(parsed.length).toBeGreaterThan(0)
		expect(parsed).toContainEqual(
			expect.objectContaining({name: 'Student Work', count: expect.any(Number)}),
		)
		for (let category of parsed) {
			expect(typeof category.id).toBe('number')
			expect(category.name).not.toBe('')
		}
	})

	test('a response with no facet yields no categories', () => {
		expect(parseCategories({items: [{TotalJobsCount: 0}]})).toEqual([])
	})

	test('a malformed response throws', () => {
		expect(() => parseCategories({nope: true})).toThrow()
	})
})

describe('parseRequisitions', () => {
	test('returns every requisition in the list', () => {
		let parsed = parseRequisitions(requisitions)

		expect(parsed.length).toBeGreaterThan(0)
		for (let job of parsed) {
			expect(job.id).toMatch(/^\d+$/u)
			expect(job.title).not.toBe('')
			expect(job.postedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
		}
	})

	test('an empty list yields no jobs', () => {
		expect(parseRequisitions({items: [{TotalJobsCount: 0, requisitionList: []}]})).toEqual([])
	})

	test('a missing list yields no jobs', () => {
		expect(parseRequisitions({items: [{TotalJobsCount: 0}]})).toEqual([])
	})

	// A partial row means Oracle changed shape; better to fail loudly and show
	// the retry notice than to render half a listing.
	test('a requisition missing its title throws rather than yielding a partial row', () => {
		expect(() =>
			parseRequisitions({items: [{TotalJobsCount: 1, requisitionList: [{Id: '1'}]}]}),
		).toThrow()
	})
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest modules/ccc-jobs`
Expected: FAIL — cannot resolve `../parsers/requisitions`.

- [ ] **Step 4: Write the module scaffolding and the parser**

Create `modules/ccc-jobs/package.json`:

```json
{
  "name": "@frogpond/ccc-jobs",
  "version": "1.0.0",
  "description": "",
  "license": "ISC",
  "author": "",
  "main": "index.tsx",
  "scripts": {
    "test": "jest"
  },
  "dependencies": {
    "@frogpond/data-sources": "workspace:*",
    "@frogpond/html-lib": "workspace:*",
    "zod": "4.4.3"
  },
  "peerDependencies": {
    "react": "^19.1.0"
  }
}
```

Create `modules/ccc-jobs/types.ts`:

```ts
export interface JobSummary {
	id: string
	title: string
	postedDate: string
	location: string | undefined
}

export interface JobCategory {
	id: number
	name: string
	count: number
	jobs: JobSummary[]
}

export interface JobField {
	label: string
	value: string
}

export interface JobDetail {
	id: string
	title: string
	category: string | undefined
	schedule: string | undefined
	location: string | undefined
	postedDate: string | undefined
	fields: JobField[]
	/// Markdown, for `@frogpond/markdown`.
	body: string
	url: string
}
```

Create `modules/ccc-jobs/parsers/requisitions.ts`:

```ts
import {z} from 'zod'
import type {JobSummary} from '../types'

const RequisitionSchema = z.object({
	Id: z.string(),
	Title: z.string(),
	PostedDate: z.string(),
	PrimaryLocation: z.string().nullish(),
})

const CategorySchema = z.object({
	Id: z.number(),
	Name: z.string(),
	TotalCount: z.number(),
})

const SearchSchema = z.object({
	requisitionList: z.array(RequisitionSchema).optional(),
	categoriesFacet: z.array(CategorySchema).optional(),
})

/// Every Candidate Experience search response is a collection of exactly one
/// search result, whatever was asked for.
const ResponseSchema = z.object({
	items: z.array(SearchSchema).min(1),
})

export function parseCategories(body: unknown): Array<{id: number; name: string; count: number}> {
	let {items} = ResponseSchema.parse(body)
	let facet = items[0]?.categoriesFacet ?? []

	return facet.map((category) => ({
		id: category.Id,
		name: category.Name,
		count: category.TotalCount,
	}))
}

export function parseRequisitions(body: unknown): JobSummary[] {
	let {items} = ResponseSchema.parse(body)
	let list = items[0]?.requisitionList ?? []

	return list.map((job) => ({
		id: job.Id,
		title: job.Title,
		postedDate: job.PostedDate,
		location: job.PrimaryLocation ?? undefined,
	}))
}
```

Register the workspace package: `pnpm install` from the worktree root picks it up via `pnpm-workspace.yaml`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd .claude/worktrees/oracle-job-listings && pnpm install && npx jest modules/ccc-jobs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
mise run agent:pre-commit
git add modules/ccc-jobs pnpm-lock.yaml
git commit -m "Parse Oracle job requisition search responses"
```

---

### Task 4: The description parser

Splits a posting's description into promoted fields and a markdown body.

**Files:**
- Create: `modules/ccc-jobs/parsers/description.ts`
- Create: `modules/ccc-jobs/__tests__/fixtures/detail-standard.json`
- Create: `modules/ccc-jobs/__tests__/fixtures/detail-roman-numerals.json`
- Create: `modules/ccc-jobs/__tests__/fixtures/detail-no-description-label.json`
- Create: `modules/ccc-jobs/__tests__/fixtures/detail-summer.json`
- Create: `modules/ccc-jobs/__tests__/description.test.ts`

**Interfaces:**
- Consumes: `htmlToMarkdown`, `nodeToMarkdown`, `parseHtml` from `@frogpond/html-lib`; `JobField` from `../types`
- Produces: `parseDescription(html: string): {fields: JobField[]; body: string}`, and `parseDetail(body: unknown, url: string): JobDetail` added in Task 5

- [ ] **Step 1: Capture the detail fixtures**

Pick four requisition ids from `modules/ccc-jobs/__tests__/fixtures/requisitions.json` and fetch each:

```bash
BASE=https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmRestApi/resources/latest
fetch_detail () {
  curl -s --compressed -G "$BASE/recruitingCEJobRequisitionDetails" \
    --data-urlencode 'onlyData=true' --data-urlencode 'expand=all' \
    --data-urlencode "finder=ById;Id=$1,siteNumber=CX_1" \
    | python3 -m json.tool > "modules/ccc-jobs/__tests__/fixtures/$2.json"
}
```

Choose the ids by inspection, not by guessing:

```bash
python3 - <<'PY'
import json, re, urllib.request, gzip
ids = [r['Id'] for r in json.load(open('modules/ccc-jobs/__tests__/fixtures/requisitions.json'))['items'][0]['requisitionList']]
for i in ids:
    url = ('https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmRestApi/resources/latest/'
           'recruitingCEJobRequisitionDetails?onlyData=true&expand=all&finder=ById;Id=%s,siteNumber=CX_1' % i)
    raw = urllib.request.urlopen(urllib.request.Request(url, headers={'Accept-Encoding': 'gzip'})).read()
    try: raw = gzip.decompress(raw)
    except Exception: pass
    d = json.loads(raw)['items'][0]
    html = d.get('ExternalDescriptionStr') or ''
    labels = [m.group(1).strip() for m in re.finditer(r'font-weight:700"[^>]*>([^<]{3,60}?):', html)]
    print(i, d.get('Category'), '| roman:', any(re.match(r'^[IVX]+\.', l) for l in labels),
          '| has-description-label:', any('escription' in l for l in labels))
PY
```

Then `fetch_detail <id> detail-standard`, `detail-roman-numerals`, `detail-no-description-label`, and `detail-summer` (the one whose `Category` is "Summer Student Work"). Read each file to confirm it holds a real posting before continuing. If no posting in the current data has a roman-numeral heading or is missing the description label, say so and capture the closest variants instead — do not hand-edit a fixture into existence.

- [ ] **Step 2: Write the failing test**

Create `modules/ccc-jobs/__tests__/description.test.ts`:

```ts
import {parseDescription} from '../parsers/description'
import standard from './fixtures/detail-standard.json'
import romanNumerals from './fixtures/detail-roman-numerals.json'

function descriptionOf(fixture: unknown): string {
	let item = (fixture as {items: Array<{ExternalDescriptionStr: string}>}).items[0]
	if (!item) throw new Error('fixture has no posting')
	return item.ExternalDescriptionStr
}

describe('parseDescription', () => {
	test('promotes the wage range to a field', () => {
		let {fields} = parseDescription(descriptionOf(standard))

		let wage = fields.find((field) => field.label === 'Wage')
		expect(wage).toBeDefined()
		expect(wage?.value).not.toBe('')
	})

	test('promotes the department to a field', () => {
		let {fields} = parseDescription(descriptionOf(standard))

		expect(fields.find((field) => field.label === 'Department')?.value).not.toBe('')
	})

	test('a promoted label is not left in the body', () => {
		let {body} = parseDescription(descriptionOf(standard))

		expect(body).not.toContain('Wage Range')
		expect(body).not.toContain('Department Name')
	})

	test('dropped labels appear neither as fields nor in the body', () => {
		let {fields, body} = parseDescription(descriptionOf(standard))

		expect(fields.map((field) => field.label)).not.toContain('Job Title')
		expect(body).not.toContain('Unit Number')
		expect(body).not.toContain('Name and Address of Employer')
	})

	test('keeps the unpromoted sections in the body as markdown', () => {
		let {body} = parseDescription(descriptionOf(standard))

		expect(body).toContain('**Duties and Responsibilities:**')
	})

	test('a roman-numeral heading is matched like its plain form', () => {
		let {fields} = parseDescription(descriptionOf(romanNumerals))

		// The roman-numeral postings still label their department plainly; the
		// numerals appear on the body sections, which must survive as headings.
		expect(fields.find((field) => field.label === 'Department')).toBeDefined()
	})

	test('a missing label yields no field rather than an empty one', () => {
		let {fields} = parseDescription('<p>Just prose, no labels at all.</p>')

		expect(fields).toEqual([])
	})

	test('an unrecognised description becomes the body whole', () => {
		let {body} = parseDescription('<p>Just prose, no labels at all.</p>')

		expect(body).toBe('Just prose, no labels at all.')
	})

	test('a label with an empty value is not promoted', () => {
		let {fields} = parseDescription('<p><span style="font-weight:700">Wage Range:</span></p>')

		expect(fields).toEqual([])
	})

	test('an empty description yields nothing', () => {
		expect(parseDescription('')).toEqual({fields: [], body: ''})
	})
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest modules/ccc-jobs/__tests__/description.test.ts`
Expected: FAIL — cannot resolve `../parsers/description`.

- [ ] **Step 4: Write the parser**

Create `modules/ccc-jobs/parsers/description.ts`:

```ts
import {innerTextWithSpaces, isTag, nodeToMarkdown, parseHtml} from '@frogpond/html-lib'
import type {Element} from 'domhandler'
import type {JobField} from '../types'

/// The labels worth a row of their own, keyed by their normalised form.
const PROMOTED = new Map<string, string>([
	['department name', 'Department'],
	['wage range', 'Wage'],
	['length of position', 'Length'],
	['contact person/supervisor', 'Contact'],
	['classification', 'Classification'],
])

/// Reliable, but no use to a student: the title duplicates the requisition's
/// own, the unit number is HR accounting, and the employer address is the
/// college's, on every posting.
const DROPPED = new Set([
	'job title',
	'unit number',
	'unit number (5 digits)',
	'name and address of employer',
])

/// Some postings number their headings ("I. Description of the Position"), so
/// the numeral comes off before matching.
const LEADING_NUMERAL = /^[ivx]+\.\s*/iu

function normaliseLabel(label: string): string {
	return label.trim().replace(LEADING_NUMERAL, '').trim().toLowerCase()
}

const BOLD_STYLE = /font-weight:\s*(?:700|800|900|bold)/iu

function isBoldElement(node: unknown): node is Element {
	if (!isTag(node)) return false

	let tag = node.name.toLowerCase()
	if (tag === 'b' || tag === 'strong') return true
	return BOLD_STYLE.test(node.attribs['style'] ?? '')
}

/// A block is labelled when its first content is bold text ending in a colon,
/// which is how this college's posting template marks every heading.
function labelOf(block: Element): {label: string; value: string} | undefined {
	let first = block.children.find((child) => isTag(child) || innerTextWithSpaces(child) !== '')
	if (!first || !isBoldElement(first)) return undefined

	let heading = innerTextWithSpaces(first)
	if (!heading.endsWith(':')) return undefined

	let label = heading.slice(0, -1)
	let whole = innerTextWithSpaces(block)
	let value = whole.slice(whole.indexOf(heading) + heading.length).trim()

	return {label, value}
}

function blocksOf(html: string): Element[] {
	let doc = parseHtml(html)
	let out: Element[] = []

	let visit = (nodes: typeof doc.children): void => {
		for (let node of nodes) {
			if (!isTag(node)) continue

			// A wrapping div is not itself a block; its children are.
			if (node.name.toLowerCase() === 'div') {
				visit(node.children)
				continue
			}

			out.push(node)
		}
	}

	visit(doc.children)
	return out
}

export function parseDescription(html: string): {fields: JobField[]; body: string} {
	let fields: JobField[] = []
	let kept: Element[] = []

	for (let block of blocksOf(html)) {
		let labelled = labelOf(block)

		if (labelled) {
			let normalised = normaliseLabel(labelled.label)

			if (DROPPED.has(normalised)) continue

			let promoted = PROMOTED.get(normalised)
			// An empty value means the template's blank line, not a fact worth a
			// row -- so it falls through to the body along with everything else.
			if (promoted && labelled.value) {
				fields.push({label: promoted, value: labelled.value})
				continue
			}
			if (promoted) continue
		}

		kept.push(block)
	}

	let body = kept
		.map((block) => nodeToMarkdown(block))
		.filter((markdown) => markdown !== '')
		.join('\n\n')

	return {fields, body}
}
```

`innerTextWithSpaces`, `parseHtml`, and `nodeToMarkdown` are exported from `@frogpond/html-lib`, and Task 1 added `isTag` to that list.

`Element` is not: change the import above to take it from `@frogpond/html-lib` too, and add `export type {AnyNode, ChildNode, Element} from 'domhandler'` to that module. pnpm links `node_modules` strictly, so `ccc-jobs` cannot import `domhandler` without declaring it as its own dependency — and html-lib re-exporting its own DOM types is the better boundary anyway.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest modules/ccc-jobs`
Expected: PASS. If a body assertion fails because the real fixture words a heading differently, fix the assertion to match the fixture — never edit the fixture to match the assertion.

- [ ] **Step 6: Commit**

```bash
mise run agent:pre-commit
git add modules/ccc-jobs
git commit -m "Split job descriptions into fields and a markdown body"
```

---

### Task 5: URLs and queries

**Files:**
- Create: `modules/ccc-jobs/urls.ts`
- Create: `modules/ccc-jobs/query.ts`
- Create: `modules/ccc-jobs/index.tsx`
- Create: `modules/ccc-jobs/__tests__/urls.test.ts`
- Modify: `modules/ccc-jobs/parsers/description.ts` (add `parseDetail`)
- Modify: `modules/ccc-jobs/package.json` (add `@tanstack/react-query` peer dependency)

**Interfaces:**
- Consumes: `parseCategories`, `parseRequisitions` (Task 3); `parseDescription` (Task 4); `fetchManifest`, `fetchSourceBody`, `resolveSource`, `REL_JOBS` from `@frogpond/data-sources`
- Produces:
  - `parseSiteHref(href: string): {origin: string; siteNumber: string}`
  - `requisitionsUrl(site, options?: {categoryId?: number})`, `categoriesUrl(site)`, `detailUrl(site, id)`, `jobPageUrl(siteHref, id)`
  - `parseDetail(body: unknown, url: string): JobDetail`
  - `jobPostingsOptions` and `jobDetailOptions(id: string)`, re-exported from `@frogpond/ccc-jobs`

- [ ] **Step 1: Write the failing test**

Create `modules/ccc-jobs/__tests__/urls.test.ts`:

```ts
import {categoriesUrl, detailUrl, jobPageUrl, parseSiteHref, requisitionsUrl} from '../urls'

const HREF =
	'https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1'

describe('parseSiteHref', () => {
	test('splits the origin from the site number', () => {
		expect(parseSiteHref(HREF)).toEqual({
			origin: 'https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com',
			siteNumber: 'CX_1',
		})
	})

	test('tolerates a trailing slash', () => {
		expect(parseSiteHref(`${HREF}/`).siteNumber).toBe('CX_1')
	})

	test('an href that is not a candidate experience site throws', () => {
		expect(() => parseSiteHref('https://stolaf.edu/jobs')).toThrow(/candidate experience/iu)
	})
})

describe('url building', () => {
	let site = parseSiteHref(HREF)

	test('the categories url asks only for the facet', () => {
		let url = categoriesUrl(site)

		expect(url).toContain('/hcmRestApi/resources/latest/recruitingCEJobRequisitions?')
		expect(url).toContain('expand=categoriesFacet')
		expect(decodeURIComponent(url)).toContain('facetsList=CATEGORIES')
		expect(decodeURIComponent(url)).toContain('siteNumber=CX_1')
	})

	test('the requisitions url sorts by posting date', () => {
		expect(decodeURIComponent(requisitionsUrl(site))).toContain('sortBy=POSTING_DATES_DESC')
	})

	test('a category id filters the requisitions url', () => {
		expect(decodeURIComponent(requisitionsUrl(site, {categoryId: 42}))).toContain(
			'selectedCategoriesFacet=42',
		)
	})

	// The finder's own separators must survive encoding, or Oracle answers 400.
	test('the finder is percent-encoded', () => {
		expect(requisitionsUrl(site)).toContain('finder=findReqs%3BsiteNumber%3DCX_1')
	})

	test('the detail url finds one posting by id', () => {
		expect(decodeURIComponent(detailUrl(site, '2841'))).toContain('ById;Id=2841,siteNumber=CX_1')
	})

	test('the job page url is the public posting', () => {
		expect(jobPageUrl(HREF, '2841')).toBe(`${HREF}/job/2841`)
	})

	test('the job page url does not double a trailing slash', () => {
		expect(jobPageUrl(`${HREF}/`, '2841')).toBe(`${HREF}/job/2841`)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest modules/ccc-jobs/__tests__/urls.test.ts`
Expected: FAIL — cannot resolve `../urls`.

- [ ] **Step 3: Write the URL builders**

Create `modules/ccc-jobs/urls.ts`:

```ts
export interface JobSite {
	origin: string
	siteNumber: string
}

const API_PATH = '/hcmRestApi/resources/latest'
const REQUISITIONS = `${API_PATH}/recruitingCEJobRequisitions`
const DETAILS = `${API_PATH}/recruitingCEJobRequisitionDetails`

const SITE_HREF = /^(https?:\/\/[^/]+)\/.*\/sites\/([^/?#]+)\/?$/u

/// The manifest gives the public site URL, because everything else derives
/// from it: the API lives on the same origin, and the site number is the last
/// path segment.
export function parseSiteHref(href: string): JobSite {
	let match = SITE_HREF.exec(href)
	if (!match) {
		throw new Error(`not a Candidate Experience site url: "${href}"`)
	}

	let [, origin = '', siteNumber = ''] = match
	return {origin, siteNumber}
}

/// Built by hand rather than with `URLSearchParams`: react-native's URL
/// support is a from-scratch implementation, and this has to encode the
/// finder's `;` and `,` separators identically on device and under Jest.
function query(params: Array<[string, string]>): string {
	return params
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join('&')
}

function findReqs(site: JobSite, extra: string[]): string {
	return ['findReqs', [`siteNumber=${site.siteNumber}`, ...extra].join(',')].join(';')
}

export function categoriesUrl(site: JobSite): string {
	let params = query([
		['onlyData', 'true'],
		['expand', 'categoriesFacet'],
		['finder', findReqs(site, ['facetsList=CATEGORIES', 'limit=1'])],
	])

	return `${site.origin}${REQUISITIONS}?${params}`
}

const REQUISITION_LIMIT = 200

export function requisitionsUrl(site: JobSite, options: {categoryId?: number} = {}): string {
	let extra = [`limit=${REQUISITION_LIMIT}`, 'sortBy=POSTING_DATES_DESC']
	if (options.categoryId !== undefined) {
		extra.push(`selectedCategoriesFacet=${options.categoryId}`)
	}

	let params = query([
		['onlyData', 'true'],
		['expand', 'requisitionList'],
		['finder', findReqs(site, extra)],
	])

	return `${site.origin}${REQUISITIONS}?${params}`
}

export function detailUrl(site: JobSite, id: string): string {
	let params = query([
		['onlyData', 'true'],
		['expand', 'all'],
		['finder', `ById;Id=${id},siteNumber=${site.siteNumber}`],
	])

	return `${site.origin}${DETAILS}?${params}`
}

export function jobPageUrl(siteHref: string, id: string): string {
	return `${siteHref.replace(/\/$/u, '')}/job/${id}`
}
```

- [ ] **Step 4: Run the URL tests**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest modules/ccc-jobs/__tests__/urls.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test for `parseDetail`**

Append to `modules/ccc-jobs/__tests__/description.test.ts`:

```ts
import {parseDetail} from '../parsers/description'
import summer from './fixtures/detail-summer.json'

describe('parseDetail', () => {
	test('reads the header fields Oracle actually populates', () => {
		let detail = parseDetail(standard, 'https://example.test/job/1')

		expect(detail.id).toMatch(/^\d+$/u)
		expect(detail.title).not.toBe('')
		expect(detail.category).toBe('Student Work')
		expect(detail.url).toBe('https://example.test/job/1')
	})

	test('reads the summer posting as its own category', () => {
		expect(parseDetail(summer, 'https://example.test/job/1').category).toBe('Summer Student Work')
	})

	test('carries the scraped fields and body through', () => {
		let detail = parseDetail(standard, 'https://example.test/job/1')

		expect(detail.fields.length).toBeGreaterThan(0)
		expect(detail.body).not.toBe('')
	})

	test('a posting with no description still parses', () => {
		let detail = parseDetail(
			{items: [{Id: '1', Title: 'A job'}]},
			'https://example.test/job/1',
		)

		expect(detail.body).toBe('')
		expect(detail.fields).toEqual([])
	})

	test('an empty collection throws', () => {
		expect(() => parseDetail({items: []}, 'https://example.test/job/1')).toThrow()
	})
})
```

- [ ] **Step 6: Implement `parseDetail`**

Add these two imports to the top of `modules/ccc-jobs/parsers/description.ts`, alongside its existing ones:

```ts
import {z} from 'zod'
import type {JobDetail} from '../types'
```

Then append to the same file:

```ts
const DetailSchema = z.object({
	Id: z.string(),
	Title: z.string(),
	Category: z.string().nullish(),
	JobSchedule: z.string().nullish(),
	PrimaryLocation: z.string().nullish(),
	ExternalPostedStartDate: z.string().nullish(),
	ExternalDescriptionStr: z.string().nullish(),
})

const DetailResponseSchema = z.object({
	items: z.array(DetailSchema).min(1),
})

export function parseDetail(body: unknown, url: string): JobDetail {
	let {items} = DetailResponseSchema.parse(body)
	let posting = items[0]
	if (!posting) throw new Error('no posting in the detail response')

	let {fields, body: markdown} = parseDescription(posting.ExternalDescriptionStr ?? '')

	return {
		id: posting.Id,
		title: posting.Title,
		category: posting.Category ?? undefined,
		schedule: posting.JobSchedule ?? undefined,
		location: posting.PrimaryLocation ?? undefined,
		postedDate: posting.ExternalPostedStartDate ?? undefined,
		fields,
		body: markdown,
		url,
	}
}
```

- [ ] **Step 7: Write the queries**

Create `modules/ccc-jobs/query.ts`:

```ts
import {fetchManifest, fetchSourceBody, REL_JOBS, resolveSource} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../source/init/tanstack-query'
import {parseDetail} from './parsers/description'
import {parseCategories, parseRequisitions} from './parsers/requisitions'
import type {JobCategory, JobDetail} from './types'
import {categoriesUrl, detailUrl, jobPageUrl, parseSiteHref, requisitionsUrl} from './urls'

const ORACLE_RECRUITING = 'application/vnd.oracle.recruiting-ce+json'
const SOURCE_TYPES = [ORACLE_RECRUITING]
const SOURCE_ID = 'stolaf'

export const keys = {
	postings: ['jobs', 'postings'] as const,
	detail: (id: string) => ['jobs', 'detail', id] as const,
}

async function resolveJobSite(): Promise<string> {
	let manifest = await fetchManifest(queryClient)
	return resolveSource(manifest, REL_JOBS, SOURCE_ID, SOURCE_TYPES).href
}

export const jobPostingsOptions = queryOptions({
	queryKey: keys.postings,
	queryFn: async ({signal}): Promise<JobCategory[]> => {
		let href = await resolveJobSite()
		let site = parseSiteHref(href)

		let categories = parseCategories(
			await fetchSourceBody(categoriesUrl(site), signal, 'Jobs'),
		)

		// One request per category, because a requisition carries no category of
		// its own -- the only way to know which section a posting belongs to is
		// to ask for that section.
		return Promise.all(
			categories.map(async (category) => ({
				...category,
				jobs: parseRequisitions(
					await fetchSourceBody(
						requisitionsUrl(site, {categoryId: category.id}),
						signal,
						'Jobs',
					),
				),
			})),
		)
	},
})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const jobDetailOptions = (id: string) =>
	queryOptions({
		queryKey: keys.detail(id),
		queryFn: async ({signal}): Promise<JobDetail> => {
			let href = await resolveJobSite()
			let site = parseSiteHref(href)

			return parseDetail(
				await fetchSourceBody(detailUrl(site, id), signal, 'Jobs'),
				jobPageUrl(href, id),
			)
		},
	})
```

Create `modules/ccc-jobs/index.tsx`:

```tsx
export {jobPostingsOptions, jobDetailOptions, keys} from './query'
export type {JobCategory, JobDetail, JobField, JobSummary} from './types'
```

Add to `modules/ccc-jobs/package.json`'s `peerDependencies`: `"@tanstack/react-query": "^5.0.0"`.

- [ ] **Step 8: Run the whole module's tests**

Run: `cd .claude/worktrees/oracle-job-listings && pnpm install && npx jest modules/ccc-jobs && mise run tsc`
Expected: PASS, and tsc clean.

- [ ] **Step 9: Commit**

```bash
mise run agent:pre-commit
git add modules/ccc-jobs pnpm-lock.yaml
git commit -m "Query Oracle for job postings and their details"
```

---

### Task 6: The job list screen

**Files:**
- Modify: `app/(home)/SIS/student-work.tsx`
- Modify: `source/features/sis/student-work/job-row.tsx`
- Test: `source/features/sis/student-work/__tests__/job-row.test.tsx`

**Interfaces:**
- Consumes: `jobPostingsOptions`, `JobCategory`, `JobSummary` from `@frogpond/ccc-jobs`
- Produces: a `SectionList` of `JobCategory` sections, pushing `/JobDetail` with `{jobId}`

- [ ] **Step 1: Write the failing test**

Create `source/features/sis/student-work/__tests__/job-row.test.tsx`:

```tsx
import * as React from 'react'
import {render, screen, fireEvent} from '@testing-library/react-native'
import {JobRow} from '../job-row'
import type {JobSummary} from '@frogpond/ccc-jobs'

const JOB: JobSummary = {
	id: '2841',
	title: 'AY Athletic Events Student Worker (WS-ST1)',
	postedDate: '2026-08-14',
	location: 'Northfield, MN, United States',
}

describe('JobRow', () => {
	test('shows the job title', () => {
		render(<JobRow job={JOB} onPress={jest.fn()} />)

		expect(screen.getByText(JOB.title)).toBeTruthy()
	})

	test('shows the posted date in long form', () => {
		render(<JobRow job={JOB} onPress={jest.fn()} />)

		expect(screen.getByText('Posted August 14, 2026')).toBeTruthy()
	})

	test('shows nothing for a posted date it cannot read', () => {
		render(<JobRow job={{...JOB, postedDate: ''}} onPress={jest.fn()} />)

		expect(screen.queryByText(/^Posted/u)).toBeNull()
	})

	test('passes the job back on press', () => {
		let onPress = jest.fn()
		render(<JobRow job={JOB} onPress={onPress} />)

		fireEvent.press(screen.getByText(JOB.title))
		expect(onPress).toHaveBeenCalledWith(JOB)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest source/features/sis/student-work`
Expected: FAIL — `JobRow` still expects the old `JobType`.

- [ ] **Step 3: Rewrite the row**

Replace `source/features/sis/student-work/job-row.tsx`:

```tsx
import * as React from 'react'
import {Column, Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import type {JobSummary} from '@frogpond/ccc-jobs'
import {format, isValid, parseISO} from 'date-fns'

type Props = {
	onPress: (job: JobSummary) => void
	job: JobSummary
}

/// `PostedDate` is a plain `YYYY-MM-DD`, with no zone -- parsed as local time
/// so the date a student sees is the date Oracle published.
function postedOn(postedDate: string): string | undefined {
	let parsed = parseISO(postedDate)
	return isValid(parsed) ? `Posted ${format(parsed, 'MMMM d, yyyy')}` : undefined
}

export const JobRow = (props: Props): React.ReactNode => {
	let {job} = props
	let posted = postedOn(job.postedDate)

	return (
		<ListRow arrowPosition="top" onPress={() => props.onPress(job)}>
			<Row alignItems="center">
				<Column flex={1}>
					<Title lines={2}>{job.title}</Title>
					{posted ? <Detail lines={1}>{posted}</Detail> : null}
				</Column>
			</Row>
		</ListRow>
	)
}
```

- [ ] **Step 4: Rewrite the screen**

Replace the imports and query wiring in `app/(home)/SIS/student-work.tsx`, keeping its existing styles, `NoticeView` error branch, and `testID`:

```tsx
import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {JobRow} from '../../../source/features/sis/student-work/job-row'
import {jobPostingsOptions, type JobSummary} from '@frogpond/ccc-jobs'
import {useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

export default function SISStudentWorkPage(): React.ReactNode {
	let router = useRouter()
	let {data = [], error, isError, refetch, isRefetching, isLoading} = useQuery(jobPostingsOptions)

	let sections = React.useMemo(
		() =>
			data
				.filter((category) => category.jobs.length > 0)
				.map((category) => ({title: category.name, data: category.jobs})),
		[data],
	)

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="There are no open job postings." />
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item: JobSummary) => item.id}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<JobRow
					job={item}
					onPress={(job: JobSummary) =>
						router.push({pathname: '/JobDetail', params: {jobId: job.id}})
					}
				/>
			)}
			renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
			sections={sections}
			style={styles.listContainer}
			testID="student-work-list"
		/>
	)
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest source/features/sis/student-work && mise run tsc`
Expected: PASS. tsc will still flag `app/(home)/JobDetail.tsx`, which Task 7 rewrites.

- [ ] **Step 6: Commit**

```bash
mise run agent:pre-commit
git add app/\(home\)/SIS/student-work.tsx source/features/sis/student-work
git commit -m "List Oracle job postings by category"
```

---

### Task 7: The job detail screen

**Files:**
- Modify: `app/(home)/JobDetail.tsx` (full rewrite)
- Modify: `source/features/sis/student-work/lib.ts`
- Test: `source/features/sis/student-work/__tests__/share-job.test.ts`

**Interfaces:**
- Consumes: `jobDetailOptions`, `JobDetail` from `@frogpond/ccc-jobs`
- Produces: `shareJob(job: JobDetail): void`

- [ ] **Step 1: Write the failing test**

Create `source/features/sis/student-work/__tests__/share-job.test.ts`:

```ts
import {Share} from 'react-native'
import {shareJob} from '../lib'
import type {JobDetail} from '@frogpond/ccc-jobs'

const JOB: JobDetail = {
	id: '2841',
	title: 'AY Athletic Events Student Worker (WS-ST1)',
	category: 'Student Work',
	schedule: 'Part time',
	location: 'Northfield, MN, United States',
	postedDate: '2026-08-14T16:43:34+00:00',
	fields: [{label: 'Wage', value: '$12.00-13.00/hour'}],
	body: '**Duties and Responsibilities:** Tasks include playing music.',
	url: 'https://example.test/sites/CX_1/job/2841',
}

describe('shareJob', () => {
	test('shares the posting url', () => {
		let share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'})

		shareJob(JOB)

		expect(share).toHaveBeenCalledWith(expect.objectContaining({url: JOB.url}))
		share.mockRestore()
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest source/features/sis/student-work/__tests__/share-job.test.ts`
Expected: FAIL — `shareJob` still takes the old `JobType`.

- [ ] **Step 3: Retype `shareJob`**

In `source/features/sis/student-work/lib.ts`, replace the `JobType` import with `import type {JobDetail} from '@frogpond/ccc-jobs'` and change the signature to `shareJob(job: JobDetail): void`. The body is unchanged — it already shares `job.url`.

- [ ] **Step 4: Rewrite the detail screen**

Replace `app/(home)/JobDetail.tsx` entirely:

```tsx
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Button, Form, HStack, Host, RNHostView, Section, Spacer, Text} from '@expo/ui/swift-ui'
import {font} from '@expo/ui/swift-ui/modifiers'
import {Markdown} from '@frogpond/markdown'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {jobDetailOptions, type JobDetail, type JobField} from '@frogpond/ccc-jobs'
import {shareJob} from '../../source/features/sis/student-work/lib'
import {format, isValid, parseISO} from 'date-fns'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	body: {
		paddingVertical: 6,
	},
})

function FieldRow({label, value}: JobField): React.ReactNode {
	return (
		<HStack>
			<Text>{label}</Text>
			<Spacer />
			<Text>{value}</Text>
		</HStack>
	)
}

function postedOn(postedDate: string | undefined): string | undefined {
	if (!postedDate) return undefined

	let parsed = parseISO(postedDate)
	return isValid(parsed) ? format(parsed, 'MMMM d, yyyy') : undefined
}

function JobDetailView({job}: {job: JobDetail}): React.ReactNode {
	let posted = postedOn(job.postedDate)

	return (
		<Host style={styles.host}>
			<Form>
				<Section>
					<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>{job.title}</Text>
					{job.category ? <FieldRow label="Category" value={job.category} /> : null}
					{job.schedule ? <FieldRow label="Schedule" value={job.schedule} /> : null}
					{job.location ? <FieldRow label="Location" value={job.location} /> : null}
					{posted ? <FieldRow label="Posted" value={posted} /> : null}
				</Section>

				{job.fields.length > 0 ? (
					<Section title="Details">
						{job.fields.map((field) => (
							<FieldRow key={field.label} label={field.label} value={field.value} />
						))}
					</Section>
				) : null}

				{job.body ? (
					<Section title="Description">
						{/* `matchContents` so the native markdown view sizes itself
						    inside the Form rather than collapsing to nothing. */}
						<RNHostView matchContents={true}>
							<Markdown source={job.body} style={styles.body} />
						</RNHostView>
					</Section>
				) : null}

				<Section>
					<Button onPress={() => openUrl(job.url)}>
						<Text>View on the St. Olaf jobs site</Text>
					</Button>
				</Section>
			</Form>
		</Host>
	)
}

export default function JobDetailPage(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()
	let {data: job, isLoading, error, refetch} = useQuery(jobDetailOptions(jobId))

	if (isLoading) {
		return (
			<>
				<Stack.Title>Loading…</Stack.Title>
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				<Stack.Title>Error</Stack.Title>
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!job) {
		return (
			<>
				<Stack.Title>Unknown Job</Stack.Title>
				<NoticeView text="Could not find this job posting." />
			</>
		)
	}

	return (
		<>
			<Stack.Title>{job.title}</Stack.Title>
			<Stack.Toolbar>
				<Stack.Toolbar.Button
					accessibilityLabel="Share Job"
					icon="square.and.arrow.up"
					onPress={() => shareJob(job)}
				/>
			</Stack.Toolbar>
			<JobDetailView job={job} />
		</>
	)
}
```

If `Markdown` does not accept a `style` prop, drop it rather than inventing one — check `modules/markdown/markdown.tsx` for the real `MarkdownProps`.

- [ ] **Step 5: Run tests and type check**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest && mise run tsc`
Expected: PASS, tsc clean.

- [ ] **Step 6: Verify on a simulator**

The `RNHostView` sizing and the `@expo/ui` string rule cannot be checked by tsc or Jest — a bare string in a `ReactNode` prop crashes at mount. Build and open the screen:

Run: `cd .claude/worktrees/oracle-job-listings && mise run prebuild` then build to a simulator, navigate to SIS → Student Work, and open a posting.

Confirm: the list shows both category sections; a posting opens; the header rows, the Details rows, and the markdown body all render; the body is fully visible rather than clipped to zero height; the button opens the Oracle page. Capture a simulator screenshot with `xcrun simctl io booted screenshot` — never an unscoped `screencapture` on this machine — and report what you saw. If the body collapses, say so rather than working around it; the fallback is rendering the body outside the `Form` in a `ScrollView`, which is a design change worth raising.

- [ ] **Step 7: Commit**

```bash
mise run agent:pre-commit
git add app/\(home\)/JobDetail.tsx source/features/sis/student-work
git commit -m "Show an Oracle job posting in a SwiftUI form"
```

---

### Task 8: Remove the dead ccc-server path

Inlining new code and forgetting to delete the old is invisible to tsc, oxlint, and Jest — an orphaned file passes every gate. So the removal is its own task, with a test that asserts the absence.

**Files:**
- Delete: `source/features/sis/student-work/types.ts`
- Delete: `source/features/sis/student-work/query.ts`
- Test: `source/features/sis/student-work/__tests__/no-legacy-jobs-endpoint.test.ts`

- [ ] **Step 1: Write the failing test**

Create `source/features/sis/student-work/__tests__/no-legacy-jobs-endpoint.test.ts`:

```ts
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {join} from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..', '..')

/// `git grep` exits 1 when it matches nothing, which `execFileSync` raises as
/// a throw. Nothing found is the passing case here, so a throw maps to an
/// empty result rather than a test error.
function grepFiles(pattern: string): string[] {
	try {
		let output = execFileSync('git', ['grep', '-lE', pattern, '--', 'app', 'source', 'modules'], {
			cwd: ROOT,
			encoding: 'utf8',
		})
		return output.split('\n').filter((line) => line !== '')
	} catch {
		return []
	}
}

describe('the legacy student-work data path', () => {
	test('its modules are gone', () => {
		expect(existsSync(join(__dirname, '..', 'query.ts'))).toBe(false)
		expect(existsSync(join(__dirname, '..', 'types.ts'))).toBe(false)
	})

	// The ccc-server endpoint serves data the college no longer maintains, so
	// nothing may call it -- an orphaned caller would type-check and test clean.
	test('nothing fetches the ccc-server jobs endpoint', () => {
		expect(grepFiles("client\\.get(<[^>]*>)?\\('jobs'")).toEqual([])
	})
})
```

Confirm `grepFiles` works before relying on it: run it once against a pattern you know matches (say `client\.get`) and check it returns files, so a silently-broken grep cannot pass as an absence.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest no-legacy-jobs-endpoint`
Expected: FAIL — both files still exist.

- [ ] **Step 3: Delete the legacy modules**

```bash
cd .claude/worktrees/oracle-job-listings
git rm source/features/sis/student-work/types.ts source/features/sis/student-work/query.ts
```

- [ ] **Step 4: Run the full suite and type check**

Run: `cd .claude/worktrees/oracle-job-listings && npx jest && mise run tsc && mise run lint`
Expected: PASS, clean. Any remaining import of the deleted files is a real gap — fix it rather than restoring the file.

- [ ] **Step 5: Commit**

```bash
mise run agent:pre-commit
git add -A source/features/sis/student-work
git commit -m "Drop the ccc-server student work data path"
```

---

### Task 9: The ccc-server placeholder posting

A separate repository, so this is the last task and does not block the app work. Do not start it until Tasks 1–8 are merged or explicitly approved.

**Files:** in `StoDevX/ccc-server`, not this repo.

- [ ] **Step 1: Clone the server and find the endpoint**

```bash
cd ~/Developer/github.com/StoDevX
gh repo clone StoDevX/ccc-server
```

Find the handler serving `/jobs` and read the shape it returns. The app's old `JobType` — the shape legacy installs still parse — was:

```ts
type JobType = {
	comments: string
	contactEmail: string
	contactName: string
	contactPhone: string
	description: string
	goodForIncomingStudents: boolean
	hoursPerWeek: string
	howToApply: string
	id: number
	lastModified: string
	links: Array<string>
	office: string
	openPositions: string
	skills: string
	timeline: string
	timeOfHours: string | number
	title: string
	type: string
	url: string
	year: string
}
```

- [ ] **Step 2: Write the failing test**

Follow ccc-server's own test conventions — read a neighbouring endpoint's test first. Assert that `/jobs` returns exactly one posting, that its `title` and `description` explain the move, and that every field the legacy app reads is present and of the right type (an absent `type` would break the app's grouping).

- [ ] **Step 3: Replace the handler**

Return a single posting. `type` and `office` must be non-empty so the old screen groups and labels it; `description` carries the explanation; `url` points at
`https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs`;
`lastModified` keeps the `MMMM D, YYYY` format the old screen parses with `moment`.

Suggested copy, for Wren to accept or rewrite:

> **Title:** Student job listings have moved
> **Description:** St. Olaf now posts student jobs through Oracle. Update All About Olaf to see them in the app, or tap Open Posting to browse them on the college's jobs site.

- [ ] **Step 4: Run the server's tests**

Run whatever ccc-server's own test command is, per its README or CI config.

- [ ] **Step 5: Commit and open a PR**

Follow ccc-server's commit conventions. Leave the PR description to Wren.

---

## Notes for the implementer

- The Oracle API is live and unauthenticated; you can query it directly while working. Every `curl` needs `--compressed`, because the server sends gzip regardless of `Accept-Encoding`.
- Fixtures are real captured responses. If a test disagrees with a fixture, the test is wrong.
- `TotalJobsCount` was 56 on 2026-08-15 (55 Student Work, 1 Summer Student Work). If your capture differs, that is the college's data changing, not a bug.
