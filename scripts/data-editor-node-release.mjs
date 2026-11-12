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
	if (!checksum || !url || !version) {
		throw new Error(`mise.lock's ${ENTRY} entry lacks a checksum or url`)
	}
	return {version, url, sha256: checksum}
}

if (import.meta.main) {
	let out = process.argv[2]
	if (!out) throw new Error('usage: data-editor-node-release.mjs <out.json>')
	let lock = await readFile(path.join(REPO_ROOT, 'mise.lock'), 'utf8')
	await writeFile(out, `${JSON.stringify(nodeRelease(lock))}\n`)
}
