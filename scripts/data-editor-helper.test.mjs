import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {readdirSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'
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
	it('keeps the build the app serves and the new one', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		let helper = createHandlers({dataDir, outDir, bundleData: BUNDLE_DATA})
		let first = await helper.build({})
		let second = await helper.build({serving: first.dir})
		assert.deepEqual(
			readdirSync(outDir).sort(),
			[path.basename(first.dir), path.basename(second.dir)].sort(),
		)
		let third = await helper.build({serving: second.dir})
		assert.deepEqual(
			readdirSync(outDir).sort(),
			[path.basename(second.dir), path.basename(third.dir)].sort(),
		)
	})

	/// A helper started again, as after a crash, knows nothing of the build
	/// the app still serves.
	it('keeps the build the app serves after the helper restarts', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		let served = await createHandlers({dataDir, outDir, bundleData: BUNDLE_DATA}).build({})
		let fresh = createHandlers({dataDir, outDir, bundleData: BUNDLE_DATA})
		let next = await fresh.build({serving: served.dir})
		assert.deepEqual(
			readdirSync(outDir).sort(),
			[path.basename(served.dir), path.basename(next.dir)].sort(),
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
	/// A file's base version is text the app holds, not a file in the data folder.
	it('parses YAML text it is given', async () => {
		let reply = await handle(
			await handlers(),
			JSON.stringify({
				id: 3,
				method: 'parse',
				params: {text: "name: The Cage\nhours: [{from: '9:00am'}]\n"},
			}),
		)
		assert.deepEqual(reply.result, {name: 'The Cage', hours: [{from: '9:00am'}]})
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

describe('the data-set methods', () => {
	const ask = async (target, method, params) =>
		(await handle(target, JSON.stringify({id: 1, method, params}))).result

	it("list the catalog's sets", async () => {
		let catalog = await ask(await handlers(), 'datasets', {})
		assert.equal(catalog.sets['contact-info'].title, 'Important Contacts')
	})

	it("answer a set's records with their problems", async () => {
		let reply = await ask(await handlers(), 'records', {set: 'faqs'})
		assert.equal(reply.records[0].title, 'Say hello to us')
		assert.deepEqual(reply.problems, [])
	})

	it("give a record's schema with its titles", async () => {
		let schema = await ask(await handlers(), 'schema', {set: 'contact-info'})
		assert.equal(schema.properties.phoneNumber.title, 'Phone Number')
	})

	it('add a record and name it in the reply', async () => {
		let reply = await ask(await handlers(), 'create', {set: 'faqs', title: 'Where is the Pause?'})
		assert.equal(reply.created.title, 'Where is the Pause?')
	})

	it('write a document and read it back', async () => {
		let target = await handlers()
		await ask(target, 'writeText', {file: 'privacy.md', text: '# Privacy\n'})
		assert.equal(await ask(target, 'readText', {file: 'privacy.md'}), '# Privacy\n')
	})
})

describe('the fix-pass methods', () => {
	const ask = (target, method, params) => handle(target, JSON.stringify({id: 1, method, params}))

	it('check every file it is given, so a record left behind still holds up Submit', async () => {
		let target = await handlers()
		await ask(target, 'create', {set: 'contact-info', title: 'Title IX', section: 'Safety'})
		let reply = await ask(target, 'check', {files: ['contact-info/5-1-title-ix.yaml', 'faqs.yaml']})
		assert.ok(reply.result.some((problem) => problem.file === 'contact-info/5-1-title-ix.yaml'))
		assert.ok(!reply.result.some((problem) => problem.file === 'faqs.yaml'))
	})

	it("move a list's items as nodes, keeping a comment with its item", async () => {
		let {root, dataDir} = await scratchData()
		let target = createHandlers({dataDir, outDir: path.join(root, 'out'), bundleData: BUNDLE_DATA})
		let file = path.join(dataDir, 'pause-menu.yaml')
		let text = await readFile(file, 'utf8')
		await writeFile(
			file,
			text.replace('  - {label: Toppings}', '  # extra charge\n  - {label: Toppings}'),
		)
		let count = (await ask(target, 'load', {file: 'pause-menu.yaml'})).result.value.stationMenus
			.length
		// Toppings, third, goes first
		let order = [2, 0, 1, ...Array.from({length: count - 3}, (_, index) => index + 3)]
		await ask(target, 'move', {file: 'pause-menu.yaml', path: ['stationMenus'], order})
		let after = await readFile(file, 'utf8')
		assert.match(after, /stationMenus:\n {2}# extra charge\n {2}- \{label: Toppings\}/u)
	})

	it('refuse to write a document that changed since it was read', async () => {
		let target = await handlers()
		let read = (await ask(target, 'readText', {file: 'privacy.md'})).result
		await ask(target, 'writeText', {
			file: 'privacy.md',
			text: '# Changed elsewhere\n',
			expected: read,
		})
		let stale = await ask(target, 'writeText', {
			file: 'privacy.md',
			text: '# Mine\n',
			expected: read,
		})
		assert.match(stale.error.message, /changed/u)
		assert.equal(
			(await ask(target, 'readText', {file: 'privacy.md'})).result,
			'# Changed elsewhere\n',
		)
	})
})
