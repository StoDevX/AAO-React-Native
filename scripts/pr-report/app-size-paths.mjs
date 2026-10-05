#!/usr/bin/env node
/**
 * Decide whether a change needs an archive to measure the native app: only
 * a change to something Xcode builds or bundles can change its size.
 */

import {readFileSync} from 'node:fs'

import {CODE_FILE, CONFIG_FILE} from './native-changes.mjs'

/** Paths whose change can change what Xcode builds into the app. */
const NATIVE = [
	CONFIG_FILE,
	CODE_FILE,
	/^ios\//u,
	/^assets\//u,
	/^images\//u,
	// Autolinking reads it to decide which native code a module brings.
	/^modules\/[^/]+\/expo-module\.config\.json$/u,
	/^package\.json$/u,
	/^pnpm-lock\.yaml$/u,
	/^pnpm-workspace\.yaml$/u,
	// Applied by pnpm to node_modules sources that CocoaPods compiles.
	/^patches\//u,
	// Pins the tool versions, Xcode's among them.
	/^mise\.toml$/u,
	// The measurement itself: a change to it must be seen to work.
	/^scripts\/pr-report\/app-size\.mjs$/u,
]

/** Whether a changed file can change the native app. */
export function isNativePath(path) {
	return NATIVE.some((pattern) => pattern.test(path))
}

/**
 * Whether a set of changed files needs an archive. An empty list means the
 * diff could not be read, not that nothing changed, so it needs one.
 */
export function archiveNeeded(files) {
	return files.length === 0 || files.some(isNativePath)
}

if (import.meta.main) {
	let files = readFileSync(process.argv[2], 'utf8')
		.split('\n')
		.filter((line) => line !== '')
	console.log(`needed=${archiveNeeded(files)}`)
}
