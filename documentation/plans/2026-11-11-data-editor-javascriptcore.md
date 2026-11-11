# Data Editor in JavaScriptCore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the data editor's helper inside the app in JavaScriptCore, download it from GitHub Pages with the data it matches, and download Node and ccc-server only when the preview first starts.

**Deviation from the spec, for review:** the spec has the app re-read `helper.json` after the scripts arrive to spot a deploy that landed meanwhile. Pages' cache can serve each file from a different deploy, so instead each script's first line names the commit it was built from, and the app checks that line against the data's commit (Task 6). The installs also live under `<support>/preview/`, not beside ccc's state (Task 8).

**Architecture:** esbuild bundles the helper and `bundle-data` into plain scripts, swapping Node's built-ins for stand-ins (`scripts/data-editor-jsc/`) that call a Swift host (`HelperRuntime`). Master's data deploy publishes those scripts and `helper.json` (commit and protocol) to Pages; the workspace downloads the data at that commit with them. A Swift `BuildServer` replaces the helper's Node server, and a `PreviewInstaller` fetches Node (checked against `mise.lock`'s SHA-256) and installs ccc-server with its npm at the first Start Preview.

**Tech Stack:** Node 24 scripts and node:test, esbuild 0.28, Swift 6.2 (DataEditorKit package, macOS 27), JavaScriptCore, Network, CryptoKit, Swift Testing, XCUITest, GitHub Actions.

**Spec:** `documentation/specs/2026-11-11-data-editor-preview-download-design.md`. The spike that proved the approach is summarised in its "Why".

## Global Constraints

- Commit messages: imperative, capitalised, no conventional-commit prefix, no full stop; end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never skip or disable the pre-commit hook (`git commit` runs `mise run agent:pre-commit` through hk). Don't commit if it fails; fix and commit again.
- TDD: write each test first, watch it fail for the expected reason, then implement.
- The repo's test-writing-reminder refuses the first write to each test file; check the test is none of the listed kinds, then send the same write again.
- JavaScript style: tabs, single quotes, no semicolons (oxfmt); `mise run format` fixes it.
- Swift: Swift 6 language mode; the app target defaults to `MainActor`, the kit does not.
- Comments say what and why, never what changed. JSDoc/`///` on declarations.
- App tests: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh <log> [-only-testing:…]`; it signs on the command line. Never use `-allowProvisioningUpdates`.
- Kit tests: `cd macos/DataEditor/DataEditorKit && DATA_EDITOR_NODE="$(mise which node)" swift test`.
- node:test: `node --test <file>`; all of them: `mise run test:node`.
- The UI tests take the screen; ask Wren before running them.
- `HelperRuntime.protocolVersion` and `PROTOCOL` in `scripts/data-editor-helper.mjs` start at 1, and change together whenever a handler's parameters or its reply's shape change.
- oxfmt is pinned at the repo's version (`devDependencies.oxfmt`, 0.74.0), SHA-256 `c3d86b16de563e4542eb265702421a6c4ef5c45775a9e2958ca1b5ef6a84cf4b` for `oxfmt-aarch64-apple-darwin.tar.gz`.
- Pages serves the published files at `https://stolaf.dev/AAO-React-Native/`.
- Copy the contributor sees, verbatim: "Downloading preview…", "Getting the preview server ready. This happens once.", "Couldn't download the preview server.", "An update is needed to edit this data".

## Review Focus

1. **A deploy landing during a download:** `helper.json` names one commit, and a script arrives from another deploy (Pages' cache can serve each file at a different one). Each script's first line names its commit; the app must start again, never pairing data from one commit with a helper from another. Pinned in Task 6 (`startsAgainWhenADeployLandsMidDownload`).
2. **A helper call that never settles** (a promise waiting on nothing): the call must fail with a message, not hang the app. Pinned in Task 2 (`failsACallWhosePromiseNeverSettles`).
3. **A request path that leaves the build folder** (`/../x`, `/%2e%2e/x`): 404, never a file outside it. Pinned in Task 4 (`refusesAPathOutsideTheBuild`).
4. **Stop during the preview's install:** nothing half installed is taken for an install; the next start installs again. Pinned in Task 8 (`leavesNothingInstalledWhenNpmFails`, `takesNoStagingFolderForAnInstall`).
5. **A file the scripts look for and don't find:** the stand-ins must fail as Node does, with `ENOENT`, so the reply matches Node's. Pinned in Task 3 (the parity steps load a missing file).

## File map

| File | Task | Responsibility |
|---|---|---|
| `scripts/data-editor-jsc/*.js`, `entry.mjs` | 1 | Node's built-ins for JavaScriptCore, calling `__host` |
| `scripts/build-data-editor-helper.mjs` (+ test) | 1 | Bundle `helper.js`, `bundle-data.js`; write `helper.json` |
| `scripts/data-editor-helper.mjs` | 1 | `PROTOCOL`; `build` replies with the folder it built |
| `DataEditorKit/Sources/DataEditorKit/HelperRuntime.swift` (+ test) | 2 | JavaScriptCore host: file calls, timers, `bundle-data`, oxfmt |
| `DataEditorKit/Tests/DataEditorKitTests/HelperParityTests.swift` | 3 | The same steps through JavaScriptCore and Node must match |
| `DataEditorKit/Sources/DataEditorKit/BuildServer.swift` (+ test) | 4 | Serves the newest build on 8790 |
| `scripts/data-editor-node-release.mjs` (+ test) | 5 | Node's archive pin from `mise.lock` |
| `macos/DataEditor/scripts/embed-runtime.sh`, `oxfmt.sha256` | 5, 6, 8 | What the app's `Runtime/` folder holds |
| `DataEditorKit/Sources/DataEditorKit/NodeRelease.swift` | 5 | `node.json`'s shape |
| `DataEditor/Runtime.swift` (+ test) | 5, 6, 8 | Where the app's resources are |
| `DataEditorKit/Sources/DataEditorKit/Workspace.swift` (+ test) | 6 | Data and helper at the published commit; protocol |
| `DataEditorKit/Sources/DataEditorKit/HelperClient.swift` (+ test) | 6 | The typed calls, over `HelperRuntime` |
| `DataEditor/AppModel.swift`, `DataEditorUITests/RepoDataLaunch.swift` | 6, 8 | Wiring |
| `.github/workflows/deploy-data.yml` | 7 | Publishes the helper |
| `DataEditorKit/Sources/DataEditorKit/PreviewInstaller.swift` (+ test) | 8 | Node and ccc-server at the first preview |
| `DataEditor/ServerStatusView.swift` (+ `PreviewControlTests`) | 8 | "Downloading preview…" |

---

### Task 1: Bundle the helper for JavaScriptCore

**Files:**
- Create: `scripts/data-editor-jsc/fs.js`, `fs-promises.js`, `path.js`, `url.js`, `util.js`, `module.js`, `child-process.js`, `unavailable.js`, `process.js`, `oxfmt.js`, `react-native.js`, `globals.js`, `entry.mjs`
- Modify: `scripts/build-data-editor-helper.mjs` (whole file), `scripts/data-editor-helper.mjs` (add `PROTOCOL`; `build` replies with `dir`)
- Test: `scripts/build-data-editor-helper.test.mjs` (whole file)

**Interfaces:**
- Produces: `buildHelper({outDir, commit}) → Promise<string>` writing `helper.js`, `bundle-data.js`, `helper.json` (`{"commit": string, "protocol": number}`) into `outDir`. Each script's first line is `// data-editor commit <sha>`, which the app checks against the data's commit (Task 6); CLI `node scripts/build-data-editor-helper.mjs --out <dir> --commit <sha>` (both optional: `macos/DataEditor/build/helper`, `git rev-parse HEAD`).
- Produces: `helper.js` defines `globalThis.dataEditorHelper = {PROTOCOL, createHandlers}`. It needs a host object `globalThis.__host` with: `readFile(path) → string|null`, `writeFile(path, text)`, `readdir(path) → string[]|null`, `stat(path) → {isDirectory, size, mtimeMs}|null`, `mkdir(path, recursive)`, `rm(path)`, `rename(from, to)`, `copyFile(from, to)`, `realpath(path) → string`, `mkdtemp(prefix) → string`, `cwd() → string`, `runScript(path, args) → {code, stderr}`, `oxfmt(file, text, optionsJSON) → {code, errors}`; and `globalThis.__scriptDir`, `globalThis.__scriptURL`, `setTimeout`, `clearTimeout`, `console`, `process`.
- Produces: the `build` handler replies `{ok: true, dir}` on success.

- [ ] **Step 1: Write the failing test**

Replace `scripts/build-data-editor-helper.test.mjs` with:

```js
import assert from 'node:assert/strict'
import {mkdtemp, readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import vm from 'node:vm'
import {buildHelper} from './build-data-editor-helper.mjs'
import {PROTOCOL} from './data-editor-helper.mjs'

describe('the helper built for JavaScriptCore', () => {
	it('names the commit it was built from and the protocol it speaks', async () => {
		let out = await mkdtemp(path.join(tmpdir(), 'data-editor-helper-'))
		await buildHelper({outDir: out, commit: 'abc123'})
		let published = JSON.parse(await readFile(path.join(out, 'helper.json'), 'utf8'))
		assert.deepEqual(published, {commit: 'abc123', protocol: PROTOCOL})
		// Pages' cache may hold each file at a different deploy, so each names its own commit
		for (let script of ['helper.js', 'bundle-data.js']) {
			let text = await readFile(path.join(out, script), 'utf8')
			assert.equal(text.split('\n', 1)[0], '// data-editor commit abc123')
		}
	})

	/// JavaScriptCore has no Node: the bundle must load with only what the
	/// Mac app's host gives it, no require and no Node modules, and offer the
	/// helper's handlers.
	it("loads with only what the Mac app's host gives it", async () => {
		let out = await mkdtemp(path.join(tmpdir(), 'data-editor-helper-'))
		await buildHelper({outDir: out, commit: 'abc123'})
		let context = vm.createContext({
			process: {argv: ['node', 'helper.js'], env: {}},
			console,
			setTimeout,
			clearTimeout,
		})
		vm.runInContext(await readFile(path.join(out, 'helper.js'), 'utf8'), context)
		let helper = vm.runInContext('globalThis.dataEditorHelper', context)
		assert.equal(helper.PROTOCOL, PROTOCOL)
		assert.equal(typeof helper.createHandlers, 'function')
	})
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test scripts/build-data-editor-helper.test.mjs`
Expected: FAIL: `PROTOCOL` is not exported by `data-editor-helper.mjs` (a SyntaxError naming it).

- [ ] **Step 3: Add `PROTOCOL` and the build's folder to the helper**

In `scripts/data-editor-helper.mjs`, after the imports:

```js
/**
 * The version of the handlers' parameters and replies. The Mac app holds the
 * one it speaks (`HelperRuntime.protocolVersion`) and refuses a helper with
 * another. Changing a handler's parameters or its reply's shape bumps both.
 */
export const PROTOCOL = 1
```

and in `createHandlers`, the `build` handler's last line `return {ok: true}` becomes:

```js
			// the folder to serve, which the app's own server reads
			return {ok: true, dir: current}
```

- [ ] **Step 4: Write the stand-ins**

`scripts/data-editor-jsc/fs.js`:

```js
// node:fs for the data editor's helper in JavaScriptCore: the calls the data
// scripts make, each passed to the Mac app's Swift host as `__host`.

const host = () => globalThis.__host

/** An error shaped like Node's, which the scripts tell apart by `code`. */
const missing = (file) =>
	Object.assign(new Error(`ENOENT: no such file or directory, open '${file}'`), {code: 'ENOENT'})

function stats(file) {
	let found = host().stat(file)
	if (!found) throw missing(file)
	return {
		isDirectory: () => found.isDirectory,
		isFile: () => !found.isDirectory,
		size: found.size,
		mtimeMs: found.mtimeMs,
		mtime: new Date(found.mtimeMs),
	}
}

/** The file's text; the data scripts read only text. */
export function readFileSync(file) {
	let text = host().readFile(String(file))
	if (text === null || text === undefined) throw missing(file)
	return text
}

export function writeFileSync(file, data) {
	host().writeFile(String(file), String(data))
}

export function existsSync(file) {
	return Boolean(host().stat(String(file)))
}

export function statSync(file, options) {
	if (options?.throwIfNoEntry === false && !host().stat(String(file))) return undefined
	return stats(String(file))
}

export const lstatSync = statSync

export function readdirSync(directory, options) {
	directory = String(directory)
	let names = host().readdir(directory)
	if (names === null || names === undefined) throw missing(directory)
	names = [...names].sort()
	if (options?.recursive) {
		if (options.withFileTypes) throw new Error('readdirSync with recursive and withFileTypes has no stand-in')
		return names.flatMap((name) =>
			host().stat(`${directory}/${name}`)?.isDirectory
				? [name, ...readdirSync(`${directory}/${name}`, {recursive: true}).map((inner) => `${name}/${inner}`)]
				: [name],
		)
	}
	if (!options?.withFileTypes) return names
	return names.map((name) => {
		let found = host().stat(`${directory}/${name}`)
		return {
			name,
			parentPath: directory,
			path: directory,
			isDirectory: () => Boolean(found?.isDirectory),
			isFile: () => Boolean(found) && !found.isDirectory,
		}
	})
}

export function mkdirSync(directory, options) {
	host().mkdir(String(directory), Boolean(options?.recursive))
}

export function rmSync(file) {
	host().rm(String(file))
}

export function renameSync(from, to) {
	host().rename(String(from), String(to))
}

export function copyFileSync(from, to) {
	host().copyFile(String(from), String(to))
}

export function realpathSync(file) {
	return host().realpath(String(file))
}
realpathSync.native = realpathSync

export function mkdtempSync(prefix) {
	return host().mkdtemp(String(prefix))
}

/** `bundle-data-dir` writes each bundle through a stream, all at once. */
export function createWriteStream(file) {
	let written = ''
	return {
		write(data) {
			written += String(data)
			host().writeFile(String(file), written)
			return true
		},
		end(data) {
			if (data !== undefined) this.write(data)
		},
		on() {
			return this
		},
		once() {
			return this
		},
	}
}

export default {
	readFileSync,
	writeFileSync,
	existsSync,
	statSync,
	lstatSync,
	readdirSync,
	mkdirSync,
	rmSync,
	renameSync,
	copyFileSync,
	realpathSync,
	mkdtempSync,
	createWriteStream,
}
```

`scripts/data-editor-jsc/fs-promises.js`:

```js
// node:fs/promises for the helper in JavaScriptCore: the same calls as the
// fs stand-in, answered at once, since the host's file calls are synchronous.
import * as fs from './fs.js'

const later =
	(call) =>
	(...args) => {
		try {
			return Promise.resolve(call(...args))
		} catch (error) {
			return Promise.reject(error)
		}
	}

export const readFile = later(fs.readFileSync)
export const writeFile = later(fs.writeFileSync)
export const readdir = later(fs.readdirSync)
export const stat = later(fs.statSync)
export const mkdir = later(fs.mkdirSync)
export const rm = later(fs.rmSync)
export const rename = later(fs.renameSync)
export const copyFile = later(fs.copyFileSync)
export const mkdtemp = later(fs.mkdtempSync)
export const realpath = later(fs.realpathSync)
/** Only the helper's Node server opens files, and the app serves the build itself. */
export const open = later(() => {
	throw new Error('fs/promises open has no stand-in: the Mac app serves the build')
})

export default {readFile, writeFile, readdir, stat, mkdir, rm, rename, copyFile, mkdtemp, realpath, open}
```

`scripts/data-editor-jsc/path.js`:

```js
// node:path for the helper in JavaScriptCore: POSIX paths, as on the Mac.

export const sep = '/'
export const delimiter = ':'

export function normalize(file) {
	let absolute = file.startsWith('/')
	let parts = []
	for (let part of file.split('/')) {
		if (part === '' || part === '.') continue
		if (part === '..') {
			if (parts.length > 0 && parts.at(-1) !== '..') parts.pop()
			else if (!absolute) parts.push('..')
		} else parts.push(part)
	}
	let joined = (absolute ? '/' : '') + parts.join('/')
	return joined || (absolute ? '/' : '.')
}

export function join(...parts) {
	return normalize(parts.filter((part) => part !== '').join('/'))
}

export function resolve(...parts) {
	let resolved = ''
	for (let part of parts) resolved = part.startsWith('/') ? part : `${resolved}/${part}`
	if (!resolved.startsWith('/')) resolved = `${globalThis.__host.cwd()}/${resolved}`
	return normalize(resolved)
}

export function isAbsolute(file) {
	return file.startsWith('/')
}

export function dirname(file) {
	let normal = normalize(file)
	let slash = normal.lastIndexOf('/')
	if (slash > 0) return normal.slice(0, slash)
	return normal.startsWith('/') ? '/' : '.'
}

export function basename(file, extension) {
	let base = normalize(file).split('/').at(-1)
	return extension && base.endsWith(extension) ? base.slice(0, -extension.length) : base
}

export function extname(file) {
	let base = basename(file)
	let dot = base.lastIndexOf('.')
	return dot <= 0 ? '' : base.slice(dot)
}

export function relative(from, to) {
	let a = resolve(from).split('/').filter(Boolean)
	let b = resolve(to).split('/').filter(Boolean)
	let shared = 0
	while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared++
	return [...a.slice(shared).map(() => '..'), ...b.slice(shared)].join('/')
}

export function parse(file) {
	let base = basename(file)
	let ext = extname(file)
	return {
		root: file.startsWith('/') ? '/' : '',
		dir: dirname(file),
		base,
		ext,
		name: ext ? base.slice(0, -ext.length) : base,
	}
}

export function format(parts) {
	return (parts.dir ? `${parts.dir}/` : '') + (parts.base ?? (parts.name ?? '') + (parts.ext ?? ''))
}

const path = {sep, delimiter, normalize, join, resolve, isAbsolute, dirname, basename, extname, relative, parse, format}
path.posix = path
export const posix = path
export default path
```

`scripts/data-editor-jsc/url.js`:

```js
// node:url for the helper in JavaScriptCore: file URLs to paths and back.

export function fileURLToPath(url) {
	return decodeURIComponent(String(url).replace(/^file:\/\//u, ''))
}

export function pathToFileURL(file) {
	return new URL(`file://${encodeURI(file)}`)
}

