#!/usr/bin/env node
// Bundles the data editor's helper and bundle-data for JavaScriptCore, each
// into one plain script, with Node's built-ins swapped for the stand-ins in
// data-editor-jsc/, which reach the Mac app's Swift host. Master's data
// deploy publishes them to GitHub Pages beside the data, with helper.json
// naming the commit they came from and the protocol the helper speaks. A
// Node built-in with no stand-in fails the build, so the app never meets it.

import {execFileSync} from 'node:child_process'
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises'
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
				// esbuild reads the filter as a Go regular expression, which takes no flags
				filter:
					// oxlint-disable-next-line eslint/require-unicode-regexp
					/^(?:react-native|oxfmt|(?:node:)?(?:fs|fs\/promises|path|url|util|module|child_process|http|readline|buffer|process))$/,
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
	// The first line names the commit, which the app checks each script against
	// the data's, since Pages' cache may serve each file from another deploy. It
	// replaces bundle-data's shebang, which esbuild keeps first.
	await Promise.all(
		['helper.js', 'bundle-data.js'].map(async (script) => {
			let file = path.join(outDir, script)
			let text = (await readFile(file, 'utf8')).replace(/^#!.*\n/u, '')
			await writeFile(file, `// data-editor commit ${commit}\n${text}`)
		}),
	)
	await writeFile(
		path.join(outDir, 'helper.json'),
		`${JSON.stringify({commit, protocol: PROTOCOL})}\n`,
	)
	return outDir
}

if (import.meta.main) {
	let {values} = parseArgs({options: {out: {type: 'string'}, commit: {type: 'string'}}})
	let outDir = values.out === undefined ? undefined : path.resolve(values.out)
	console.log(`data editor helper -> ${await buildHelper({outDir, commit: values.commit})}`)
}
