import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {readdirSync} from 'node:fs'
import path from 'node:path'
import {createInterface} from 'node:readline'
import {describe, it} from 'node:test'
import {createHandlers, handle, inOrder} from './data-editor-helper.mjs'
import {scratchData} from './data-editor-test-support.mjs'

const BUNDLE_DATA = path.join(import.meta.dirname, 'bundle-data.mjs')

async function handlers() {
	let {root, dataDir} = await scratchData()
	return createHandlers({dataDir, outDir: path.join(root, 'out'), bundleData: BUNDLE_DATA})
}

describe('build', () => {
	/// The Mac app moves its server to a new build once the reply reaches it,
	/// so the build it serves until then must still be there.
	it('keeps the build before the newest until the next one', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		let helper = createHandlers({dataDir, outDir, bundleData: BUNDLE_DATA})
		let first = await helper.build()
		let second = await helper.build()
		assert.deepEqual(
			readdirSync(outDir).sort(),
			[path.basename(first.dir), path.basename(second.dir)].sort(),
		)
		let third = await helper.build()
		assert.deepEqual(
			readdirSync(outDir).sort(),
			[path.basename(second.dir), path.basename(third.dir)].sort(),
		)
	})
})

describe('inOrder', () => {
	it('runs steps one after another and carries on after one throws', async () => {
		let ran = []
		let failures = []
		let run = inOrder((error) => failures.push(error.message))
		run(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10))
			ran.push(1)
		})
		run(() => {
			throw new Error('cannot write')
		})
		await run(() => ran.push(3))
		assert.deepEqual(ran, [1, 3])
		assert.deepEqual(failures, ['cannot write'])
	})
})

describe('handle', () => {
	it('answers a method with its result', async () => {
		let reply = await handle(
			await handlers(),
			JSON.stringify({id: 1, method: 'load', params: {file: 'building-hours/1-1-cage.yaml'}}),
		)
		assert.equal(reply.id, 1)
		assert.equal(reply.result.value.name, 'The Cage')
		assert.deepEqual(reply.result.problems, [])
	})
	it('returns problems with an edit', async () => {
		let reply = await handle(
			await handlers(),
			JSON.stringify({
				id: 2,
				method: 'edit',
				params: {
					file: 'building-hours/1-1-cage.yaml',
					ops: [{path: ['schedule', 0, 'hours', 0, 'from'], value: 'noon'}],
				},
			}),
		)
		assert.ok(reply.result.problems.length > 0)
	})
	it('answers an unknown method with an error', async () => {
		let reply = await handle(await handlers(), '{"id":3,"method":"rm"}')
		assert.deepEqual(reply, {id: 3, error: {message: 'no method rm'}})
	})
	it('does not treat inherited names as methods', async () => {
		let reply = await handle(await handlers(), '{"id":4,"method":"toString"}')
		assert.deepEqual(reply.error, {message: 'no method toString'})
	})
	it('answers a line that is not JSON', async () => {
		assert.deepEqual(await handle(await handlers(), 'nope'), {
			id: null,
			error: {message: 'not JSON'},
		})
	})
	it('turns a thrown error into an error reply', async () => {
		let reply = await handle(
			await handlers(),
			'{"id":5,"method":"load","params":{"file":"../x.yaml"}}',
		)
		assert.match(reply.error.message, /outside the workspace/u)
	})
})

describe('the helper process', () => {
	it('answers requests in order over stdio', async (t) => {
		let {root, dataDir} = await scratchData()
		let child = spawn(process.execPath, [
			path.join(import.meta.dirname, 'data-editor-helper.mjs'),
			'--data',
			dataDir,
			'--out',
			path.join(root, 'out'),
		])
		// a failed assertion must not leave the helper waiting on stdin
		t.after(() => child.kill())
		let lines = createInterface({input: child.stdout})[Symbol.asyncIterator]()
		child.stdin.write('{"id":1,"method":"list"}\n{"id":2,"method":"calendar"}\n')
		let first = JSON.parse((await lines.next()).value)
		let second = JSON.parse((await lines.next()).value)
		child.stdin.end()
		assert.equal(first.id, 1)
		assert.ok(first.result.length > 10)
		assert.equal(second.id, 2)
		assert.ok(Array.isArray(second.result.breaks))
	})
})
