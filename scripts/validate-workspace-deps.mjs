#!/usr/bin/env node

// Every `modules/*` package must declare the `@frogpond/*` packages it
// imports. Node and Metro both walk up to the repo root when resolving, and
// the root declares most of these for the app's own use, so an undeclared
// import resolves anyway and looks fine — right up until the hoist changes or
// the package is consumed somewhere without that root. This makes the accident
// an error.
//
// Only `@frogpond/*` is checked. Third-party packages would need to account
// for Node builtins, type-only imports and legitimately hoisted app
// dependencies, which is a much noisier problem than this one.

import fs from 'node:fs'
import path from 'node:path'
import {MODULES_BASE} from './paths.mjs'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

// `from '@frogpond/x'`, `require('@frogpond/x')`, `import('@frogpond/x')`, and
// the side-effect form `import '@frogpond/x'` — which has no `from` and would
// otherwise read as an unused declaration, tempting someone to delete a real
// dependency.
//
// Deliberately not a bare substring match: a package named in a comment or a
// doc string is not an import.
const IMPORT_PATTERN =
	/(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*|\bimport\s+)['"](@frogpond\/[a-z0-9-]+)['"]/gu

function* sourceFilesIn(dir) {
	for (let entry of fs.readdirSync(dir, {withFileTypes: true})) {
		if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue

		let full = path.join(dir, entry.name)
		if (entry.isDirectory()) {
			yield* sourceFilesIn(full)
		} else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
			yield full
		}
	}
}

function importedPackages(dir) {
	let found = new Set()
	for (let file of sourceFilesIn(dir)) {
		let contents = fs.readFileSync(file, 'utf-8')
		for (let [, name] of contents.matchAll(IMPORT_PATTERN)) {
			found.add(name)
		}
	}
	return found
}

const byName = (a, b) => a.localeCompare(b)

function inspect(moduleDir) {
	let manifestPath = path.join(moduleDir, 'package.json')
	if (!fs.existsSync(manifestPath)) return null

	let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
	let declared = new Set([
		...Object.keys(manifest.dependencies ?? {}),
		...Object.keys(manifest.peerDependencies ?? {}),
		...Object.keys(manifest.devDependencies ?? {}),
	])

	let imported = importedPackages(moduleDir)
	imported.delete(manifest.name)

	let frogpondDeclared = [...declared].filter((name) => name.startsWith('@frogpond/'))

	return {
		name: manifest.name,
		undeclared: [...imported].filter((name) => !declared.has(name)).sort(byName),
		unused: frogpondDeclared.filter((name) => !imported.has(name)).sort(byName),
	}
}

let failed = false

let entries = fs
	.readdirSync(MODULES_BASE, {withFileTypes: true})
	.sort((a, b) => byName(a.name, b.name))

for (let entry of entries) {
	if (!entry.isDirectory()) continue

	let result = inspect(path.join(MODULES_BASE, entry.name))
	if (!result) continue

	for (let name of result.unused) {
		console.log(`error: ${result.name} declares ${name} but does not import it`)
		failed = true
	}

	for (let name of result.undeclared) {
		console.log(`error: ${result.name} imports ${name} without declaring it`)
		failed = true
	}
}

if (failed) {
	console.log('')
	console.log('A module must declare exactly the @frogpond packages it imports.')
	console.log('Add missing ones as "workspace:*", drop the ones nothing imports,')
	console.log('then run `pnpm install` so the workspace links match.')
	process.exit(1)
}
