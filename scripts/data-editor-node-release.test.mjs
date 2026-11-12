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
