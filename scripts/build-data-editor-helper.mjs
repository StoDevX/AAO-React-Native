#!/usr/bin/env node
// Bundles the data editor's helper and bundle-data, each into one file with
// its dependencies, for the Mac app to run on its own Node. The app copies
// them into its workspace's `scripts/` folder, so the paths they work out
// from their own location (`../data`, `../images`) land in the workspace.
// oxfmt, which writes the data files in the repo's style, formats through a
// native binding that cannot be bundled: its package folder (with the binding
// installed for this machine) ships beside the bundle as node_modules.

import {execFileSync} from 'node:child_process'
import {realpathSync} from 'node:fs'
import {cp, mkdir, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {build} from 'esbuild'
import {REPO_ROOT} from './paths.mjs'

/** The git tree of `dir` at HEAD, which the app compares with master's. */
const treeOf = (dir) =>
	execFileSync('git', ['rev-parse', `HEAD:${dir}`], {cwd: REPO_ROOT, encoding: 'utf8'}).trim()

export async function buildHelper({
	outDir = path.join(REPO_ROOT, 'macos/DataEditor/build/helper'),
} = {}) {
	await mkdir(outDir, {recursive: true})
	let shared = {
		bundle: true,
		platform: 'node',
		format: 'esm',
		target: 'node24',
		logLevel: 'warning',
		external: ['oxfmt'],
		// One file holds every module, so each inlined module's own
		// `import.meta.main` CLI guard (build-faqs and others) would be true.
		define: {'import.meta.main': 'false'},
		// the CommonJS dependencies (Ajv) require Node's builtins
		banner: {
			js: "import {createRequire as __createRequire} from 'node:module'; const require = __createRequire(import.meta.url);",
		},
	}
	await build({
		...shared,
		stdin: {
			contents: "import {main} from './data-editor-helper.mjs'\nmain()\n",
			resolveDir: path.join(REPO_ROOT, 'scripts'),
			sourcefile: 'data-editor-helper-entry.mjs',
		},
		outfile: path.join(outDir, 'data-editor-helper.mjs'),
	})
	await build({
		...shared,
		entryPoints: [path.join(REPO_ROOT, 'scripts/bundle-data.mjs')],
		outfile: path.join(outDir, 'bundle-data.mjs'),
	})
	let modules = path.join(outDir, 'node_modules')
	await rm(modules, {recursive: true, force: true})
	let oxfmt = realpathSync(path.join(REPO_ROOT, 'node_modules/oxfmt'))
	await cp(path.dirname(oxfmt), modules, {recursive: true, dereference: true})
	await writeFile(
		path.join(outDir, 'helper-stamp.json'),
		`${JSON.stringify({scriptsTree: treeOf('scripts'), modulesTree: treeOf('modules')})}\n`,
	)
	return outDir
}

if (import.meta.main) {
	console.log(`data editor helper -> ${await buildHelper()}`)
}