export default {fileURLToPath, pathToFileURL}
```

`scripts/data-editor-jsc/util.js`:

```js
// node:util for the helper in JavaScriptCore: what its dependencies reach for.
// parseArgs serves the scripts' command lines, which the app never runs.

export function parseArgs() {
	throw new Error('parseArgs has no stand-in: the Mac app runs no command line')
}

export function inspect(value) {
	try {
		return JSON.stringify(value)
	} catch {
		return String(value)
	}
}

export function format(...values) {
	return values.map(String).join(' ')
}

export function deprecate(fn) {
	return fn
}

export function inherits(constructor, parent) {
	Object.setPrototypeOf(constructor.prototype, parent.prototype)
}

export const types = {}

export default {parseArgs, inspect, format, deprecate, inherits, types}
```

`scripts/data-editor-jsc/module.js`:

```js
// node:module for the helper in JavaScriptCore. esbuild bundles every
// dependency, so nothing is left to require at run time.

export function createRequire() {
	return (id) => {
		throw new Error(`require('${id}') has no stand-in: esbuild bundles every dependency`)
	}
}

export default {createRequire}
```

`scripts/data-editor-jsc/child-process.js`:

```js
// node:child_process for the helper in JavaScriptCore. The helper runs
// bundle-data as `spawn(node, [script, ...args])`; the host runs that script
// in a fresh context instead and hands back its exit code and error output.

export function spawn(_command, args) {
	let listeners = {}
	let errorListeners = []
	let child = {
		stderr: {
			setEncoding() {},
			on(event, listener) {
				if (event === 'data') errorListeners.push(listener)
			},
		},
		on(event, listener) {
			;(listeners[event] ??= []).push(listener)
			return child
		},
	}
	child.once = child.on
	globalThis.setTimeout(() => {
		let {code, stderr} = globalThis.__host.runScript(String(args[0]), args.slice(1).map(String))
		if (stderr) for (let listener of errorListeners) listener(stderr)
		for (let event of ['exit', 'close']) for (let listener of listeners[event] ?? []) listener(code, null)
	}, 0)
	return child
}

export default {spawn}
```

`scripts/data-editor-jsc/unavailable.js`:

```js
// node:http, node:readline and node:buffer for the helper in JavaScriptCore.
// Only the helper's Node command line and server use them, which the Mac app
// replaces with its own.

const unavailable = (name) => () => {
	throw new Error(`${name} has no stand-in in the Mac app`)
}

export const createServer = unavailable('http.createServer')
export const createInterface = unavailable('readline.createInterface')
export const Buffer = {isBuffer: () => false, from: unavailable('Buffer.from')}

export default {createServer, createInterface, Buffer}
```

`scripts/data-editor-jsc/process.js`:

```js
// node:process for the helper in JavaScriptCore: the host's `process` global.
export default globalThis.process
```

`scripts/data-editor-jsc/oxfmt.js`:

```js
// oxfmt for the helper in JavaScriptCore. Its add-on loads only into Node, so
// the host runs oxfmt's standalone binary on the text instead.

export async function format(file, source, options) {
	return globalThis.__host.oxfmt(file, source, JSON.stringify(options))
}
```

`scripts/data-editor-jsc/react-native.js`:

```js
// react-native-url-polyfill asks React Native for its blob module; the Mac
// app has none, so it creates no blob URLs.
export const NativeModules = {}
```

`scripts/data-editor-jsc/globals.js`:

```js
// The web's URL, which JavaScriptCore's plain context lacks and the data
// scripts and their validators use. This one handles international domain
// names differently from Node's; the data has none.
import {URL, URLSearchParams} from 'react-native-url-polyfill/js/URL.js'

globalThis.URL ??= URL
globalThis.URLSearchParams ??= URLSearchParams
```

`scripts/data-editor-jsc/entry.mjs`:

```js
// The helper as the Mac app loads it: its handlers, and the protocol they speak.
import {PROTOCOL, createHandlers} from '../data-editor-helper.mjs'

globalThis.dataEditorHelper = {PROTOCOL, createHandlers}
```

- [ ] **Step 5: Write the build**

Replace `scripts/build-data-editor-helper.mjs` with:

```js
#!/usr/bin/env node
// Bundles the data editor's helper and bundle-data for JavaScriptCore, each
// into one plain script, with Node's built-ins swapped for the stand-ins in
// data-editor-jsc/, which reach the Mac app's Swift host. Master's data
// deploy publishes them to GitHub Pages beside the data, with helper.json
// naming the commit they came from and the protocol the helper speaks. A
// Node built-in with no stand-in fails the build, so the app never meets it.

