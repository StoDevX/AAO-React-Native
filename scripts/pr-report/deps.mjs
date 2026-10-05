/**
 * Read the installed dependencies for the pull request report.
 */

import {lstatSync, readdirSync} from 'node:fs'
import {join} from 'node:path'

import {load} from 'js-yaml'

/**
 * Lists each package in a pnpm lockfile's `packages:` section with the
 * versions installed, sorted. A key is `name@version`; a scoped name starts
 * with its own `@`, so the split is the first `@` after the first character.
 * A non-registry version (`foo@https://…`) stays whole.
 */
export function parsePackages(lockfileText) {
	let packages = {}
	for (let key of Object.keys(load(lockfileText).packages ?? {})) {
		let at = key.indexOf('@', 1)
		let name = key.slice(0, at)
		packages[name] = [...(packages[name] ?? []), key.slice(at + 1)]
	}
	for (let versions of Object.values(packages)) {
		versions.sort()
	}
	return packages
}

/**
 * Sums the bytes of the regular files under `dir`. pnpm hard-links a package
 * everywhere it is used and symlinks packages into each other, so a file with
 * several links counts once and a symlink counts nothing.
 */
export function nodeModulesBytes(dir) {
	let seen = new Set()
	let bytes = 0
	for (let entry of readdirSync(dir, {withFileTypes: true, recursive: true})) {
		if (!entry.isFile()) {
			continue
		}
		let stat = lstatSync(join(entry.parentPath, entry.name))
		if (stat.nlink > 1) {
			let id = `${stat.dev}:${stat.ino}`
			if (seen.has(id)) {
				continue
			}
			seen.add(id)
		}
		bytes += stat.size
	}
	return bytes
}
