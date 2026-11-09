import assert from 'node:assert/strict'
import {mkdir, mkdtemp, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {after, before, describe, it} from 'node:test'
import {serve} from './data-editor-serve.mjs'

describe('serve', () => {
	let server
	let base
	before(async () => {
		let parent = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
		let root = path.join(parent, 'out')
		await mkdir(path.join(root, 'img/spaces'), {recursive: true})
		await writeFile(path.join(root, 'bus-times.json'), '{"ok":true}')
		await writeFile(path.join(root, 'img/spaces/cage.webp'), 'RIFF')
		await writeFile(path.join(parent, 'secret.txt'), 'no')
		server = await serve({root, port: 0, host: '127.0.0.1'})
		base = `http://127.0.0.1:${server.address().port}`
	})
	after(() => server.close())

	it('serves a JSON file, never cached', async () => {
		let response = await fetch(`${base}/bus-times.json`)
		assert.equal(response.status, 200)
		assert.equal(response.headers.get('content-type'), 'application/json')
		assert.equal(response.headers.get('cache-control'), 'no-store')
		assert.deepEqual(await response.json(), {ok: true})
	})
	it('serves an image', async () => {
		let response = await fetch(`${base}/img/spaces/cage.webp`)
		assert.equal(response.headers.get('content-type'), 'image/webp')
	})
	it('answers 404 for a missing file', async () => {
		assert.equal((await fetch(`${base}/nope.json`)).status, 404)
	})
	it('never serves outside its root', async () => {
		assert.equal((await fetch(`${base}/%2e%2e/secret.txt`)).status, 404)
	})
	it('answers 400 for a malformed path', async () => {
		assert.equal((await fetch(`${base}/%E0%A4%A`)).status, 400)
	})
	it('answers 405 for a POST', async () => {
		assert.equal((await fetch(`${base}/bus-times.json`, {method: 'POST'})).status, 405)
	})
})