import {execFileSync} from 'node:child_process'
import {mkdir, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {parseArgs} from 'node:util'
import {build} from 'esbuild'
import {PROTOCOL} from './data-editor-helper.mjs'
import {REPO_ROOT} from './paths.mjs'

const STAND_INS = path.join(import.meta.dirname, 'data-editor-jsc')

/** Each module the scripts import that JavaScriptCore lacks, by its stand-in. */
const STAND_IN_FOR = {
	fs: 'fs.js',
	'fs/promises': 'fs-promises.js',
	path: 'path.js',
	url: 'url.js',
	util: 'util.js',
	module: 'module.js',
	child_process: 'child-process.js',
	http: 'unavailable.js',
	readline: 'unavailable.js',
	buffer: 'unavailable.js',
	process: 'process.js',
	oxfmt: 'oxfmt.js',
	'react-native': 'react-native.js',
}

const standIns = {
	name: 'data-editor-jsc',
	setup(builder) {
		builder.onResolve(
			{
				filter:
					/^(?:react-native|oxfmt|(?:node:)?(?:fs|fs\/promises|path|url|util|module|child_process|http|readline|buffer|process))$/u,
			},
			(args) => ({path: path.join(STAND_INS, STAND_IN_FOR[args.path.replace(/^node:/u, '')])}),
		)
	},
}

const headCommit = () =>
	execFileSync('git', ['rev-parse', 'HEAD'], {cwd: REPO_ROOT, encoding: 'utf8'}).trim()

export async function buildHelper({
	outDir = path.join(REPO_ROOT, 'macos/DataEditor/build/helper'),
	commit = headCommit(),
} = {}) {
	await rm(outDir, {recursive: true, force: true})
	await mkdir(outDir, {recursive: true})
	let shared = {
		bundle: true,
		format: 'iife',
		platform: 'neutral',
		target: 'es2022',
		mainFields: ['module', 'main'],
		conditions: ['import', 'default'],
		logLevel: 'warning',
		plugins: [standIns],
		inject: [path.join(STAND_INS, 'globals.js')],
		// the app reads this line to tell a script from one deploy apart from another's
		banner: {js: `// data-editor commit ${commit}`},
		define: {
			// one file holds every module, so each one's CLI guard would be true
			'import.meta.main': 'false',
			// the scripts find ../data and ../images from their own folder,
			// which the app says is the workspace's scripts/
			'import.meta.dirname': 'globalThis.__scriptDir',
			'import.meta.url': 'globalThis.__scriptURL',
		},
	}
	await build({
		...shared,
		entryPoints: [path.join(STAND_INS, 'entry.mjs')],
		outfile: path.join(outDir, 'helper.js'),
	})
	await build({
		...shared,
		entryPoints: [path.join(REPO_ROOT, 'scripts/bundle-data.mjs')],
		outfile: path.join(outDir, 'bundle-data.js'),
	})
	await writeFile(path.join(outDir, 'helper.json'), `${JSON.stringify({commit, protocol: PROTOCOL})}\n`)
	return outDir
}

if (import.meta.main) {
	let {values} = parseArgs({options: {out: {type: 'string'}, commit: {type: 'string'}}})
	let outDir = values.out === undefined ? undefined : path.resolve(values.out)
	console.log(`data editor helper -> ${await buildHelper({outDir, commit: values.commit})}`)
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test scripts/build-data-editor-helper.test.mjs scripts/data-editor-helper.test.mjs`
Expected: PASS. If `data-editor-helper.test.mjs` checks the build reply as `{ok: true}`, update its expectation to include `dir` (a string under the out folder), since the reply now carries it.

- [ ] **Step 7: Format, lint, commit**

```bash
mise run format
git add scripts/data-editor-jsc scripts/build-data-editor-helper.mjs scripts/build-data-editor-helper.test.mjs scripts/data-editor-helper.mjs scripts/data-editor-helper.test.mjs
git commit -m "Bundle the data editor's helper for JavaScriptCore

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Run the helper in JavaScriptCore

**Files:**
- Create: `macos/DataEditor/DataEditorKit/Sources/DataEditorKit/HelperRuntime.swift`
- Test: `macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/HelperRuntimeTests.swift`

**Interfaces:**
- Consumes: Task 1's host contract (`__host` and the globals) and `globalThis.dataEditorHelper = {PROTOCOL, createHandlers}`.
- Produces:
  - `public final class HelperRuntime: @unchecked Sendable`
  - `public init(scripts: URL, data: URL, out: URL, oxfmt: URL) throws` — loads `scripts/helper.js` and calls `createHandlers({dataDir, outDir, bundleData: scripts/bundle-data.js})`.
  - `public func call(_ method: String, paramsJSON: String) async throws -> String` — the reply as JSON text.
  - `public let helperProtocol: Int` — the loaded helper's `PROTOCOL`.
  - `public static let protocolVersion = 1`
  - `public struct Failure: LocalizedError, Equatable, Sendable { public let message: String }`

- [ ] **Step 1: Write the failing tests**

`HelperRuntimeTests.swift`:

```swift
import Foundation
import Testing
@testable import DataEditorKit

/// A folder holding `helper.js` (the handlers below) and `bundle-data.js`, as the build writes them.
private func scripts(handlers: String, bundleData: String = "") throws -> URL {
    let folder = FileManager.default.temporaryDirectory.appending(path: "helper runtime \(UUID().uuidString)/scripts")
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    try Data("globalThis.dataEditorHelper = {PROTOCOL: 7, createHandlers: (options) => ({\(handlers)})}".utf8)
        .write(to: folder.appending(path: "helper.js"))
    try Data(bundleData.utf8).write(to: folder.appending(path: "bundle-data.js"))
    return folder
}

private func runtime(_ folder: URL, oxfmt: URL = URL(filePath: "/usr/bin/false")) throws -> HelperRuntime {
    let workspace = folder.deletingLastPathComponent()
    return try HelperRuntime(scripts: folder, data: workspace.appending(path: "data"), out: workspace.appending(path: "out"), oxfmt: oxfmt)
}

/// A stand-in for oxfmt's binary: writes `output` over the file it is given, after keeping its config beside it.
private func fakeOxfmt(output: String, exitCode: Int32 = 0) throws -> URL {
    let file = FileManager.default.temporaryDirectory.appending(path: "oxfmt \(UUID().uuidString)")
    try Data("""
        #!/bin/sh
        printf '%s' '\(output)' > "$3"
        echo 'oxfmt said no' >&2
        exit \(exitCode)
        """.utf8).write(to: file)
    try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: file.path)
    return file
}

/// What `runScript` hands back, and whether the script's globals reached the helper's context.
private struct Ran: Decodable, Equatable { let code: Int; let stderr: String; let leaked: Bool }

/// What the oxfmt stand-in hands back.
private struct Formatted: Decodable, Equatable {
    struct Problem: Decodable, Equatable { let message: String }
    let code: String
    let errors: [Problem]
}

struct HelperRuntimeTests {
    @Test func answersWithTheHandlersReplyInItsOwnKeyOrder() async throws {
        let helper = try runtime(try scripts(handlers: "echo: async (params) => params"))
        #expect(try await helper.call("echo", paramsJSON: #"{"b":1,"a":[2,"x"]}"#) == #"{"b":1,"a":[2,"x"]}"#)
        #expect(helper.helperProtocol == 7)
    }

    @Test func throwsTheHandlersMessage() async throws {
        let helper = try runtime(try scripts(handlers: "fail: () => { throw new Error('nope') }"))
        await #expect(throws: HelperRuntime.Failure(message: "nope")) { try await helper.call("fail", paramsJSON: "{}") }
        await #expect(throws: HelperRuntime.Failure(message: "no method missing")) { try await helper.call("missing", paramsJSON: "{}") }
    }

    @Test func runsTimersBeforeAnswering() async throws {
        let helper = try runtime(try scripts(handlers: """
            later: () => new Promise((resolve) => setTimeout(() => resolve('late'), 20)),
            cancelled: () => new Promise((resolve) => { let t = setTimeout(() => resolve('first'), 5); clearTimeout(t); setTimeout(() => resolve('second'), 10) }),
            """))
        #expect(try await helper.call("later", paramsJSON: "{}") == #""late""#)
        #expect(try await helper.call("cancelled", paramsJSON: "{}") == #""second""#)
    }

    @Test func failsACallWhosePromiseNeverSettles() async throws {
        let helper = try runtime(try scripts(handlers: "hang: () => new Promise(() => {})"))
        await #expect(throws: HelperRuntime.Failure(message: "The helper's hang never finished")) { try await helper.call("hang", paramsJSON: "{}") }
    }

    @Test func readsAndWritesFilesForTheScripts() async throws {
        let folder = try scripts(handlers: """
            files: async () => {
                let dir = __scriptDir + '/../data/sub'
                __host.mkdir(dir, true)
                __host.writeFile(dir + '/b.yaml', 'b: 1\\n')
                __host.writeFile(dir + '/a.yaml', 'a: 1\\n')
                __host.rename(dir + '/a.yaml', dir + '/c.yaml')
                let listed = __host.readdir(dir).sort()
                let read = __host.readFile(dir + '/c.yaml')
                let missing = [__host.readFile(dir + '/gone.yaml'), __host.stat(dir + '/gone.yaml'), __host.readdir(dir + '/gone')]
                let stat = __host.stat(dir)
                __host.rm(dir)
                return {listed, read, missing, isDirectory: stat.isDirectory, gone: __host.stat(dir)}
            }
            """)
        let reply = try await runtime(folder).call("files", paramsJSON: "{}")
        #expect(reply == #"{"listed":["b.yaml","c.yaml"],"read":"a: 1\n","missing":[null,null,null],"isDirectory":true,"gone":null}"#)
    }

    /// The helper runs bundle-data as a second program, and reads its exit code and its last error line.
    @Test func runsAScriptInItsOwnContext() async throws {
        let folder = try scripts(
            handlers: """
                run: async (params) => ({...__host.runScript(__scriptDir + '/bundle-data.js', params.args), leaked: globalThis.leaked === true}),
                """,
            bundleData: """
                if (process.argv[2] === 'fail') throw new TypeError('bad data')
                if (process.argv[2] === 'exit') process.exit(3)
                globalThis.leaked = true
                setTimeout(() => { process.exitCode = process.argv.length }, 5)
                """)
        let helper = try runtime(folder)
        func run(_ args: String) async throws -> Ran {
            try JSONDecoder().decode(Ran.self, from: Data(try await helper.call("run", paramsJSON: #"{"args":\#(args)}"#).utf8))
        }
        #expect(try await run(#"["ok","x"]"#) == Ran(code: 4, stderr: "", leaked: false))
        #expect(try await run(#"["exit"]"#) == Ran(code: 3, stderr: "", leaked: false))
        let failed = try await run(#"["fail"]"#)
        #expect(failed.code == 1)
        #expect(failed.stderr.hasPrefix("TypeError: bad data\n"))
    }

    @Test func formatsThroughTheOxfmtBinary() async throws {
        let folder = try scripts(handlers: """
            format: async (params) => __host.oxfmt(params.file, params.text, JSON.stringify({useTabs: true})),
            """)
        func format(_ helper: HelperRuntime) async throws -> Formatted {
            let reply = try await helper.call("format", paramsJSON: #"{"file":"building-hours/1-1-cage.yaml","text":"a:   1"}"#)
            return try JSONDecoder().decode(Formatted.self, from: Data(reply.utf8))
        }
        #expect(try await format(try runtime(folder, oxfmt: try fakeOxfmt(output: "a: 1"))) == Formatted(code: "a: 1", errors: []))
        // a refusal hands the text back unchanged, with oxfmt's own words
        #expect(try await format(try runtime(folder, oxfmt: try fakeOxfmt(output: "", exitCode: 1)))
            == Formatted(code: "a:   1", errors: [.init(message: "oxfmt said no\n")]))
    }
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter HelperRuntimeTests`
Expected: FAIL to compile: `cannot find 'HelperRuntime' in scope`.

- [ ] **Step 3: Write `HelperRuntime.swift`**

```swift
import Foundation
import JavaScriptCore

/// Runs the data editor's helper, built for JavaScriptCore by
/// `scripts/build-data-editor-helper.mjs`, in this process. The scripts reach
/// Node's built-ins through stand-ins that call the host functions here, as
/// `__host`. One serial queue owns the virtual machine, so calls run in order,
/// as the helper's process once answered them; each returns once the promise
/// it made settles, running the timers due before then.
public final class HelperRuntime: @unchecked Sendable {
    public struct Failure: LocalizedError, Equatable, Sendable {
        public let message: String
        public var errorDescription: String? { message }
        public init(message: String) { self.message = message }
    }

    /// The version of the handlers' parameters and replies this app speaks.
    /// `PROTOCOL` in `scripts/data-editor-helper.mjs` changes with it.
    public static let protocolVersion = 1

    /// The loaded helper's `PROTOCOL`.
    public let helperProtocol: Int

    private let queue: DispatchQueue
    private let context: JSContext
    private let handlers: JSValue
    private let timers: TimerLoop

    /// Loads `scripts/helper.js` and makes its handlers over `data` and `out`.
    public init(scripts: URL, data: URL, out: URL, oxfmt: URL) throws {
        let helperFile = scripts.appending(path: "helper.js")
        let source = try String(contentsOf: helperFile, encoding: .utf8)
        let queue = DispatchQueue(label: "com.drewvolz.allaboutolaf-data-editor.helper")
        let timers = TimerLoop()
        let (context, handlers, helperProtocol) = try queue.sync { () throws -> (JSContext, JSValue, Int) in
            let machine = JSVirtualMachine()!
            let context = JSContext(virtualMachine: machine)!
            Self.install(in: context, argv: ["node", helperFile.path], timers: timers, scripts: scripts, oxfmt: oxfmt, machine: machine) {
                FileHandle.standardError.write(Data($0.utf8))
            }
            var thrown: String?
            context.exceptionHandler = { _, error in thrown = Self.describe(error) }
            context.evaluateScript(source, withSourceURL: helperFile)
            guard thrown == nil, let helper = context.objectForKeyedSubscript("dataEditorHelper"), helper.isObject else {
                throw Failure(message: thrown ?? "helper.js did not define dataEditorHelper")
            }
            let options = ["dataDir": data.path, "outDir": out.path, "bundleData": scripts.appending(path: "bundle-data.js").path]
            let handlers = helper.forProperty("createHandlers").call(withArguments: [options])
            if let thrown { throw Failure(message: thrown) }
            // an error thrown later belongs to a call, which reports it itself
            context.exceptionHandler = { _, error in
                FileHandle.standardError.write(Data("helper: \(Self.describe(error))\n".utf8))
            }
            return (context, handlers!, Int(helper.forProperty("PROTOCOL").toInt32()))
        }
        self.queue = queue
        self.timers = timers
        self.context = context
        self.handlers = handlers
        self.helperProtocol = helperProtocol
    }

    /// Calls the handler `method` with `paramsJSON`, and returns its reply as JSON.
    public func call(_ method: String, paramsJSON: String) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            queue.async { continuation.resume(with: Result { try self.run(method, paramsJSON) }) }
        }
    }

    private func run(_ method: String, _ paramsJSON: String) throws -> String {
        guard let handler = handlers.forProperty(method), handler.isObject else { throw Failure(message: "no method \(method)") }
        let json = context.objectForKeyedSubscript("JSON")!
        let params = json.invokeMethod("parse", withArguments: [paramsJSON])!
        let box = context.objectForKeyedSubscript("__invoke").call(withArguments: [handler, params])!
        timers.drain { box.forProperty("done").toBool() }
        guard box.forProperty("done").toBool() else { throw Failure(message: "The helper's \(method) never finished") }
        if let error = box.forProperty("error"), error.isString { throw Failure(message: error.toString()) }
        return json.invokeMethod("stringify", withArguments: [box.forProperty("value") as Any])?.toString() ?? "null"
    }

    /// An uncaught error as Node prints one: "Name: message", then the stack.
    private static func describe(_ error: JSValue?) -> String {
        guard let error else { return "Error" }
        let stack = error.forProperty("stack")?.toString() ?? ""
        return stack.isEmpty || stack == "undefined" ? error.toString() : "\(error.toString()!)\n\(stack)"
    }

    /// Runs `path` in a fresh context with `args`, as Node would run it in a
    /// process of its own, and returns its exit code and error output.
    private static func runScript(_ path: String, args: [String], scripts: URL, oxfmt: URL, machine: JSVirtualMachine) -> [String: Any] {
        let context = JSContext(virtualMachine: machine)!
        let timers = TimerLoop()
        var errors = ""
        var code: Int32 = 0
        install(in: context, argv: ["node", path] + args, timers: timers, scripts: scripts, oxfmt: oxfmt, machine: machine) { errors += $0 }
        context.exceptionHandler = { context, error in
            guard let context, let error else { return }
            if error.isInstance(of: context.objectForKeyedSubscript("__Exit")) {
                code = error.forProperty("code").toInt32()
            } else {
                errors += describe(error) + "\n"
                code = 1
            }
        }
        guard let source = try? String(contentsOfFile: path, encoding: .utf8) else {
            return ["code": 1, "stderr": "Error: ENOENT: no such file or directory, open '\(path)'\n"]
        }
        context.evaluateScript(source, withSourceURL: URL(filePath: path))
        timers.drain { false }
        if code == 0, let exitCode = context.evaluateScript("process.exitCode"), exitCode.isNumber { code = exitCode.toInt32() }
        return ["code": code, "stderr": errors]
    }

    /// Gives `context` the host functions and globals the stand-ins call.
    private static func install(in context: JSContext, argv: [String], timers: TimerLoop, scripts: URL, oxfmt: URL,
                                machine: JSVirtualMachine, stderr: @escaping (String) -> Void) {
        let fm = FileManager.default
        let host = JSValue(newObjectIn: context)!
        func define(_ name: String, _ block: Any) { host.setObject(block, forKeyedSubscript: name as NSString) }
        define("readFile", { (path: String) -> Any in (try? String(contentsOfFile: path, encoding: .utf8)) ?? NSNull() } as @convention(block) (String) -> Any)
        define("writeFile", { (path: String, text: String) in
            try? text.write(toFile: path, atomically: true, encoding: .utf8)
        } as @convention(block) (String, String) -> Void)
        define("readdir", { (path: String) -> Any in (try? fm.contentsOfDirectory(atPath: path)) ?? NSNull() } as @convention(block) (String) -> Any)
        define("stat", { (path: String) -> Any in
            var isDirectory: ObjCBool = false
            guard fm.fileExists(atPath: path, isDirectory: &isDirectory), let attributes = try? fm.attributesOfItem(atPath: path) else { return NSNull() }
            let modified = (attributes[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0
            return ["isDirectory": isDirectory.boolValue, "size": (attributes[.size] as? NSNumber) ?? 0, "mtimeMs": modified * 1000]
        } as @convention(block) (String) -> Any)
        define("mkdir", { (path: String, recursive: Bool) in
            try? fm.createDirectory(atPath: path, withIntermediateDirectories: recursive)
        } as @convention(block) (String, Bool) -> Void)
        define("rm", { (path: String) in try? fm.removeItem(atPath: path) } as @convention(block) (String) -> Void)
        define("rename", { (from: String, to: String) in
            try? fm.removeItem(atPath: to)
            try? fm.moveItem(atPath: from, toPath: to)
        } as @convention(block) (String, String) -> Void)
        define("copyFile", { (from: String, to: String) in
            try? fm.removeItem(atPath: to)
            try? fm.copyItem(atPath: from, toPath: to)
        } as @convention(block) (String, String) -> Void)
        define("realpath", { (path: String) -> String in URL(filePath: path).resolvingSymlinksInPath().path } as @convention(block) (String) -> String)
        define("mkdtemp", { (prefix: String) -> String in
            let path = prefix + String(UUID().uuidString.prefix(6))
            try? fm.createDirectory(atPath: path, withIntermediateDirectories: true)
            return path
        } as @convention(block) (String) -> String)
        define("cwd", { fm.currentDirectoryPath } as @convention(block) () -> String)
        define("runScript", { (path: String, args: [String]) -> Any in
            runScript(path, args: args, scripts: scripts, oxfmt: oxfmt, machine: machine)
        } as @convention(block) (String, [String]) -> Any)
        define("oxfmt", { (file: String, source: String, options: String) -> Any in
            format(file: file, source: source, options: options, oxfmt: oxfmt)
        } as @convention(block) (String, String, String) -> Any)
        context.setObject(host, forKeyedSubscript: "__host" as NSString)
        context.setObject(scripts.path, forKeyedSubscript: "__scriptDir" as NSString)
        context.setObject(scripts.appending(path: "helper.js").absoluteString, forKeyedSubscript: "__scriptURL" as NSString)
        context.setObject(argv, forKeyedSubscript: "__argv" as NSString)
        context.setObject({ (callback: JSValue, delay: Double) -> Int in timers.add(callback, after: delay) }
            as @convention(block) (JSValue, Double) -> Int, forKeyedSubscript: "__setTimeout" as NSString)
        context.setObject({ (id: Int) in timers.cancel(id) } as @convention(block) (Int) -> Void, forKeyedSubscript: "clearTimeout" as NSString)
        context.setObject({ (text: String) in stderr(text) } as @convention(block) (String) -> Void, forKeyedSubscript: "__stderr" as NSString)
        context.evaluateScript(#"""
            globalThis.setTimeout = (callback, delay, ...args) => __setTimeout(() => callback(...args), delay ?? 0)
            globalThis.setImmediate = (callback, ...args) => __setTimeout(() => callback(...args), 0)
            globalThis.queueMicrotask = (callback) => Promise.resolve().then(callback)
            const __line = (...values) => values.map((value) => {
                if (typeof value === 'string') return value
                try { return JSON.stringify(value) } catch { return String(value) }
            }).join(' ') + '\n'
            globalThis.console = {log: (...v) => __stderr(__line(...v)), info: (...v) => __stderr(__line(...v)),
                warn: (...v) => __stderr(__line(...v)), error: (...v) => __stderr(__line(...v))}
            globalThis.__Exit = class { constructor(code) { this.code = code } }
            globalThis.process = {argv: __argv, env: {}, platform: 'darwin', versions: {node: '24'}, execPath: 'node',
                exitCode: undefined, exit(code) { throw new __Exit(code ?? process.exitCode ?? 0) }, cwd: () => __host.cwd(),
                stdout: {write: (text) => { __stderr(String(text)); return true }},
                stderr: {write: (text) => { __stderr(String(text)); return true }},
                emitWarning() {}, on() {}, nextTick: (callback, ...args) => queueMicrotask(() => callback(...args))}
            globalThis.__invoke = (handler, params) => {
                let box = {done: false}
                new Promise((resolve) => resolve(handler(params))).then(
                    (value) => { box.done = true; box.value = value },
                    (error) => { box.done = true; box.error = error instanceof Error ? error.message : String(error) })
                return box
            }
            """#)
    }

    /// Writes `source` to a file named like `file` in a folder of its own,
    /// formats it there with oxfmt's binary and `options` as its config, and
    /// reads the result back, as oxfmt's `format` replies.
    private static func format(file: String, source: String, options: String, oxfmt: URL) -> [String: Any] {
        let fm = FileManager.default
        let folder = fm.temporaryDirectory.appending(path: "data-editor-oxfmt-\(UUID().uuidString)")
        defer { try? fm.removeItem(at: folder) }
        let target = folder.appending(path: (file as NSString).lastPathComponent)
        let config = folder.appending(path: ".oxfmtrc.json")
        do {
            try fm.createDirectory(at: folder, withIntermediateDirectories: true)
            try Data(source.utf8).write(to: target)
            try Data(options.utf8).write(to: config)
            let process = Process()
            let errors = Pipe()
            process.executableURL = oxfmt
            process.arguments = ["-c", config.path, target.path]
            process.currentDirectoryURL = folder
            process.standardOutput = FileHandle.nullDevice
            process.standardError = errors
            try process.run()
            let said = errors.fileHandleForReading.readDataToEndOfFile()
            process.waitUntilExit()
            guard process.terminationStatus == 0 else {
                return ["code": source, "errors": [["message": String(decoding: said, as: UTF8.self)]]]
            }
            return ["code": try String(contentsOf: target, encoding: .utf8), "errors": [Any]()]
        } catch {
            return ["code": source, "errors": [["message": error.localizedDescription]]]
        }
    }
}

/// The timers one context has set, run in the order they fall due.
private final class TimerLoop {
    private var timers: [(id: Int, due: Date, callback: JSValue)] = []
    private var next = 1

    func add(_ callback: JSValue, after milliseconds: Double) -> Int {
        let id = next
        next += 1
        timers.append((id, Date.now.addingTimeInterval(max(milliseconds, 0) / 1000), callback))
        return id
    }

    func cancel(_ id: Int) { timers.removeAll { $0.id == id } }

    /// Runs timers in the order they fall due, waiting for each, until `done` holds or none is left.
    func drain(until done: () -> Bool) {
        while !done(), let index = timers.indices.min(by: { timers[$0].due < timers[$1].due }) {
            let timer = timers.remove(at: index)
            let wait = timer.due.timeIntervalSinceNow
            if wait > 0 { Thread.sleep(forTimeInterval: wait) }
            timer.callback.call(withArguments: [])
        }
    }
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter HelperRuntimeTests`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add macos/DataEditor/DataEditorKit/Sources/DataEditorKit/HelperRuntime.swift macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/HelperRuntimeTests.swift
git commit -m "Run the data editor's helper in JavaScriptCore

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```


---

### Task 3: Prove JavaScriptCore matches Node

**Files:**
- Test: `macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/HelperParityTests.swift`

**Interfaces:**
- Consumes: Task 1's CLI (`node scripts/build-data-editor-helper.mjs --out <dir> --commit <sha>`), Task 2's `HelperRuntime(scripts:data:out:oxfmt:)` and `call(_:paramsJSON:)`, and the Node helper's JSON-lines command line (`node scripts/data-editor-helper.mjs --data <dir> --out <dir>`, one `{"id","method","params"}` per line, replies `{"id","result"}` or `{"id","error":{"message"}}`).
- Produces: nothing later tasks call. It is the net under the stand-ins.

This test is the spike's check, kept: the same steps through both engines, on two copies of the repo's data, must give the same replies, the same data files and the same build files. It needs Node, so it runs only with `DATA_EDITOR_NODE` set, as the UI tests do.

- [ ] **Step 1: Write the test**

```swift
import Foundation
import Testing
@testable import DataEditorKit

/// The checkout this test runs in.
private let repo = URL(filePath: #filePath)
    .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()

private let node = ProcessInfo.processInfo.environment["DATA_EDITOR_NODE"]

/// The helper calls both engines make, in order: each kind of reply, an edit
/// oxfmt reformats, an edit the schema refuses, one the overlap check
/// refuses, a file that is not there, and builds between them.
private let steps: [(method: String, params: String)] = [
    ("list", "{}"),
    ("calendar", "{}"),
    ("load", #"{"file":"building-hours/1-1-cage.yaml"}"#),
    ("load", #"{"file":"building-hours/not-a-building.yaml"}"#),
    ("build", "{}"),
    ("edit", #"{"file":"building-hours/1-1-cage.yaml","ops":[{"path":["links",0,"url"],"value":"https://example.com/\#(String(repeating: "a", count: 100))"}]}"#),
    ("edit", #"{"file":"building-hours/1-1-cage.yaml","ops":[{"path":["name"],"value":5}]}"#),
    ("build", "{}"),
    ("edit", #"{"file":"building-hours/1-1-cage.yaml","ops":[{"path":["name"],"value":"The Cage"},{"path":["schedule",0,"hours",1,"days"],"value":["Fr","Sa"]}]}"#),
    ("edit", #"{"file":"building-hours/1-1-cage.yaml","ops":[{"path":["schedule",0,"hours",1,"days"],"value":["Sa","Su"]}]}"#),
    ("build", "{}"),
]

/// A copy of the data and the published images, as the app downloads them.
private func workspace(_ name: String, in folder: URL) throws -> URL {
    let fm = FileManager.default
    let root = folder.appending(path: name)
    try fm.createDirectory(at: root, withIntermediateDirectories: true)
    try fm.copyItem(at: repo.appending(path: "data"), to: root.appending(path: "data"))
    try fm.copyItem(at: repo.appending(path: "images"), to: root.appending(path: "images"))
    return root
}

private func run(_ executable: String, _ arguments: [String], input: String = "") throws -> String {
    let process = Process()
    let stdin = Pipe(), stdout = Pipe()
    process.executableURL = URL(filePath: executable)
    process.arguments = arguments
    process.currentDirectoryURL = repo
    process.standardInput = stdin
    process.standardOutput = stdout
    process.standardError = FileHandle.standardError
    try process.run()
    try stdin.fileHandleForWriting.write(contentsOf: Data(input.utf8))
    try stdin.fileHandleForWriting.close()
    let output = stdout.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    return String(decoding: output, as: UTF8.self)
}

/// A reply as both engines can be compared: the result, or the error's message,
/// without the build's folder, whose name differs between the two workspaces.
private func normalized(result: Any?, error: String?) throws -> String {
    var value: Any = error.map { ["error": $0] } ?? result ?? NSNull()
    if var object = value as? [String: Any] {
        object["dir"] = nil
        value = object
    }
    return String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .fragmentsAllowed]), as: UTF8.self)
}

/// Every file under `folder`, by its path inside it, with its bytes.
private func files(in folder: URL) -> [String: Data] {
    var found: [String: Data] = [:]
    let prefix = folder.standardizedFileURL.path + "/"
    for case let url as URL in FileManager.default.enumerator(at: folder, includingPropertiesForKeys: nil)! {
        if let data = try? Data(contentsOf: url), !url.hasDirectoryPath {
            found[String(url.standardizedFileURL.path.dropFirst(prefix.count))] = data
        }
    }
    return found
}

@Suite(.enabled(if: node != nil, "run with DATA_EDITOR_NODE=$(mise which node)"))
struct HelperParityTests {
    @Test func javaScriptCoreGivesWhatNodeGives() async throws {
        let node = node!
        let folder = FileManager.default.temporaryDirectory.appending(path: "parity \(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: folder) }

        // Node runs the checkout's scripts, as CI does
        let nodeSide = try workspace("node", in: folder)
        let requests = steps.enumerated().map { #"{"id":\#($0.offset + 1),"method":"\#($0.element.method)","params":\#($0.element.params)}"# }
        let lines = try run(node, [repo.appending(path: "scripts/data-editor-helper.mjs").path,
                                   "--data", nodeSide.appending(path: "data").path, "--out", nodeSide.appending(path: "out").path],
                            input: requests.joined(separator: "\n") + "\n")
            .split(separator: "\n")
        var nodeReplies: [String] = []
        var nodeBuilds: [String] = []
        for line in lines {
            let reply = try JSONSerialization.jsonObject(with: Data(line.utf8)) as! [String: Any]
            let error = (reply["error"] as? [String: Any])?["message"] as? String
            nodeReplies.append(try normalized(result: reply["result"], error: error))
            if let dir = (reply["result"] as? [String: Any])?["dir"] as? String { nodeBuilds.append(dir) }
        }
        #expect(nodeReplies.count == steps.count)

        // JavaScriptCore runs the same scripts, bundled, with oxfmt's own command line standing in for its binary
        let jscSide = try workspace("jsc", in: folder)
        let scripts = jscSide.appending(path: "scripts")
        _ = try run(node, [repo.appending(path: "scripts/build-data-editor-helper.mjs").path, "--out", scripts.path, "--commit", "parity"])
        let oxfmt = folder.appending(path: "oxfmt")
        try Data("#!/bin/sh\nexec '\(node)' '\(repo.appending(path: "node_modules/oxfmt/bin/oxfmt").path)' \"$@\"\n".utf8).write(to: oxfmt)
        try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: oxfmt.path)
        let helper = try HelperRuntime(scripts: scripts, data: jscSide.appending(path: "data"), out: jscSide.appending(path: "out"), oxfmt: oxfmt)
        var jscReplies: [String] = []
        var jscBuilds: [String] = []
        for step in steps {
            do {
                let reply = try await helper.call(step.method, paramsJSON: step.params)
                let result = try JSONSerialization.jsonObject(with: Data(reply.utf8), options: .fragmentsAllowed)
                jscReplies.append(try normalized(result: result, error: nil))
                if let dir = (result as? [String: Any])?["dir"] as? String { jscBuilds.append(dir) }
            } catch let failure as HelperRuntime.Failure {
                jscReplies.append(try normalized(result: nil, error: failure.message))
            }
        }

        for (index, step) in steps.enumerated() {
            #expect(jscReplies[index] == nodeReplies[index], "step \(index + 1), \(step.method)")
        }
        #expect(files(in: jscSide.appending(path: "data")) == files(in: nodeSide.appending(path: "data")))
        #expect(jscBuilds.count == 3 && nodeBuilds.count == 3)
        for (jsc, node) in zip(jscBuilds, nodeBuilds) {
            #expect(files(in: URL(filePath: jsc)) == files(in: URL(filePath: node)))
        }
        // the steps meant to be refused were: the schema's and the overlap check's
        #expect(nodeReplies[6].contains("problems") && !nodeReplies[6].contains(#""problems":[]"#))
        #expect(nodeReplies[8].contains("problems") && !nodeReplies[8].contains(#""problems":[]"#))
    }
}
```

- [ ] **Step 2: Run it and read the result**

Run: `cd macos/DataEditor/DataEditorKit && DATA_EDITOR_NODE="$(mise which node)" swift test --filter HelperParityTests`
Expected: PASS. Tasks 1 and 2 already exist, so this test passes at once; its red is checked in Step 3.

If a step differs, the failure names it. Fix the stand-in or the host, not the test: the Node side is the reference. The spike's three gaps (`realpathSync.native`, `createWriteStream`, `URL`) are already covered in Task 1.

- [ ] **Step 3: Check the test can fail**

Temporarily change `normalize` in `scripts/data-editor-jsc/path.js` to drop the last part of every path (`parts.pop()` before the join), rebuild nothing (the test builds the helper itself), and run Step 2's command.
Expected: FAIL, naming at least one step. Put `path.js` back (`git checkout scripts/data-editor-jsc/path.js`) and run Step 2 again: PASS.

- [ ] **Step 4: Run it with Node unset**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter HelperParityTests`
Expected: the suite is skipped, with the message "run with DATA_EDITOR_NODE=$(mise which node)".

- [ ] **Step 5: Commit**

```bash
git add macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/HelperParityTests.swift
git commit -m "Check the data editor's helper gives the same results in JavaScriptCore as in Node

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Serve the build from the app

**Files:**
- Create: `macos/DataEditor/DataEditorKit/Sources/DataEditorKit/BuildServer.swift`
- Test: `macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/BuildServerTests.swift`

**Interfaces:**
- Produces:
  - `public final class BuildServer: @unchecked Sendable`
  - `public init(port: UInt16, root: @escaping @Sendable () -> URL?)` — `root` is read on every request: the newest good build's folder, or nil before the first.
  - `public func start() async throws` — throws `BuildServer.Failure.portInUse(port)` when the port is taken.
  - `public func stop()`
  - `public enum Failure: LocalizedError, Equatable { case portInUse(UInt16) }`, described as "Port \(port) is in use".
  - `static func response(method: String, target: String, root: URL?) -> Response` with `struct Response: Equatable { status: Int; headers: [String: String]; file: URL? }` (internal, for tests).

It replaces `scripts/data-editor-serve.mjs` in the app, with the same replies: GET and HEAD only (else 405, `Allow: GET, HEAD`), 400 for bad percent-encoding, 404 with `Cache-Control: no-store` for anything outside the build or not a file, and the four content types `bundle-data` writes.

- [ ] **Step 1: Write the failing tests**

```swift
import Foundation
import Network
import Testing
@testable import DataEditorKit

/// A build folder with a JSON file, an image and a nested folder.
private func build() throws -> URL {
    let root = FileManager.default.temporaryDirectory.appending(path: "build \(UUID().uuidString)")
    try FileManager.default.createDirectory(at: root.appending(path: "hours"), withIntermediateDirectories: true)
    try Data(#"{"a":1}"#.utf8).write(to: root.appending(path: "hours/cage.json"))
    try Data("RIFF".utf8).write(to: root.appending(path: "cage.webp"))
    try Data("x".utf8).write(to: root.appending(path: "notes.txt"))
    try Data("secret".utf8).write(to: root.deletingLastPathComponent().appending(path: "outside-\(root.lastPathComponent)"))
    return root
}

struct BuildServerTests {
    @Test func servesAFileWithItsTypeAndNoCaching() throws {
        let root = try build()
        let reply = BuildServer.response(method: "GET", target: "/hours/cage.json", root: root)
        #expect(reply == .init(status: 200, headers: ["Content-Type": "application/json", "Cache-Control": "no-store"],
                               file: root.appending(path: "hours/cage.json")))
        #expect(BuildServer.response(method: "HEAD", target: "/cage.webp", root: root).headers["Content-Type"] == "image/webp")
        #expect(BuildServer.response(method: "GET", target: "/cage%2Ewebp?x=1", root: root).status == 200)
    }

    @Test func refusesAPathOutsideTheBuild() throws {
        let root = try build()
        for target in ["/../outside-\(root.lastPathComponent)", "/%2e%2e/outside-\(root.lastPathComponent)", "/hours/../../outside-\(root.lastPathComponent)"] {
            #expect(BuildServer.response(method: "GET", target: target, root: root) == .init(status: 404, headers: ["Cache-Control": "no-store"], file: nil), "\(target)")
        }
    }

    @Test func answersWhatItCannotServe() throws {
        let root = try build()
        let missing = BuildServer.Response(status: 404, headers: ["Cache-Control": "no-store"], file: nil)
        #expect(BuildServer.response(method: "GET", target: "/nope.json", root: root) == missing)
        #expect(BuildServer.response(method: "GET", target: "/hours", root: root) == missing)
        #expect(BuildServer.response(method: "GET", target: "/hours/cage.json", root: nil) == missing)
        #expect(BuildServer.response(method: "GET", target: "/%zz", root: root) == .init(status: 400, headers: [:], file: nil))
        #expect(BuildServer.response(method: "POST", target: "/hours/cage.json", root: root) == .init(status: 405, headers: ["Allow": "GET, HEAD"], file: nil))
        // as Node's server did, a file of another kind goes as bytes
        #expect(BuildServer.response(method: "GET", target: "/notes.txt", root: root).headers["Content-Type"] == "application/octet-stream")
    }

    @Test func servesOverTheNetwork() async throws {
        let root = try build()
        let server = BuildServer(port: 18790, root: { root })
        try await server.start()
        defer { server.stop() }
        let (data, response) = try await URLSession.shared.data(from: URL(string: "http://127.0.0.1:18790/hours/cage.json")!)
        let http = try #require(response as? HTTPURLResponse)
        #expect(http.statusCode == 200)
        #expect(http.value(forHTTPHeaderField: "Content-Length") == "7")
        #expect(data == Data(#"{"a":1}"#.utf8))
    }

    @Test func saysWhenItsPortIsTaken() async throws {
        let first = BuildServer(port: 18791, root: { nil })
        try await first.start()
        defer { first.stop() }
        let second = BuildServer(port: 18791, root: { nil })
        await #expect(throws: BuildServer.Failure.portInUse(18791)) { try await second.start() }
        #expect(BuildServer.Failure.portInUse(8790).localizedDescription == "Port 8790 is in use")
    }
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter BuildServerTests`
Expected: FAIL to compile: `cannot find 'BuildServer' in scope`.

- [ ] **Step 3: Write `BuildServer.swift`**

```swift
import Foundation
import Network

/// Serves the newest good build to the phone and to the local Worker, on
/// every address at `port`. `root` is read on every request, so a new build is
/// served from the moment the helper reports it. Each connection asks for one
/// file and is closed once it has it.
public final class BuildServer: @unchecked Sendable {
    public enum Failure: LocalizedError, Equatable {
        case portInUse(UInt16)
        public var errorDescription: String? {
            switch self { case .portInUse(let port): "Port \(port) is in use" }
        }
    }

    struct Response: Equatable {
        let status: Int
        let headers: [String: String]
        let file: URL?
    }

    /// The types of what `bundle-data` writes.
    private static let types = ["json": "application/json", "webp": "image/webp", "css": "text/css", "geojson": "application/geo+json"]
    private static let notFound = Response(status: 404, headers: ["Cache-Control": "no-store"], file: nil)

    private let port: UInt16
    private let root: @Sendable () -> URL?
    private let queue = DispatchQueue(label: "com.drewvolz.allaboutolaf-data-editor.build-server")
    private var listener: NWListener?

    public init(port: UInt16, root: @escaping @Sendable () -> URL?) {
        self.port = port
        self.root = root
    }

    /// What a request for `target` gets: a file under `root`, or a refusal.
    static func response(method: String, target: String, root: URL?) -> Response {
        guard method == "GET" || method == "HEAD" else { return Response(status: 405, headers: ["Allow": "GET, HEAD"], file: nil) }
        let encoded = String(target.prefix { $0 != "?" && $0 != "#" })
        guard let path = encoded.removingPercentEncoding else { return Response(status: 400, headers: [:], file: nil) }
        guard let root else { return notFound }
        let base = root.standardizedFileURL
        let file = base.appending(path: path).standardizedFileURL
        var isDirectory: ObjCBool = false
        guard file.path.hasPrefix(base.path + "/"),
              FileManager.default.fileExists(atPath: file.path, isDirectory: &isDirectory), !isDirectory.boolValue else { return notFound }
        let type = types[file.pathExtension] ?? "application/octet-stream"
        return Response(status: 200, headers: ["Content-Type": type, "Cache-Control": "no-store"], file: file)
    }

    /// Listens on `port`, and returns once it is listening.
    public func start() async throws {
        let parameters = NWParameters.tcp
        parameters.allowLocalEndpointReuse = false
        let listener = try NWListener(using: parameters, on: NWEndpoint.Port(rawValue: port)!)
        self.listener = listener
        listener.newConnectionHandler = { [weak self] connection in self?.serve(connection) }
        let port = port
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, any Error>) in
            var resumed = false
            listener.stateUpdateHandler = { state in
                guard !resumed else { return }
                switch state {
                case .ready:
                    resumed = true
                    continuation.resume()
                case .failed(let error), .waiting(let error):
                    resumed = true
                    listener.cancel()
                    if case .posix(.EADDRINUSE) = error { continuation.resume(throwing: Failure.portInUse(port)) }
                    else { continuation.resume(throwing: error) }
                default: break
                }
            }
            listener.start(queue: queue)
        }
    }

    public func stop() {
        listener?.cancel()
        listener = nil
    }

    /// Reads one request head, answers it and closes the connection.
    private func serve(_ connection: NWConnection) {
        connection.start(queue: queue)
        var head = Data()
        func read() {
            connection.receive(minimumIncompleteLength: 1, maximumLength: 16_384) { [self] data, _, done, error in
                if let data { head.append(data) }
                if let end = head.range(of: Data("\r\n\r\n".utf8)) {
                    answer(String(decoding: head[..<end.lowerBound], as: UTF8.self), on: connection)
                } else if done || error != nil || head.count > 65_536 {
                    connection.cancel()
                } else {
                    read()
                }
            }
        }
        read()
    }

    private func answer(_ head: String, on connection: NWConnection) {
        let words = head.split(separator: "\r\n", maxSplits: 1).first?.split(separator: " ") ?? []
        let method = words.count > 0 ? String(words[0]) : ""
        let target = words.count > 1 ? String(words[1]) : "/"
        let reply = Self.response(method: method, target: target, root: root())
        // the file is read whole: the largest bundle-data writes is a few hundred kilobytes
        let body = reply.file.flatMap { try? Data(contentsOf: $0) }
        if reply.file != nil && body == nil {
            send(Self.notFound, body: Data(), method: method, on: connection)
        } else {
            send(reply, body: body ?? Data(), method: method, on: connection)
        }
    }

    private func send(_ reply: Response, body: Data, method: String, on connection: NWConnection) {
        let reason = [200: "OK", 400: "Bad Request", 404: "Not Found", 405: "Method Not Allowed"][reply.status] ?? ""
        var headers = reply.headers
        headers["Content-Length"] = String(body.count)
        headers["Connection"] = "close"
        let lines = ["HTTP/1.1 \(reply.status) \(reason)"] + headers.sorted { $0.key < $1.key }.map { "\($0.key): \($0.value)" }
        var message = Data((lines.joined(separator: "\r\n") + "\r\n\r\n").utf8)
        if method != "HEAD" { message.append(body) }
        connection.send(content: message, completion: .contentProcessed { _ in connection.cancel() })
    }
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter BuildServerTests`
Expected: PASS, 5 tests. If `saysWhenItsPortIsTaken` hangs instead, the listener reported neither `.failed` nor `.waiting`; log the states it passes through before changing the code.

- [ ] **Step 5: Commit**

```bash
git add macos/DataEditor/DataEditorKit/Sources/DataEditorKit/BuildServer.swift macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/BuildServerTests.swift
git commit -m "Serve the data editor's build from Swift

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Bundle oxfmt and the preview's pins

**Files:**
- Create: `scripts/data-editor-node-release.mjs`, `scripts/data-editor-node-release.test.mjs`, `macos/DataEditor/oxfmt.sha256`, `macos/DataEditor/DataEditorKit/Sources/DataEditorKit/NodeRelease.swift`
- Modify: `macos/DataEditor/scripts/embed-runtime.sh`, `macos/DataEditor/project.yml` (the Embed Runtime phase), `macos/DataEditor/DataEditor/Runtime.swift`, `mise.toml` (`data-editor:runtime` description)
- Test: `macos/DataEditor/DataEditorTests/RuntimeTests.swift`

**Interfaces:**
- Produces: `nodeRelease(lockText) → {version, url, sha256}` (JS); CLI `node scripts/data-editor-node-release.mjs <out.json>` writes it from the repo's `mise.lock`.
- Produces: `public struct NodeRelease: Codable, Equatable, Sendable { public let version: String; public let url: URL; public let sha256: String }` in the kit.
- Produces: `Runtime.oxfmt: URL` (`<root>/oxfmt`), `Runtime.nodeRelease() throws -> NodeRelease` (`<root>/node.json`), `Runtime.cccCommit() throws -> String` (`<root>/ccc-server.ref`, trimmed).

Until Tasks 6 and 8 the runtime keeps Node, the helper and ccc-server beside the new files, so the app keeps working between commits.

- [ ] **Step 1: Write the failing node:test**

`scripts/data-editor-node-release.test.mjs`:

```js
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {describe, it} from 'node:test'
import {nodeRelease} from './data-editor-node-release.mjs'
import {REPO_ROOT} from './paths.mjs'

describe("the data editor's Node pin", () => {
	it("reads the Mac's archive from the lockfile", () => {
		let lock = [
			'[tools.node."platforms.linux-x64"]',
			'checksum = "sha256:1111"',
			'url = "https://nodejs.org/dist/v24.22.0/node-v24.22.0-linux-x64.tar.gz"',
			'',
			'[tools.node."platforms.macos-arm64"]',
			'checksum = "sha256:6a97"',
			'url = "https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz"',
			'',
		].join('\n')
		assert.deepEqual(nodeRelease(lock), {
			version: '24.22.0',
			url: 'https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz',
			sha256: '6a97',
		})
	})

	it('fails on a lockfile without the entry', () => {
		assert.throws(() => nodeRelease('[tools.node]\nversion = "24"\n'), /macos-arm64/u)
	})

	it("reads the repo's own lockfile", async () => {
		let lock = await readFile(path.join(REPO_ROOT, 'mise.lock'), 'utf8')
		assert.match(nodeRelease(lock).sha256, /^[0-9a-f]{64}$/u)
	})
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test scripts/data-editor-node-release.test.mjs`
Expected: FAIL: cannot find module `./data-editor-node-release.mjs`.

- [ ] **Step 3: Write the script**

`scripts/data-editor-node-release.mjs`:

```js
#!/usr/bin/env node
// Writes the Node archive the Mac data editor downloads for its preview: the
// macOS arm64 entry of mise.lock, so the app runs the Node the repo pins and
// checks it against the SHA-256 mise checked.

import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {REPO_ROOT} from './paths.mjs'

const ENTRY = '[tools.node."platforms.macos-arm64"]'

/** The version, URL and SHA-256 of the macOS arm64 Node in `lockText`. */
export function nodeRelease(lockText) {
	let start = lockText.indexOf(ENTRY)
	if (start === -1) throw new Error(`mise.lock has no ${ENTRY} entry`)
	let entry = lockText.slice(start + ENTRY.length).split(/\n\[/u, 1)[0]
	let checksum = /^checksum = "sha256:([0-9a-f]+)"$/mu.exec(entry)?.[1]
	let url = /^url = "([^"]+)"$/mu.exec(entry)?.[1]
	let version = url && /\/v([0-9.]+)\//u.exec(url)?.[1]
	if (!checksum || !url || !version) throw new Error(`mise.lock's ${ENTRY} entry lacks a checksum or url`)
	return {version, url, sha256: checksum}
}

if (import.meta.main) {
	let out = process.argv[2]
	if (!out) throw new Error('usage: data-editor-node-release.mjs <out.json>')
	let lock = await readFile(path.join(REPO_ROOT, 'mise.lock'), 'utf8')
	await writeFile(out, `${JSON.stringify(nodeRelease(lock))}\n`)
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test scripts/data-editor-node-release.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the failing Runtime test**

Add to `macos/DataEditor/DataEditorTests/RuntimeTests.swift`, inside `RuntimeTests`:

```swift
    @Test func readsThePreviewsPinsBesideOxfmt() throws {
        let resources = FileManager.default.temporaryDirectory.appending(path: "runtime \(UUID().uuidString)")
        try FileManager.default.createDirectory(at: resources, withIntermediateDirectories: true)
        try Data(#"{"version":"24.22.0","url":"https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz","sha256":"6a97"}"#.utf8)
            .write(to: resources.appending(path: "node.json"))
        try Data("cda256d\n".utf8).write(to: resources.appending(path: "ccc-server.ref"))
        let runtime = Runtime(root: resources)

        #expect(try runtime.nodeRelease() == NodeRelease(version: "24.22.0",
                                                         url: URL(string: "https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz")!,
                                                         sha256: "6a97"))
        #expect(try runtime.cccCommit() == "cda256d")
        #expect(runtime.oxfmt == resources.appending(path: "oxfmt"))
    }
```

- [ ] **Step 6: Run it to verify it fails**

Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/runtime.log" -only-testing:DataEditorTests/RuntimeTests`
Expected: build FAILS: `value of type 'Runtime' has no member 'nodeRelease'` (and `cannot find 'NodeRelease'`).

- [ ] **Step 7: Add `NodeRelease` and the Runtime members**

`DataEditorKit/Sources/DataEditorKit/NodeRelease.swift`:

```swift
import Foundation

/// The Node archive the preview runs on: mise.lock's macOS arm64 entry,
/// written into the app as `node.json` by `scripts/data-editor-node-release.mjs`.
public struct NodeRelease: Codable, Equatable, Sendable {
    public let version: String
    public let url: URL
    /// The archive's SHA-256, in hex
    public let sha256: String

    public init(version: String, url: URL, sha256: String) {
        self.version = version
        self.url = url
        self.sha256 = sha256
    }
}
```

In `DataEditor/Runtime.swift`, below `var cccRoot`:

```swift
    /// oxfmt's standalone binary, which the helper runs to write the data in the repo's style.
    var oxfmt: URL { root.appending(path: "oxfmt") }

    /// The Node the preview downloads at its first start.
    func nodeRelease() throws -> NodeRelease {
        try JSONDecoder().decode(NodeRelease.self, from: Data(contentsOf: root.appending(path: "node.json")))
    }

    /// The ccc-server commit the preview downloads at its first start.
    func cccCommit() throws -> String {
        try String(contentsOf: root.appending(path: "ccc-server.ref"), encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines)
    }
```

and its doc comment becomes `/// What the app bundles under Contents/Resources/Runtime.`

- [ ] **Step 8: Run it to verify it passes**

Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/runtime.log" -only-testing:DataEditorTests/RuntimeTests`
Expected: `TEST SUCCEEDED`, 2 tests.

- [ ] **Step 9: Embed oxfmt and the pins**

`macos/DataEditor/oxfmt.sha256` holds one line:

```
c3d86b16de563e4542eb265702421a6c4ef5c45775a9e2958ca1b5ef6a84cf4b
```

In `embed-runtime.sh`, replace the header comment with:

```bash
# Builds macos/DataEditor/build/runtime for arm64 macOS: oxfmt's standalone
# binary, the Node archive the preview downloads (node.json) and the
# ccc-server commit it runs (ccc-server.ref), beside Node, the helper and
# ccc-server themselves.
```

and add, after `rm -rf "$out"` / `mkdir -p "$out"` and the `work`/`trap` lines (move those two up so they come first):

```bash
# oxfmt at the repo's version, refused unless it matches the checksum kept beside this script
oxfmt_version="$(node -p "require('$repo/package.json').devDependencies.oxfmt")"
curl -fsSL "https://github.com/oxc-project/oxc/releases/download/oxfmt_v$oxfmt_version/oxfmt-aarch64-apple-darwin.tar.gz" -o "$work/oxfmt.tar.gz"
echo "$(tr -d '[:space:]' < "$here/oxfmt.sha256")  $work/oxfmt.tar.gz" | shasum -a 256 -c - >/dev/null \
	|| { echo "error: oxfmt $oxfmt_version does not match oxfmt.sha256; put the new archive's SHA-256 there" >&2; exit 1; }
tar -xzf "$work/oxfmt.tar.gz" -C "$work"
cp "$work/oxfmt-aarch64-apple-darwin" "$out/oxfmt"
chmod +x "$out/oxfmt"

# what the preview downloads at its first start
node "$repo/scripts/data-editor-node-release.mjs" "$out/node.json"
cp "$here/ccc-server.ref" "$out/ccc-server.ref"
```

In `project.yml`'s Embed Runtime phase, the input file and the check name oxfmt, which every build from now on needs:

```yaml
        inputFiles: ['$(SRCROOT)/build/runtime/oxfmt']
        outputFiles: ['$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/Runtime/oxfmt']
```

and `if [ ! -x "$runtime/node" ]; then` becomes `if [ ! -x "$runtime/oxfmt" ]; then`.

- [ ] **Step 10: Run the build and check what it wrote**

Run: `mise run data-editor:runtime && ls macos/DataEditor/build/runtime && cat macos/DataEditor/build/runtime/node.json && macos/DataEditor/build/runtime/oxfmt --version`
Expected: the listing holds `oxfmt`, `node.json`, `ccc-server.ref`, `node`, `helper`, `ccc`; `node.json` names v24.22.0 and its SHA-256; oxfmt prints `0.74.0` (or `oxfmt 0.74.0`).

Then make the checksum check fail on purpose: put a wrong hex digit first in `oxfmt.sha256`, run `mise run data-editor:runtime`.
Expected: exit 1 with "does not match oxfmt.sha256". Put the right line back.

- [ ] **Step 11: Commit**

```bash
mise run format
git add scripts/data-editor-node-release.mjs scripts/data-editor-node-release.test.mjs macos/DataEditor/oxfmt.sha256 \
  macos/DataEditor/DataEditorKit/Sources/DataEditorKit/NodeRelease.swift macos/DataEditor/scripts/embed-runtime.sh \
  macos/DataEditor/project.yml macos/DataEditor/DataEditor/Runtime.swift macos/DataEditor/DataEditorTests/RuntimeTests.swift
git commit -m "Bundle oxfmt and the preview's Node and ccc-server pins with the data editor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Run the app on the downloaded helper

**Files:**
- Modify: `macos/DataEditor/DataEditorKit/Sources/DataEditorKit/Workspace.swift`, `HelperClient.swift`
- Modify: `macos/DataEditor/DataEditor/AppModel.swift`, `Runtime.swift`, `ServerStatusView.swift` (one comment)
- Modify: `macos/DataEditor/DataEditorUITests/RepoDataLaunch.swift`, `macos/DataEditor/scripts/embed-runtime.sh`
- Delete: `macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/Fixtures/fake-helper.sh`
- Test: `WorkspaceTests.swift`, `HelperClientTests.swift`, `DataEditorTests/PhaseTests.swift`, `DataEditorTests/PreviewControlTests.swift`, `DataEditorTests/RuntimeTests.swift`

**Interfaces:**
- Consumes: Task 1's banner (`// data-editor commit <sha>`, first line of `helper.js` and `bundle-data.js`) and `helper.json` (`{"commit","protocol"}`); Task 2's `HelperRuntime`; Task 4's `BuildServer`; Task 5's `Runtime.oxfmt`.
- Produces (kit):
  - `Workspace.init(root:session:repo:pages:)`, `pages` defaulting to `https://stolaf.dev/AAO-React-Native/`.
  - `public struct Published: Decodable, Equatable, Sendable { public let commit: String; public let helperProtocol: Int }` (JSON key `protocol`).
  - `Workspace.latestPublished() async throws -> Published`
  - `Workspace.download(commit:)` and `update(to:)` keep their signatures and now also fetch the two scripts into `scripts/`, throwing `Workspace.Moved` when a script names another commit.
  - `Workspace.downloadLatest() async throws -> Snapshot` and `updateToLatest() async throws -> [String]`: read `helper.json`, throw `Workspace.NeedsNewerApp` if its protocol is not `HelperRuntime.protocolVersion`, and try up to three times while `Moved` is thrown.
  - `Workspace.scriptsDirectory: URL`
  - `Snapshot` is `{commit}` alone; `HelperStamp` and `isCompatible` are gone.
  - `public struct HelperClient: Sendable` with `init(runtime: HelperRuntime)`, `helperProtocol: Int`, the same typed calls minus `serve`, `start` and `stop`. `HelperClient.Failure` loses `helperStopped`.
  - `BuildResult.dir: String?`
- Produces (app): `AppModel` reads `-UITestOxfmt` in place of `-UITestNode` and `-UITestHelper`.

Ruling, carried from the spec: the helper no longer runs as a process, so it cannot stop. `HelperClient.Failure.helperStopped`, `AppModel.failurePhase`, `helperStoppedMessage`, `noteFailure` and `isPortInUse` go, with the tests that pin them (`PhaseTests.failsWhenTheHelperStops`, and in `HelperClientTests` the stopped, undecodable-reply, write-after-exit and quiet-ccc tests). A call that fails, including one that never settles, reports on its own; the next call still runs.

- [ ] **Step 1: Write the failing workspace tests**

In `WorkspaceTests.swift`, replace `stubRepo` with a responder that any test can compose, plus the Pages files:

```swift
/// Answers for a repo at `commit` with one data file, the image groups and
/// one image, and for Pages with the helper published from `scriptCommit`
/// (`commit` unless given) speaking `helperProtocol`.
private func repoResponse(commit: String = "c1", failing failPath: String? = nil, cageHours: String = "name: The Cage\n",
                          scriptCommit: String? = nil, helperProtocol: Int = HelperRuntime.protocolVersion) -> @Sendable (URLRequest) -> (Int, Data) {
    { request in
        let url = request.url!.absoluteString
        if let failPath, url.hasSuffix(failPath) { return (-1, Data()) }
        switch url {
        case "https://stolaf.dev/AAO-React-Native/data-editor/helper.json":
            return (200, body(#"{"commit":"\#(commit)","protocol":\#(helperProtocol)}"#))
        case "https://stolaf.dev/AAO-React-Native/data-editor/helper.js",
             "https://stolaf.dev/AAO-React-Native/data-editor/bundle-data.js":
            return (200, body("// data-editor commit \(scriptCommit ?? commit)\n;"))
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/git/trees/\(commit)":
            return (200, body(#"{"tree":[{"path":"data","type":"tree","sha":"tdata"},{"path":"images","type":"tree","sha":"timages"}]}"#))
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

private func stubRepo(commit: String = "c1", failing failPath: String? = nil, cageHours: String = "name: The Cage\n",
                      scriptCommit: String? = nil, helperProtocol: Int = HelperRuntime.protocolVersion) -> (URLSession, StubProtocol.Stub) {
    StubProtocol.session(repoResponse(commit: commit, failing: failPath, cageHours: cageHours, scriptCommit: scriptCommit, helperProtocol: helperProtocol))
}

/// Counts calls from a stub's response closure, which runs off the test's task.
private final class Counter: @unchecked Sendable {
    private let lock = NSLock()
    private var value = 0
    func next() -> Int { lock.withLock { value += 1; return value } }
}
```

Change the first test to download through `helper.json` and check the scripts came with the data:

```swift
    @Test func downloadsTheDataThePublishedImagesAndTheHelper() async throws {
        let (session, stub) = stubRepo()
        let workspace = Workspace(root: temporaryRoot(), session: session)
        let snapshot = try await workspace.downloadLatest()
        #expect(snapshot == Snapshot(commit: "c1"))
        #expect(workspace.snapshot == snapshot)
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(FileManager.default.fileExists(atPath: workspace.root.appending(path: "images/spaces/cage.webp").path))
        #expect(try Data(contentsOf: workspace.scriptsDirectory.appending(path: "helper.js")) == body("// data-editor commit c1\n;"))
        #expect(FileManager.default.fileExists(atPath: workspace.scriptsDirectory.appending(path: "bundle-data.js").path))
        // the source photos are not published, so not fetched
        #expect(!stub.requests.contains { $0.url!.path.hasSuffix("cage.jpg") })
```

(keep the rest of its body as it is). Delete `comparesTheFilesTheBundledHelperWasBuiltFrom`. In `leavesTheWorkspaceAloneWhenADownloadFailsPartway`, add after its last line:

```swift
        #expect(try Data(contentsOf: workspace.scriptsDirectory.appending(path: "helper.js")) == body("// data-editor commit c1\n;"))
```

Add:

```swift
    /// Pages' cache can hand out a script from a newer deploy than helper.json named.
    @Test func startsAgainWhenADeployLandsMidDownload() async throws {
        let c1 = repoResponse(commit: "c1", scriptCommit: "c2")
        let c2 = repoResponse(commit: "c2")
        let asked = Counter()
        let (session, _) = StubProtocol.session { request in
            if request.url!.path.hasSuffix("/data-editor/helper.json") {
                return (200, body(asked.next() == 1 ? #"{"commit":"c1","protocol":1}"# : #"{"commit":"c2","protocol":1}"#))
            }
            return request.url!.absoluteString.contains("c1") ? c1(request) : c2(request)
        }
        let workspace = Workspace(root: temporaryRoot(), session: session)
        #expect(try await workspace.downloadLatest() == Snapshot(commit: "c2"))
        #expect(try Data(contentsOf: workspace.scriptsDirectory.appending(path: "helper.js")) == body("// data-editor commit c2\n;"))
    }

    @Test func givesUpWhenTheScriptsKeepNamingAnotherCommit() async throws {
        let (session, _) = stubRepo(scriptCommit: "c9")
        let workspace = Workspace(root: temporaryRoot(), session: session)
        await #expect(throws: Workspace.Moved()) { _ = try await workspace.downloadLatest() }
        #expect(workspace.snapshot == nil)
    }

    @Test func refusesAHelperThatSpeaksAnotherProtocol() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).downloadLatest()
        let (c2, _) = stubRepo(commit: "c2", helperProtocol: HelperRuntime.protocolVersion + 1)
        let workspace = Workspace(root: root, session: c2)
        await #expect(throws: Workspace.NeedsNewerApp()) { _ = try await workspace.updateToLatest() }
        // nothing was downloaded, so the data being edited stays as it was
        #expect(workspace.snapshot == Snapshot(commit: "c1"))
    }
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter WorkspaceTests`
Expected: FAIL to compile: `value of type 'Workspace' has no member 'downloadLatest'`, `'Snapshot' … extra argument` and the like.

- [ ] **Step 3: Change `Workspace`**

In `Workspace.swift`:

1. Replace `HelperStamp` and `Snapshot` with:

```swift
/// The commit a workspace was downloaded at.
public struct Snapshot: Codable, Hashable, Sendable {
    public let commit: String
    public init(commit: String) { self.commit = commit }
}

/// What master's data deploy last published: the commit it was built from,
/// and the protocol the helper published with it speaks.
public struct Published: Decodable, Equatable, Sendable {
    public let commit: String
    public let helperProtocol: Int
    private enum CodingKeys: String, CodingKey { case commit, helperProtocol = "protocol" }
}
```

2. In `Workspace`, beside `root`:

```swift
    /// A script came from another deploy than the data, so the download starts again.
    public struct Moved: LocalizedError, Equatable {
        public init() {}
        public var errorDescription: String? { "The data changed on GitHub while it downloaded. Try again in a few minutes." }
    }

    /// The published helper speaks another protocol than this app.
    public struct NeedsNewerApp: Error, Equatable { public init() {} }

    private let pages: URL
```

and `init` gains `pages: URL = URL(string: "https://stolaf.dev/AAO-React-Native/")!`, stored as `self.pages = pages`. Add `public var scriptsDirectory: URL { root.appending(path: "scripts") }` beside `dataDirectory`.

3. Replace `latestCommit()` with:

```swift
    /// What master's data deploy last published, which the data and helper are downloaded at.
    public func latestPublished() async throws -> Published {
        try JSONDecoder().decode(Published.self, from: try await get(pages.appending(path: "data-editor/helper.json"), accept: "application/json"))
    }

    /// Downloads master's published commit, starting again while a deploy lands meanwhile.
    @discardableResult
    public func downloadLatest() async throws -> Snapshot { try await atLatest { try await self.download(commit: $0) } }

    /// Moves to master's published commit, keeping the edits, as `update(to:)` does.
    public func updateToLatest() async throws -> [String] { try await atLatest { try await self.update(to: $0) } }

    /// Runs `body` at the published commit, after refusing a helper this app
    /// cannot speak to. A deploy that lands meanwhile makes `body` throw
    /// `Moved`, so it runs again at the newer commit, up to three times.
    private func atLatest<T: Sendable>(_ body: @Sendable (String) async throws -> T) async throws -> T {
        var attempt = 1
        while true {
            let published = try await latestPublished()
            guard published.helperProtocol == HelperRuntime.protocolVersion else { throw NeedsNewerApp() }
            do { return try await body(published.commit) } catch is Moved where attempt < 3 { attempt += 1 }
        }
    }
```

4. `files(at:)` returns the paths alone: delete the `code` loop over `scripts` and `modules`, change its return type to `[String]` and its last line to `return data + images`. In `download(commit:)`, `let (paths, snapshot) = …` becomes:

```swift
        let paths = try await files(at: commit)
        let snapshot = Snapshot(commit: commit)
```

5. In `download(commit:)`, after the task group that fetches the data, before `let names = …`:

```swift
        // the helper published with this commit, each script named by the commit it came from
        for script in ["helper.js", "bundle-data.js"] {
            let file = staging.appending(path: "scripts/\(script)")
            try await fetch(pages.appending(path: "data-editor/\(script)"), to: file)
            let first = String(decoding: try Data(contentsOf: file).prefix(200), as: UTF8.self).split(separator: "\n", maxSplits: 1).first
            guard first == "// data-editor commit \(commit)" else { throw Moved() }
        }
```

and `let names = ["data", "images", "base"]` becomes `["data", "images", "base", "scripts"]`, with this line added inside the `do` after the images move:

```swift
            try fm.moveItem(at: staging.appending(path: "scripts"), to: scriptsDirectory)
```

Update the doc comment of `download(commit:)` to say it swaps in `scripts/` too, and `Workspace`'s own to read: `/// The data being edited: data/ and the published images/ at a commit, the helper published with them under scripts/, a pristine copy of the data under base/, and the build under out/.`

- [ ] **Step 4: Run them to verify they pass**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter WorkspaceTests`
Expected: PASS, every workspace test. A test that called `download(commit:)` directly still passes: the stub serves scripts for its commit.

- [ ] **Step 5: Write the failing `HelperClient` tests**

Replace `HelperClientTests.swift` with:

```swift
import Foundation
import Testing
@testable import DataEditorKit

/// A helper whose handlers echo their method and parameters, fail on "fail",
/// and build into a folder named by the call.
private func client() throws -> HelperClient {
    let folder = FileManager.default.temporaryDirectory.appending(path: "helper client \(UUID().uuidString)/scripts")
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    try Data("""
        globalThis.dataEditorHelper = {PROTOCOL: 1, createHandlers: () => ({
            load: async (params) => ({echo: {method: 'load', params}}),
            fail: async () => { throw new Error('it failed') },
            build: async () => ({ok: true, problems: [], dir: '/builds/1'}),
        })}
        """.utf8).write(to: folder.appending(path: "helper.js"))
    try Data().write(to: folder.appending(path: "bundle-data.js"))
    let workspace = folder.deletingLastPathComponent()
    return HelperClient(runtime: try HelperRuntime(scripts: folder, data: workspace.appending(path: "data"),
                                                   out: workspace.appending(path: "out"), oxfmt: URL(filePath: "/usr/bin/false")))
}

private struct Echo: Decodable, Sendable { let echo: JSONValue }

struct HelperClientTests {
    @Test func returnsTheResultForItsRequest() async throws {
        let reply: Echo = try await client().call("load", ["file": "building-hours/1-1-cage.yaml"])
        #expect(reply.echo["method"] == .string("load"))
        #expect(reply.echo["params"]?["file"] == .string("building-hours/1-1-cage.yaml"))
    }

    @Test func throwsTheHelpersError() async throws {
        let helper = try client()
        await #expect(throws: HelperClient.Failure(message: "it failed")) {
            let _: Echo = try await helper.call("fail", [String: String]())
        }
        // a refused call leaves the helper answering
        let reply: Echo = try await helper.call("load", ["file": "after"])
        #expect(reply.echo["params"]?["file"] == .string("after"))
    }

    @Test func describesAFailureByTheHelpersMessage() {
        #expect(HelperClient.Failure(message: "x is outside the workspace").localizedDescription == "x is outside the workspace")
    }

    @Test func keepsUnicodeLineSeparatorsInsideAValue() async throws {
        let value = "one\u{2028}two\u{2029}three\u{85}four"
        let reply: Echo = try await client().call("load", ["file": value])
        #expect(reply.echo["params"]?["file"] == .string(value))
    }

    /// The app serves the folder the build reports.
    @Test func readsTheBuildsFolder() async throws {
        let result = try await client().build()
        #expect(result.ok)
        #expect(result.dir == "/builds/1")
    }

    @Test func encodesEditOps() throws {
        let ops: [EditOp] = [.set(["schedule", 0, "to"], .string("9:00pm")), .delete(["links", 1])]
        let json = String(decoding: try JSONEncoder.sorted.encode(ops), as: UTF8.self)
        #expect(json == #"[{"path":["schedule",0,"to"],"value":"9:00pm"},{"delete":true,"path":["links",1]}]"#)
    }
}
```

Delete `Fixtures/fake-helper.sh`.

- [ ] **Step 6: Run them to verify they fail**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter HelperClientTests`
Expected: FAIL to compile: `HelperClient` has no initializer `init(runtime:)`, and `BuildResult` has no member `dir`.

- [ ] **Step 7: Put `HelperClient` on `HelperRuntime`**

In `HelperClient.swift`, replace everything from `/// The pipeline helper, a child process…` down to the closing brace of the actor with:

```swift
/// The pipeline helper's calls, typed, over the helper running in JavaScriptCore.
public struct HelperClient: Sendable {
    public struct Failure: LocalizedError, Equatable, Sendable {
        public let message: String
        public var errorDescription: String? { message }
        public init(message: String) { self.message = message }
    }

    private let runtime: HelperRuntime

    public init(runtime: HelperRuntime) { self.runtime = runtime }

    /// The protocol the loaded helper speaks.
    public var helperProtocol: Int { runtime.helperProtocol }

    /// Sends `method` and decodes its result as `R`.
    public func call<R: Decodable & Sendable>(_ method: String, _ params: some Encodable & Sendable) async throws -> R {
        let json = String(decoding: try JSONEncoder.sorted.encode(params), as: UTF8.self)
        let reply: String
        do {
            reply = try await runtime.call(method, paramsJSON: json)
        } catch let failure as HelperRuntime.Failure {
            throw Failure(message: failure.message)
        }
        return try JSONDecoder().decode(R.self, from: Data(reply.utf8))
    }
}
```

In `BuildResult`, add `public let dir: String?` after `problems`, and in its `init(from:)`: `dir = try container.decodeIfPresent(String.self, forKey: .dir)`, with `dir` added to `CodingKeys`. Delete `Served`, `PortParams` and the `serve(port:)` extension method.

- [ ] **Step 8: Run the kit's tests**

Run: `cd macos/DataEditor/DataEditorKit && DATA_EDITOR_NODE="$(mise which node)" swift test`
Expected: PASS, every kit test.

- [ ] **Step 9: Write the failing app tests**

In `DataEditorTests/PhaseTests.swift`, delete `failsWhenTheHelperStops`. In `PreviewControlTests.swift`, `saysWhenTheDataPortIsInUse` becomes:

```swift
    /// The app serves the data on 8790, which a second copy of the app may hold.
    @Test func saysWhenTheDataPortIsInUse() {
        let control = PreviewControl(.crashed(1), servePortInUse: true)
        #expect(control.title == "Port 8790 is in use")
        #expect(control.offersStartAgain)
    }
```

In `RuntimeTests.swift`, delete `installsTheHelperIntoTheWorkspace` (the helper now comes from Pages with the data; `WorkspaceTests` pins that).

Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/app.log" -only-testing:DataEditorTests`
Expected: build FAILS: `AppModel.swift` uses `HelperClient(executable:arguments:)`, `latestCommit()`, `isCompatible`, `serve(port:)`, which no longer exist.

- [ ] **Step 10: Rewire `AppModel`**

In `AppModel.swift`:

1. Delete `helperStoppedMessage`, `failurePhase(after:)`, `isPortInUse(_:)` (with their doc comments), `noteFailure(_:)` and its four call sites (`noteFailure(error)` lines in `select`, `edit`, the draft check and `rebuild`).
2. Add `import os` beside the other imports.
3. Replace the `testHelper` property and its comment with:

```swift
    /// UI tests write the data with the repo's own oxfmt, run on the test runner's Node, and run no ccc
    private let testOxfmt: URL?
```

and in `init`, the `if let node … else … }` block with:

```swift
        testOxfmt = defaults.string(forKey: "UITestOxfmt").map { URL(filePath: $0) }
```

4. `private var helper: HelperClient?` stays. Below it add:

```swift
    private var buildServer: BuildServer?
    /// The newest good build, which the build server reads on each request.
    private let currentBuild = OSAllocatedUnfairLock<URL?>(initialState: nil)
```

5. Every `testHelper == nil` becomes `testOxfmt == nil`, and `runsUnderUITests` returns `testOxfmt != nil`.
6. In `launch()`, replace from `if workspace.snapshot == nil {` through `self.helper = helper` with:

```swift
            if workspace.snapshot == nil {
                phase = .downloading
                try await workspace.downloadLatest()
            }
            if shuttingDown { return }
            let helper = try makeHelper()
            // a workspace downloaded by an older app can hold a helper this one cannot speak to
            guard helper.helperProtocol == HelperRuntime.protocolVersion else {
                phase = .needsAppUpdate
                return
            }
            self.helper = helper
```

and before its `catch {` add:

```swift
        } catch is Workspace.NeedsNewerApp {
            phase = .needsAppUpdate
```

Its doc comment's "starts the helper" becomes "loads the helper it holds".

7. Add, below `launch()`:

```swift
    /// The helper the workspace holds, over its data, writing files with the bundled oxfmt.
    private func makeHelper() throws -> HelperClient {
        HelperClient(runtime: try HelperRuntime(scripts: workspace.scriptsDirectory, data: workspace.dataDirectory,
                                                out: workspace.outDirectory, oxfmt: testOxfmt ?? runtime.oxfmt))
    }

    /// Builds into `out/`, and serves the build from now on if it is good.
    private func build(with helper: HelperClient) async throws -> [Problem] {
        let result = try await helper.build()
        if let dir = result.dir { currentBuild.withLock { $0 = URL(filePath: dir) } }
        return result.problems
    }
```

`rebuild()`'s `buildProblems = try await helper.build().problems` becomes `buildProblems = try await build(with: helper)`, and so does the same line in `submit(summary:)`.

8. In `startPreview()`, replace `let port = try await helper.serve(port: Self.port)` with:

```swift
            if buildServer == nil {
                let server = BuildServer(port: UInt16(Self.port), root: { [currentBuild] in currentBuild.withLock { $0 } })
                try await server.start()
                buildServer = server
            }
            let port = Self.port
```

and in its `catch`, `servePortInUse = Self.isPortInUse(error.localizedDescription)` becomes `servePortInUse = error as? BuildServer.Failure == .portInUse(UInt16(Self.port))`. Its `guard … let helper else { return }` loses `let helper` (`guard testOxfmt == nil, !shuttingDown, !updating, helper != nil else { return }`), since `rebuild()` reads it. `stopPreview()`'s doc comment: "The build server keeps serving the build, which costs nothing and the next start reuses."

9. `stopProcesses()` becomes:

```swift
    private func stopProcesses() async {
        await stopPreview()
        buildServer?.stop()
        buildServer = nil
        helper = nil
    }
```

10. `refreshNewerCommit()`: `let latest = try? await workspace.latestCommit()` becomes `let latest = try? await workspace.latestPublished().commit`. Its doc comment: "Asks Pages whether master's data deploy has moved past the data being edited…".
11. In `updateWorkspace()`, `conflicts = try await workspace.update(to: try await workspace.latestCommit())` becomes `conflicts = try await workspace.updateToLatest()`, with a `catch is Workspace.NeedsNewerApp` before the general `catch` that sets `updating = false` and `phase = .needsAppUpdate` and returns. Replace the stamp check after `newerCommit = nil` (the `do { if testHelper == nil, … } catch { … }` block) with:

```swift
        // the update brought the helper published with the new data
        do {
            helper = try makeHelper()
        } catch {
            phase = .failed(error.localizedDescription)
            return
        }
```

12. In `ServerStatusView.swift`, the `servePortInUse` parameter's comment becomes `whether the app could not serve the data on its own port`.

- [ ] **Step 11: Point the UI tests at the checkout's helper**

In `RepoDataLaunch.swift`:

1. The snapshot line becomes `try Data(#"{"commit":"c1"}"#.utf8).write(to: workspace.appending(path: "snapshot.json"))`.
2. After it, copy in the helper built from the checkout, and write an oxfmt that runs the repo's own:

```swift
        // the helper built from the checkout, as the data deploy publishes it
        let helper = repo.appending(path: "macos/DataEditor/build/helper")
        guard FileManager.default.fileExists(atPath: helper.appending(path: "helper.js").path) else {
            throw XCTSkip("run `mise run data-editor:helper` first, to build the helper the UI tests load")
        }
        try FileManager.default.copyItem(at: helper, to: workspace.appending(path: "scripts"))
        let node = try XCTUnwrap(ProcessInfo.processInfo.environment["DATA_EDITOR_NODE"], "run with TEST_RUNNER_DATA_EDITOR_NODE=$(mise which node)")
        let oxfmt = support.appending(path: "oxfmt")
        try Data("#!/bin/sh\nexec '\(node)' '\(repo.appending(path: "node_modules/oxfmt/bin/oxfmt").path)' \"$@\"\n".utf8).write(to: oxfmt)
        try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: oxfmt.path)
```

3. Delete the later `let node = …` line, and the launch arguments become `["-UITestWorkspace", support.path, "-UITestOxfmt", oxfmt.path, "-ApplePersistenceIgnoreState", "YES"] + arguments`. The doc comment's "and the repo's helper" becomes "the helper built from the checkout, and the repo's oxfmt".
4. Add `mise run data-editor:helper` as the first line of `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh`'s commands (after its `cd`), so every app test run loads a current helper.

- [ ] **Step 12: Drop the helper from the runtime**

In `embed-runtime.sh`, delete the `# the helper` block (its two lines), and take "the helper" out of the header comment. In `Runtime.swift`, delete `helperDirectory`, `stamp()` and `installHelper(into:)`. In `mise.toml`, `data-editor:helper`'s description becomes `"Bundle the Mac data editor's helper for JavaScriptCore, as the data deploy publishes it"`.

- [ ] **Step 13: Run every app and kit test, then the UI tests**

Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/app.log" -only-testing:DataEditorTests`
Expected: `TEST SUCCEEDED`.

Run: `cd macos/DataEditor/DataEditorKit && DATA_EDITOR_NODE="$(mise which node)" swift test`
Expected: PASS.

Ask Wren before this one; it takes the screen:
Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/ui.log" -only-testing:DataEditorUITests`
Expected: `TEST SUCCEEDED`. These tests edit, format, check and build through JavaScriptCore now, so a failure here that the parity test did not catch is a host or wiring bug.

- [ ] **Step 14: Commit**

```bash
git rm macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/Fixtures/fake-helper.sh
git add macos/DataEditor/DataEditorKit macos/DataEditor/DataEditor macos/DataEditor/DataEditorTests \
  macos/DataEditor/DataEditorUITests/RepoDataLaunch.swift macos/DataEditor/scripts/embed-runtime.sh mise.toml
git commit -m "Run the data editor on the helper published with the data

The helper comes from Pages with the data it edits, and runs in
JavaScriptCore, so a script changed on master no longer stops the app
from editing. Only a change to the protocol between the two does.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Publish the helper with the data

**Files:**
- Modify: `.github/workflows/deploy-data.yml`

**Interfaces:**
- Consumes: Task 1's CLI.
- Produces: `https://stolaf.dev/AAO-React-Native/data-editor/{helper.js,bundle-data.js,helper.json}`, which Task 6 reads.

- [ ] **Step 1: Add the step**

In `deploy-data.yml`, after the "Bundle the data" step:

```yaml
      # The Mac data editor downloads its helper with the data, so the two
      # always come from one commit.
      - name: Build the data editor's helper
        run: node scripts/build-data-editor-helper.mjs --out docs/data-editor --commit "$GITHUB_SHA"
```

`GITHUB_SHA` is the runner's own variable, so no `${{ }}` expression reaches the shell.

- [ ] **Step 2: Check it**

Run: `mise run lint:actions`
Expected: no findings for `deploy-data.yml`.

Run: `node scripts/build-data-editor-helper.mjs --out "$TMPDIR/pages/data-editor" --commit test && ls "$TMPDIR/pages/data-editor" && cat "$TMPDIR/pages/data-editor/helper.json"`
Expected: `bundle-data.js  helper.js  helper.json`, and `{"commit":"test","protocol":1}`.

Run: `git check-ignore docs/data-editor/helper.js`
Expected: prints the path (`/docs` is ignored whole).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-data.yml
git commit -m "Publish the data editor's helper with the data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

After this merges and the deploy runs, check `curl -fsS https://stolaf.dev/AAO-React-Native/data-editor/helper.json` names the merge's commit. Until then the app's first launch fails at `helper.json`, so this task must land on master before any build of Task 6 ships.

---

### Task 8: Download the preview at its first start

**Files:**
- Create: `macos/DataEditor/DataEditorKit/Sources/DataEditorKit/PreviewInstaller.swift`
- Test: `macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/PreviewInstallerTests.swift`, `macos/DataEditor/DataEditorTests/PreviewControlTests.swift`
- Modify: `macos/DataEditor/DataEditor/AppModel.swift`, `ServerStatusView.swift`, `Runtime.swift`, `macos/DataEditor/scripts/embed-runtime.sh`, `mise.toml` (`data-editor:runtime` description)
- Delete: `macos/DataEditor/Runtime.entitlements`

Ruling: the installs live under `<support>/preview/` (`preview/node/<version>`, `preview/ccc/<commit>`), not straight under Application Support as the spec sketches, since `<support>/ccc/` already holds ccc's own state (wrangler's, its pid file), which the cleanup of other versions would delete.

**Interfaces:**
- Consumes: Task 5's `NodeRelease`, `Runtime.nodeRelease()`, `Runtime.cccCommit()`; `CccRunner.Configuration.bundled(node:cccRoot:pagesOrigin:state:)` as it is.
- Produces:
  - `public struct PreviewInstaller: Sendable`
  - `public init(root: URL, node: NodeRelease, cccCommit: String, session: URLSession = .shared, runNpm: RunNpm? = nil)`, where `public typealias RunNpm = @Sendable (_ node: URL, _ folder: URL) async throws -> Void` installs ccc-server's dependencies in `folder` with `node`; nil means `npm ci` from Node's own npm.
  - `public var nodeExecutable: URL` (`<root>/node/<version>/bin/node`), `public var cccRoot: URL` (`<root>/ccc/<commit>`), `public var isReady: Bool`
  - `public func install() async throws` — installs what is missing, then removes other versions' folders.
  - `public struct Failure: LocalizedError, Equatable, Sendable { public let message: String }`
  - `PreviewControl.init(_:servePortInUse:installing:)`; `AppModel.previewInstalling`, `AppModel.previewInstallFailed`.

- [ ] **Step 1: Measure `--omit=dev`**

The spec leaves one question to measure: whether ccc-server's `wrangler dev` runs with only its production dependencies. In a scratch folder:

```bash
mkdir -p "$TMPDIR/ccc-omit" && cd "$TMPDIR/ccc-omit"
curl -fsSL "https://codeload.github.com/frog-pond/ccc-server/tar.gz/$(cat "$OLDPWD/macos/DataEditor/ccc-server.ref")" | tar -xz --strip-components 1
npm ci --no-audit --no-fund --omit=dev && du -sh node_modules
PAGES_ORIGIN_OVERRIDE=https://stolaf.dev/AAO-React-Native node source/dev/index.ts
```

Expected, one of two:
- The last command prints that the Worker is ready on 8787 (stop it with Ctrl-C): use `--omit=dev` in Step 5's default `runNpm`, and note the `du` size in the PR's manual check.
- It fails (wrangler missing, or a module not found): leave the flag out.

Ledger the result as a ruling either way.

- [ ] **Step 2: Write the failing installer tests**

```swift
import CryptoKit
import Foundation
import Testing
@testable import DataEditorKit

/// A gzipped tarball holding `files` (path → text) under one top folder, as Node's archive and GitHub's are.
private func tarball(_ files: [String: String]) throws -> Data {
    let fm = FileManager.default
    let folder = fm.temporaryDirectory.appending(path: "tarball \(UUID().uuidString)")
    for (path, text) in files {
        let file = folder.appending(path: "top/\(path)")
        try fm.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        try Data(text.utf8).write(to: file)
        try fm.setAttributes([.posixPermissions: 0o755], ofItemAtPath: file.path)
    }
    let archive = folder.appending(path: "out.tar.gz")
    let tar = Process()
    tar.executableURL = URL(filePath: "/usr/bin/tar")
    tar.arguments = ["-czf", archive.path, "-C", folder.path, "top"]
    try tar.run()
    tar.waitUntilExit()
    return try Data(contentsOf: archive)
}

private let nodeArchive = try! tarball(["bin/node": "#!/bin/sh\n", "lib/node_modules/npm/bin/npm-cli.js": ""])
private let cccArchive = try! tarball(["package.json": "{}", "source/dev/index.ts": ""])
private let nodeURL = URL(string: "https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz")!
private let cccURL = "https://codeload.github.com/frog-pond/ccc-server/tar.gz/cda256d"

private func release(sha256: String = SHA256.hash(data: nodeArchive).map { String(format: "%02x", $0) }.joined()) -> NodeRelease {
    NodeRelease(version: "24.22.0", url: nodeURL, sha256: sha256)
}

/// Serves both archives, and fails everything else.
private func session() -> URLSession {
    StubProtocol.session { request in
        switch request.url!.absoluteString {
        case nodeURL.absoluteString: (200, nodeArchive)
        case cccURL: (200, cccArchive)
        default: (404, Data())
        }
    }.0
}

/// Stands in for `npm ci`: makes node_modules, as a finished install leaves it.
private let fakeNpm: PreviewInstaller.RunNpm = { _, folder in
    try FileManager.default.createDirectory(at: folder.appending(path: "node_modules"), withIntermediateDirectories: true)
}

private func entries(_ folder: URL) -> [String] {
    ((try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? []).sorted()
}

private func temporaryRoot() -> URL {
    FileManager.default.temporaryDirectory.appending(path: "preview \(UUID().uuidString)")
}

struct PreviewInstallerTests {
    @Test func installsNodeAndCccServer() async throws {
        let root = temporaryRoot()
        let installer = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session(), runNpm: fakeNpm)
        #expect(!installer.isReady)
        try await installer.install()
        #expect(installer.isReady)
        #expect(installer.nodeExecutable == root.appending(path: "node/24.22.0/bin/node"))
        #expect(FileManager.default.isExecutableFile(atPath: installer.nodeExecutable.path))
        #expect(FileManager.default.fileExists(atPath: root.appending(path: "ccc/cda256d/source/dev/index.ts").path))
        #expect(entries(root.appending(path: "node")) == ["24.22.0"])
        #expect(entries(root.appending(path: "ccc")) == ["cda256d"])
    }

    @Test func runsNpmWithTheDownloadedNode() async throws {
        let root = temporaryRoot()
        let seen = Seen()
        let installer = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session()) { node, folder in
            seen.set(node)
            try await fakeNpm(node, folder)
        }
        try await installer.install()
        #expect(seen.value == installer.nodeExecutable)
    }

    @Test func refusesNodeWhoseChecksumDiffers() async throws {
        let root = temporaryRoot()
        let installer = PreviewInstaller(root: root, node: release(sha256: String(repeating: "0", count: 64)), cccCommit: "cda256d",
                                         session: session(), runNpm: fakeNpm)
        await #expect(throws: PreviewInstaller.Failure(message: "Node's download did not match its checksum.")) { try await installer.install() }
        #expect(entries(root.appending(path: "node")) == [])
        #expect(!installer.isReady)
    }

    @Test func leavesNothingInstalledWhenNpmFails() async throws {
        let root = temporaryRoot()
        let installer = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session()) { _, _ in
            throw PreviewInstaller.Failure(message: "npm said no")
        }
        await #expect(throws: PreviewInstaller.Failure(message: "npm said no")) { try await installer.install() }
        #expect(entries(root.appending(path: "ccc")) == [])
        #expect(!installer.isReady)
    }

    /// Stop during the install cancels it; what it had begun must not pass for an install.
    @Test func takesNoStagingFolderForAnInstall() async throws {
        let root = temporaryRoot()
        let started = Seen()
        let installer = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session()) { node, folder in
            started.set(folder)
            try await Task.sleep(for: .seconds(30))
            try await fakeNpm(node, folder)
        }
        let task = Task { try await installer.install() }
        while started.value == nil { try await Task.sleep(for: .milliseconds(20)) }
        task.cancel()
        await #expect(throws: CancellationError.self) { try await task.value }
        #expect(entries(root.appending(path: "ccc")) == [])
        #expect(!installer.isReady)
    }

    @Test func reusesWhatIsInstalled() async throws {
        let root = temporaryRoot()
        try await PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session(), runNpm: fakeNpm).install()
        let offline = StubProtocol.session { _ in (-1, Data()) }.0
        let again = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: offline, runNpm: fakeNpm)
        #expect(again.isReady)
        try await again.install()
    }

    @Test func removesOtherVersionsOnceReady() async throws {
        let root = temporaryRoot()
        let fm = FileManager.default
        for old in ["node/22.0.0/bin", "node/.staging-old", "ccc/0ld", "ccc/.staging-old"] {
            try fm.createDirectory(at: root.appending(path: old), withIntermediateDirectories: true)
        }
        try await PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session(), runNpm: fakeNpm).install()
        #expect(entries(root.appending(path: "node")) == ["24.22.0"])
        #expect(entries(root.appending(path: "ccc")) == ["cda256d"])
    }
}

/// A value set from another task.
private final class Seen: @unchecked Sendable {
    private let lock = NSLock()
    private var stored: URL?
    func set(_ value: URL) { lock.withLock { stored = value } }
    var value: URL? { lock.withLock { stored } }
}
```

- [ ] **Step 3: Run them to verify they fail**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter PreviewInstallerTests`
Expected: FAIL to compile: `cannot find 'PreviewInstaller' in scope`.

- [ ] **Step 4: Write `PreviewInstaller.swift`**

```swift
import CryptoKit
import Foundation

/// Downloads what the phone preview runs on, at its first start: Node,
/// checked against the SHA-256 the app carries, and ccc-server at the pinned
/// commit, with its dependencies installed by that Node's npm. Each is put
/// together in a staging folder beside its install and renamed into place only
/// once whole, so a stopped or failed install leaves nothing taken for ready.
public struct PreviewInstaller: Sendable {
    public struct Failure: LocalizedError, Equatable, Sendable {
        public let message: String
        public var errorDescription: String? { message }
        public init(message: String) { self.message = message }
    }

    /// Installs ccc-server's dependencies in `folder` with `node`.
    public typealias RunNpm = @Sendable (_ node: URL, _ folder: URL) async throws -> Void

    private let root: URL
    private let node: NodeRelease
    private let cccCommit: String
    private let session: URLSession
    private let runNpm: RunNpm

    public init(root: URL, node: NodeRelease, cccCommit: String, session: URLSession = .shared, runNpm: RunNpm? = nil) {
        self.root = root
        self.node = node
        self.cccCommit = cccCommit
        self.session = session
        self.runNpm = runNpm ?? Self.npmCi(cache: root.appending(path: "npm-cache"))
    }

    private var nodeFolder: URL { root.appending(path: "node") }
    private var cccFolder: URL { root.appending(path: "ccc") }
    public var nodeExecutable: URL { nodeFolder.appending(path: "\(node.version)/bin/node") }
    public var cccRoot: URL { cccFolder.appending(path: cccCommit) }

    private var nodeIsReady: Bool { FileManager.default.isExecutableFile(atPath: nodeExecutable.path) }
    private var cccIsReady: Bool { FileManager.default.fileExists(atPath: cccRoot.appending(path: "node_modules").path) }
    public var isReady: Bool { nodeIsReady && cccIsReady }

    /// Installs whatever is missing, then removes other versions' folders and staging left by a stopped install.
    public func install() async throws {
        if !nodeIsReady {
            try await assemble(in: nodeFolder, as: node.version) { staging in
                let archive = try await download(node.url)
                let digest = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
                guard digest == node.sha256 else { throw Failure(message: "Node's download did not match its checksum.") }
                try await unpack(archive, into: staging)
            }
        }
        if !cccIsReady {
            try await assemble(in: cccFolder, as: cccCommit) { staging in
                try await unpack(try await download(URL(string: "https://codeload.github.com/frog-pond/ccc-server/tar.gz/\(cccCommit)")!), into: staging)
                try await runNpm(nodeExecutable, staging)
            }
        }
        removeAll(in: nodeFolder, but: node.version)
        removeAll(in: cccFolder, but: cccCommit)
    }

    /// Builds `name` in a staging folder inside `folder` with `body`, then renames it into place.
    private func assemble(in folder: URL, as name: String, _ body: (URL) async throws -> Void) async throws {
        let fm = FileManager.default
        let staging = folder.appending(path: ".staging-\(UUID().uuidString)")
        try fm.createDirectory(at: staging, withIntermediateDirectories: true)
        do {
            try await body(staging)
            try Task.checkCancellation()
            try? fm.removeItem(at: folder.appending(path: name))
            try fm.moveItem(at: staging, to: folder.appending(path: name))
        } catch {
            try? fm.removeItem(at: staging)
            throw error
        }
    }

    private func removeAll(in folder: URL, but kept: String) {
        let fm = FileManager.default
        for name in (try? fm.contentsOfDirectory(atPath: folder.path)) ?? [] where name != kept {
            try? fm.removeItem(at: folder.appending(path: name))
        }
    }

    private func download(_ url: URL) async throws -> Data {
        let (data, response) = try await session.data(from: url)
        guard let status = (response as? HTTPURLResponse)?.statusCode, (200..<300).contains(status) else {
            throw Failure(message: "Couldn't download \(url.absoluteString).")
        }
        return data
    }

    /// Unpacks a gzipped tarball's one top folder into `folder`.
    private func unpack(_ archive: Data, into folder: URL) async throws {
        let file = folder.deletingLastPathComponent().appending(path: "\(folder.lastPathComponent).tar.gz")
        try archive.write(to: file)
        defer { try? FileManager.default.removeItem(at: file) }
        try await Self.run(URL(filePath: "/usr/bin/tar"), ["-xzf", file.path, "-C", folder.path, "--strip-components", "1"], in: folder, environment: [:])
    }

    /// `npm ci` from Node's own npm, with Node's `bin` first on `PATH`, so install scripts run on that Node.
    private static func npmCi(cache: URL) -> RunNpm {
        { node, folder in
            let bin = node.deletingLastPathComponent()
            let npm = bin.deletingLastPathComponent().appending(path: "lib/node_modules/npm/bin/npm-cli.js")
            try await run(node, [npm.path, "ci", "--no-audit", "--no-fund"], in: folder, environment: [
                "PATH": "\(bin.path):/usr/bin:/bin",
                "HOME": cache.deletingLastPathComponent().path,
                "npm_config_cache": cache.path,
            ])
        }
    }

    /// Runs `executable`, ending it if the task is cancelled, and fails with its last lines of output.
    private static func run(_ executable: URL, _ arguments: [String], in folder: URL, environment: [String: String]) async throws {
        let process = Process()
        let output = Pipe()
        process.executableURL = executable
        process.arguments = arguments
        process.currentDirectoryURL = folder
        if !environment.isEmpty { process.environment = environment }
        process.standardOutput = output
        process.standardError = output
        let collected = Collected()
        output.fileHandleForReading.readabilityHandler = { collected.append($0.availableData) }
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, any Error>) in
                process.terminationHandler = { _ in continuation.resume() }
                do { try process.run() } catch { continuation.resume(throwing: error) }
            }
        } onCancel: {
            process.terminate()
        }
        output.fileHandleForReading.readabilityHandler = nil
        try Task.checkCancellation()
        guard process.terminationStatus == 0 else {
            let lines = String(decoding: collected.data, as: UTF8.self).split(separator: "\n").suffix(20).joined(separator: "\n")
            throw Failure(message: "\(executable.lastPathComponent) exited with status \(process.terminationStatus)\n\(lines)")
        }
    }
}

/// Output gathered from a pipe's handler, which runs on its own queue.
private final class Collected: @unchecked Sendable {
    private let lock = NSLock()
    private var stored = Data()
    func append(_ more: Data) { lock.withLock { stored.append(more) } }
    var data: Data { lock.withLock { stored } }
}
```

If Step 1 found `--omit=dev` works, add it after `"--no-fund"`.

- [ ] **Step 5: Run them to verify they pass**

Run: `cd macos/DataEditor/DataEditorKit && swift test --filter PreviewInstallerTests`
Expected: PASS, 7 tests.

- [ ] **Step 6: Write the failing preview control test**

Add to `PreviewControlTests`:

```swift
    /// The first start downloads Node and ccc-server before anything runs.
    @Test func saysThePreviewIsDownloadingAtItsFirstStart() {
        let control = PreviewControl(.starting, installing: true)
        #expect(control.title == "Downloading preview…")
        #expect(control.click == .showStatus)
        #expect(control.offersStop)
        #expect(!control.offersStartAgain)
    }
```

Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/app.log" -only-testing:DataEditorTests/PreviewControlTests`
Expected: build FAILS: `extra argument 'installing' in call`.

- [ ] **Step 7: Add the installing state**

In `ServerStatusView.swift`, `PreviewControl`'s init gains the parameter, documented, and `.starting` reads it:

```swift
    /// - Parameter servePortInUse: whether the app could not serve the data on its own port
    /// - Parameter installing: whether the first start is downloading Node and ccc-server
    init(_ status: CccRunner.Status, servePortInUse: Bool = false, installing: Bool = false) {
        switch status {
        case .stopped: (title, click, offersStop, offersStartAgain) = ("Start Preview", .start, false, false)
        case .starting: (title, click, offersStop, offersStartAgain) = (installing ? "Downloading preview…" : "Starting preview…", .showStatus, true, false)
```

(the other cases stay). In `ServerStatusView.body`, the control becomes `PreviewControl(model.cccStatus, servePortInUse: model.servePortInUse, installing: model.previewInstalling)`, and in the popover, after the numbered instructions:

```swift
                if model.previewInstalling {
                    Text("Getting the preview server ready. This happens once.")
                }
                if model.previewInstallFailed {
                    Text("Couldn't download the preview server.").foregroundStyle(.red)
                    Text(model.cccLog.suffix(5).joined(separator: "\n")).font(.caption.monospaced()).textSelection(.enabled)
                }
```

In `AppModel.swift`:

1. Beside `servePortInUse`:

```swift
    /// Set while the first start downloads and installs Node and ccc-server.
    private(set) var previewInstalling = false
    /// Set when that download or install failed, which the preview's popover says.
    private(set) var previewInstallFailed = false
```

and beside `ccc`: `private var install: Task<Void, any Error>?`.

2. In `startPreview()`, set `previewInstallFailed = false` beside `servePortInUse = false`. After the `guard generation == previewGeneration else { return }` that follows `await rebuild()`, before `if let ccc {`:

```swift
        let installer: PreviewInstaller
        do {
            // not support/ccc, which holds ccc's own state
            installer = try PreviewInstaller(root: support.appending(path: "preview"), node: runtime.nodeRelease(), cccCommit: runtime.cccCommit())
            if !installer.isReady {
                previewInstalling = true
                let install = Task { try await installer.install() }
                self.install = install
                try await install.value
                previewInstalling = false
                self.install = nil
            }
        } catch {
            // a Stop cancelled the install, and says what the preview is now
            guard generation == previewGeneration else { return }
            previewInstalling = false
            install = nil
            cccLog = error.localizedDescription.split(separator: "\n").map(String.init)
            previewInstallFailed = true
            cccStatus = .crashed(1)
            return
        }
        guard generation == previewGeneration else { return }
```

and the `CccRunner` line becomes `CccRunner(configuration: .bundled(node: installer.nodeExecutable, cccRoot: installer.cccRoot, pagesOrigin: origin, state: support.appending(path: "ccc")))`. The doc comment of `startPreview()` gains: "The first start downloads Node and ccc-server, as `PreviewInstaller` says." and loses "under UI tests, which have no bundled ccc to run" in favour of "under UI tests, which run no ccc".

3. In `stopPreview()`, first lines:

```swift
        install?.cancel()
        install = nil
        previewInstalling = false
        previewInstallFailed = false
```

- [ ] **Step 8: Run the app's tests**

Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/app.log" -only-testing:DataEditorTests`
Expected: `TEST SUCCEEDED`.

- [ ] **Step 9: Stop bundling Node and ccc-server**

In `Runtime.swift`, delete `node` and `cccRoot`; its doc comment: `/// What the app bundles under Contents/Resources/Runtime: oxfmt, and the Node and ccc-server the preview downloads.`

In `embed-runtime.sh`, delete the `node_version` and `ccc_ref` lines, the `# Node, checked against…` block through `cp …/bin/node "$out/node"`, and the `# ccc-server at the pinned commit` block. Its header comment becomes:

```bash
# Builds macos/DataEditor/build/runtime for arm64 macOS: oxfmt's standalone
# binary, the Node archive the preview downloads (node.json) and the
# ccc-server commit it runs (ccc-server.ref).
```

In `mise.toml`, `data-editor:runtime`'s description becomes `"Build what the Mac data editor bundles: oxfmt, and the preview's Node and ccc-server pins"`.

Delete `macos/DataEditor/Runtime.entitlements`: its JIT and library-validation exceptions were for the bundled Node and workerd, which the app no longer carries. The downloaded Node runs with the entitlements its makers signed it with. (The earlier plan's Task 16, signing, must sign `Runtime/oxfmt` with no entitlements file.)

Run: `mise run data-editor:runtime && ls macos/DataEditor/build/runtime && du -sh macos/DataEditor/build/runtime`
Expected: `ccc-server.ref  node.json  oxfmt`, about 6 MB.

- [ ] **Step 10: Run every check**

Run: `cd macos/DataEditor/DataEditorKit && DATA_EDITOR_NODE="$(mise which node)" swift test`
Expected: PASS.

Run: `mise run test:node`
Expected: PASS.

Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/app.log" -only-testing:DataEditorTests`
Expected: `TEST SUCCEEDED`.

Ask Wren first, since it takes the screen:
Run: `.superpowers/sdd/2026-11-05-mac-data-editor/apptest.sh "$TMPDIR/ui.log" -only-testing:DataEditorUITests`
Expected: `TEST SUCCEEDED`.

Run: `cd macos/DataEditor && CCC_ROOT=<a ccc-server checkout at ccc-server.ref> node --test e2e/preview.test.mjs`
Expected: PASS, unchanged.

- [ ] **Step 11: Commit**

```bash
git rm macos/DataEditor/Runtime.entitlements
git add macos/DataEditor/DataEditorKit/Sources/DataEditorKit/PreviewInstaller.swift \
  macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/PreviewInstallerTests.swift \
  macos/DataEditor/DataEditor macos/DataEditor/DataEditorTests/PreviewControlTests.swift \
  macos/DataEditor/scripts/embed-runtime.sh mise.toml
git commit -m "Download the data editor's preview server at its first start

Most contributors never start the preview, so the 615 MB of ccc-server
and its dependencies, and Node, now come down only when one does.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 12: Write the manual check into the PR**

Post this on PR StoDevX/AAO-React-Native#8825 as a comment from Wren's account, starting with the attribution line (`🤖 *Written by Claude (Claude Code, Opus 5.5), an AI assistant, and posted from this account.*`), once Task 7 is on master and Pages serves `data-editor/helper.json`. Ask Wren before posting.

```markdown
### Manual check: the helper from Pages, and the preview downloaded at first start

- [ ] Move `~/Library/Application Support/com.drewvolz.allaboutolaf-data-editor` aside, launch: "Downloading…", then the editor opens. Edit The Cage's notes; the file saves, formatted.
- [ ] Start Preview: the control reads "Downloading preview…", its popover "Getting the preview server ready. This happens once." Then "Preview on", and the phone shows the edit.
- [ ] Stop during the download; Start Preview again: it downloads again and runs.
- [ ] Quit, turn Wi-Fi off, launch: the editor opens and edits; Start Preview runs.
- [ ] With Application Support's `preview/node/` removed and Wi-Fi off, Start Preview: "Preview stopped", and the popover says "Couldn't download the preview server."
```
