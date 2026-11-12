/* oxlint-disable eslint/no-await-in-loop -- these tests swap builds and send requests one at a time, on purpose */
import assert from 'node:assert/strict'
import {mkdir, mkdtemp, rename, rm, writeFile} from 'node:fs/promises'
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

/** A folder holding one file, `hours.json`, saying which build it is. */
async function buildFolder(parent, n) {
	let dir = path.join(parent, `build-${n}`)
	await mkdir(dir, {recursive: true})
	await writeFile(
		path.join(dir, 'hours.json'),
		JSON.stringify({build: n, pad: 'x'.repeat(200_000)}),
	)
	return dir
}

describe('serve while builds change', () => {
	it('survives a build swapped in under a request', async (t) => {
		let parent = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
		let out = path.join(parent, 'out')
		await rename(await buildFolder(parent, 0), out)
		let server = await serve({root: out, port: 0, host: '127.0.0.1'})
		t.after(() => server.close())
		let base = `http://127.0.0.1:${server.address().port}`
		let stop = new AbortController()
		let swaps = (async () => {
			for (let n = 1; !stop.signal.aborted; n++) {
				let next = await buildFolder(parent, n)
				await rename(out, `${out}.old`)
				await rename(next, out)
				await rm(`${out}.old`, {recursive: true, force: true})
			}
		})()
		for (let i = 0; i < 300; i++) {
			await fetch(`${base}/hours.json`).then(
				(r) => r.arrayBuffer(),
				() => undefined,
			)
		}
		stop.abort()
		await swaps
		assert.equal((await fetch(`${base}/hours.json`)).status, 200)
	})

	it('serves whichever build is current, with no gap between them', async (t) => {
		let parent = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
		let current = await buildFolder(parent, 0)
		let server = await serve({root: () => current, port: 0, host: '127.0.0.1'})
		t.after(() => server.close())
		let base = `http://127.0.0.1:${server.address().port}`
		let stop = new AbortController()
		let swaps = (async () => {
			for (let n = 1; !stop.signal.aborted; n++) {
				let previous = current
				current = await buildFolder(parent, n)
				await rm(previous, {recursive: true, force: true})
			}
		})()
		let statuses = new Set()
		for (let i = 0; i < 300; i++) {
			let response = await fetch(`${base}/hours.json`)
			statuses.add(response.status)
			let body = await response.json()
			assert.equal(typeof body.build, 'number')
		}
		stop.abort()
		await swaps
		assert.deepEqual([...statuses], [200])
	})

	it('answers 404 before there is any build', async (t) => {
		let server = await serve({root: () => undefined, port: 0, host: '127.0.0.1'})
		t.after(() => server.close())
		assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/hours.json`)).status, 404)
	})
})
