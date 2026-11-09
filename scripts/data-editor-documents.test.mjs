import assert from 'node:assert/strict'
import {mkdtemp, readFile, writeFile} from 'node:fs/promises'
import {readdirSync, readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import {isDataEntry} from './data-entries.mjs'
import {DATA_BASE} from './paths.mjs'
import {
	DocumentStore,
	FORMAT_OPTIONS,
	inside,
	roundTrip,
	tempFileFor,
} from './data-editor-documents.mjs'

const FIXTURE = `# The Cage's hours, checked 2026-10-01.
name: The Cage
category: Food
kind: space
links:
  - {title: 'The Cage on Bon Appétit', url: 'https://example.com/cage'}

schedule:
  - title: Hours
    notes: The kitchen stops cooking at 8 p.m.
    hours:
      - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '8:00pm'}
      - {days: [Sa, Su], from: '9:00am', to: '8:00pm'}
`

async function storeWithFixture() {
	let root = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
	await writeFile(path.join(root, 'cage.yaml'), FIXTURE)
	return {
		root,
		store: new DocumentStore(root),
		read: () => readFile(path.join(root, 'cage.yaml'), 'utf8'),
	}
}

describe('roundTrip', () => {
	let hours = readdirSync(path.join(DATA_BASE, 'building-hours'))
		.filter(isDataEntry)
		.map((file) => path.join('building-hours', file))
	for (let file of [...hours, 'breaks.yaml']) {
		it(`leaves ${file} as it is`, async () => {
			let text = readFileSync(path.join(DATA_BASE, file), 'utf8')
			assert.equal(await roundTrip(file, text), text)
		})
	}
})

describe('FORMAT_OPTIONS', () => {
	it('are the repo formatter settings', () => {
		let config = JSON.parse(readFileSync(path.join(DATA_BASE, '../.oxfmtrc.json'), 'utf8'))
		for (let [key, value] of Object.entries(FORMAT_OPTIONS)) {
			assert.deepEqual(value, config[key], key)
		}
		for (let key of ['useTabs', 'singleQuote', 'trailingComma', 'bracketSpacing', 'semi']) {
			assert.ok(Object.hasOwn(FORMAT_OPTIONS, key), key)
		}
	})
})

describe('DocumentStore.edit', () => {
	it('changes a time and nothing else', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [{path: ['schedule', 0, 'hours', 0, 'to'], value: '9:00pm'}])
		assert.equal(
			await read(),
			FIXTURE.replace("Fr], from: '7:30am', to: '8:00pm'", "Fr], from: '7:30am', to: '9:00pm'"),
		)
	})

	it('adds a row in the style of its neighbours', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [
			{path: ['schedule', 0, 'hours', 2], value: {days: ['Su'], from: '9:00am', to: '10:30am'}},
		])
		assert.equal(await read(), FIXTURE + "      - {days: [Su], from: '9:00am', to: '10:30am'}\n")
	})

	it('adds a service whose rows are flow maps', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [
			{
				path: ['schedule', 1],
				value: {title: 'Grill', hours: [{days: ['Mo'], from: '11:00am', to: '2:00pm'}]},
			},
		])
		assert.match(
			await read(),
			/- title: Grill\n {4}hours:\n {6}- \{days: \[Mo\], from: '11:00am', to: '2:00pm'\}\n$/u,
		)
	})

	it('wraps a long link the way the formatter does', async () => {
		let {store, read} = await storeWithFixture()
		let url = `https://example.com/${'a'.repeat(100)}`
		await store.edit('cage.yaml', [{path: ['links', 0, 'url'], value: url}])
		assert.match(
			await read(),
			new RegExp(
				`  - \\{\\n      title: 'The Cage on Bon Appétit',\\n      url: '${url}',\\n    \\}\\n`,
				'u',
			),
		)
	})

	it('deletes a row', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [{path: ['schedule', 0, 'hours', 1], delete: true}])
		assert.equal(
			await read(),
			FIXTURE.replace("      - {days: [Sa, Su], from: '9:00am', to: '8:00pm'}\n", ''),
		)
	})

	it('returns the edited value', async () => {
		let {store} = await storeWithFixture()
		let value = await store.edit('cage.yaml', [{path: ['name'], value: 'The Cage Grill'}])
		assert.equal(value.name, 'The Cage Grill')
	})

	it('edits the file as it is on disk, not as it was loaded', async () => {
		let {root, store, read} = await storeWithFixture()
		await store.load('cage.yaml')
		await writeFile(
			path.join(root, 'cage.yaml'),
			FIXTURE.replace('name: The Cage', 'name: The Cage Café'),
		)
		await store.edit('cage.yaml', [{path: ['category'], value: 'Dining'}])
		assert.match(await read(), /name: The Cage Café\ncategory: Dining\n/u)
	})

	it('refuses an edit with no path', async () => {
		let {store} = await storeWithFixture()
		await assert.rejects(store.edit('cage.yaml', [{path: [], value: 1}]), /needs a path/u)
	})

	it('refuses a file outside the workspace', async () => {
		let {store} = await storeWithFixture()
		await assert.rejects(store.load('../outside.yaml'), /outside the workspace/u)
	})
})

describe('inside', () => {
	it('resolves a file in the root', () => {
		assert.equal(inside('/ws/data', 'building-hours/x.yaml'), '/ws/data/building-hours/x.yaml')
	})
	it('refuses a sibling whose name starts with the root', () => {
		assert.throws(() => inside('/ws/data', '../data-old/x.yaml'), /outside the workspace/u)
	})
})

describe('tempFileFor', () => {
	it('names a file next to its subject that the data scripts skip', () => {
		let temp = tempFileFor('/ws/data/building-hours/1-1-cage.yaml')
		assert.equal(path.dirname(temp), '/ws/data/building-hours')
		assert.equal(isDataEntry(path.basename(temp)), false)
	})
})
