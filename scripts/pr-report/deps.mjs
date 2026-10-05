/**
 * Read the installed dependencies for the pull request report.
 */

import {lstatSync, readdirSync} from 'node:fs'
import {join} from 'node:path'

import {load} from 'js-yaml'
import semver from 'semver'

/**
 * Orders versions by semver. A version that is not one (a tarball URL) goes
 * after those that are, by text, since semver cannot compare it.
 */
function compareVersions(a, b) {
	let aValid = semver.valid(a) !== null
	let bValid = semver.valid(b) !== null
	if (aValid && bValid) {
		return semver.compare(a, b)
	}
	if (aValid !== bValid) {
		return aValid ? -1 : 1
	}
	return a.localeCompare(b)
}

/**
 * Lists each package in a pnpm lockfile's `packages:` section with the
 * versions installed, in semver order. A key is `name@version`; a scoped name starts
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
		versions.sort(compareVersions)
	}
	return packages
}

/**
 * Sums the bytes of the regular files under `dir`. pnpm hard-links a package
 * everywhere it is used and symlinks packages into each other, so a file with
 * several links counts once and a symlink counts nothing. The walk is
 * explicit because a recursive `readdirSync` follows symlinked directories,
 * which counts a file once for every path that reaches it wherever the
 * filesystem clones files instead of hard-linking them.
 */
export function nodeModulesBytes(dir) {
	let seen = new Set()
	let bytes = 0
	let pending = [dir]
	while (pending.length > 0) {
		let current = pending.pop()
		for (let entry of readdirSync(current, {withFileTypes: true})) {
			let path = join(current, entry.name)
			if (entry.isDirectory()) {
				pending.push(path)
			} else if (entry.isFile()) {
				let stat = lstatSync(path)
				if (stat.nlink > 1) {
					let id = `${stat.dev}:${stat.ino}`
					if (seen.has(id)) {
						continue
					}
					seen.add(id)
				}
				bytes += stat.size
			}
		}
	}
	return bytes
}

/**
 * Names the `name@version` a directory in `node_modules/.pnpm` holds, or null
 * for an entry that is not a package. pnpm writes a scoped name with `+` for
 * its slash and appends `_<peer>` or `_patch_hash=…` after the version.
 */
export function packageKeyOfDir(dirName) {
	let at = dirName.indexOf('@', 1)
	if (at === -1) {
		return null
	}
	let name = dirName.slice(0, at).replace('+', '/')
	let version = dirName.slice(at + 1).split('_')[0]
	return `${name}@${version}`
}

/**
 * Measures each installed version: the bytes of its own files in
 * `node_modules/.pnpm`, keyed `name@version`. A version installed against
 * several peers has one directory for each, all hard links to the same files,
 * so it takes the largest rather than the sum.
 */
export function installedSizes(pnpmDir) {
	let sizes = {}
	for (let entry of readdirSync(pnpmDir, {withFileTypes: true})) {
		let key = entry.isDirectory() ? packageKeyOfDir(entry.name) : null
		if (key !== null) {
			sizes[key] = Math.max(sizes[key] ?? 0, nodeModulesBytes(join(pnpmDir, entry.name)))
		}
	}
	return sizes
}

/** Pairs installed and bundled bytes for each version, with 0 for a side that has none. */
export function combineSizes(installed, bundled) {
	let sizes = {}
	for (let key of new Set([...Object.keys(installed), ...Object.keys(bundled)])) {
		sizes[key] = {installed: installed[key] ?? 0, bundled: bundled[key] ?? 0}
	}
	return sizes
}
