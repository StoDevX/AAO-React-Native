// What a `modules/*` package imports, set against what its package.json
// declares. Node and Metro both walk up to the repo root when resolving, and
// the root declares most of these for the app's own use, so an undeclared
// import resolves anyway and looks fine — right up until the hoist changes or
// the package is consumed somewhere without that root. pnpm cannot catch it:
// a workspace package is a symlink to its real directory inside the repo.

import fs from 'node:fs'
import {builtinModules} from 'node:module'
import path from 'node:path'

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

const BUILTINS = new Set(builtinModules)

// An `import` or `export` statement, anchored to the start of a line so that a
// package named inside a test's title, a comment or a string is not read as
// one. The lazy middle spans lines, for an import that lists its names one to
// a line, and stops at any quote, so it cannot run on into a later statement.
const STATEMENT = /^[ \t]*(?:import|export)\b(?:[^;'"`]*?\bfrom)?[ \t]*['"]([^'"]+)['"]/gmu

// `require('x')`, `import('x')`, and Jest's mocks of a module, which need it
// resolvable as much as an import does.
const CALL =
	/\b(?:require|import|jest\.mock|jest\.requireActual|jest\.requireMock)\s*\(\s*['"]([^'"]+)['"]/gu

/** The package a specifier belongs to, or null for a relative path or a Node builtin. */
function packageOf(specifier) {
	if (specifier.startsWith('.') || specifier.startsWith('/')) return null
	if (specifier.startsWith('node:')) return null
	let parts = specifier.split('/')
	let name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
	return BUILTINS.has(name) ? null : name
}

/** Every package `source` imports, by package name. */
export function importedPackages(source) {
	let found = new Set()
	for (let pattern of [STATEMENT, CALL]) {
		for (let [, specifier] of source.matchAll(pattern)) {
			let name = packageOf(specifier)
			if (name) found.add(name)
		}
	}
	return found
}

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

/** Whether `file` is a test, which may use packages the module only needs in development. */
function isTest(file) {
	return file.split(path.sep).includes('__tests__') || /\.test\.[a-z]+$/u.test(file)
}

const byName = (a, b) => a.localeCompare(b)

/**
 * What is wrong with how the module at `moduleDir` declares its imports, one
 * message per problem; empty when nothing is. Every package it imports must be
 * declared; one imported outside its tests must be a dependency or a peer,
 * since a dev dependency is not installed for whoever uses the module; and
 * every `@frogpond` package it declares must be imported.
 */
export function moduleProblems(moduleDir) {
	let manifest = JSON.parse(fs.readFileSync(path.join(moduleDir, 'package.json'), 'utf-8'))
	let installed = new Set([
		...Object.keys(manifest.dependencies ?? {}),
		...Object.keys(manifest.peerDependencies ?? {}),
	])
	let devOnly = new Set(
		Object.keys(manifest.devDependencies ?? {}).filter((name) => !installed.has(name)),
	)

	let inTests = new Set()
	let outsideTests = new Set()
	for (let file of sourceFilesIn(moduleDir)) {
		let target = isTest(file) ? inTests : outsideTests
		for (let name of importedPackages(fs.readFileSync(file, 'utf-8'))) target.add(name)
	}
	inTests.delete(manifest.name)
	outsideTests.delete(manifest.name)

	let problems = []
	let imported = new Set([...inTests, ...outsideTests])
	for (let name of [...installed, ...devOnly].sort(byName)) {
		if (name.startsWith('@frogpond/') && !imported.has(name)) {
			problems.push(`${manifest.name} declares ${name} but does not import it`)
		}
	}
	for (let name of [...imported].sort(byName)) {
		if (!installed.has(name) && !devOnly.has(name)) {
			problems.push(`${manifest.name} imports ${name} without declaring it`)
		} else if (outsideTests.has(name) && !installed.has(name)) {
			problems.push(
				`${manifest.name} imports ${name} outside its tests, but declares it only in devDependencies`,
			)
		}
	}
	return problems
}
