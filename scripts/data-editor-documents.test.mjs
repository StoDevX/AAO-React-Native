import assert from 'node:assert/strict'
import {mkdtemp, readFile, writeFile} from 'node:fs/promises'
import {readdirSync, readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import {isDataEntry} from './data-entries.mjs'
import {isNotJunk} from './junk.mjs'
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
	// every file the editor may write and the formatter checks, the files steering
	// a scrape among them; .prettierignore leaves the bus times unformatted
	let files = readdirSync(DATA_BASE, {recursive: true}).filter(
		(file) =>
			file.endsWith('.yaml') && isNotJunk(path.basename(file)) && !file.startsWith('bus-times/'),
	)
	for (let file of files) {
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

	it('leaves a folded paragraph it did not change wrapped as it was', async () => {
		let root = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
		let text = `venues:
  the-kings-room:
    watch_only: >-
      Sushirito, Cage Express and Med-Express all serve this room's lunch.
      They are not separate venues in AAO.
    file: kings.yaml
`
		await writeFile(path.join(root, 'overrides.yaml'), text)
		await new DocumentStore(root).edit('overrides.yaml', [
			{path: ['venues', 'the-kings-room', 'file'], value: 'cage.yaml'},
		])
		assert.equal(
			await readFile(path.join(root, 'overrides.yaml'), 'utf8'),
			text.replace('kings.yaml', 'cage.yaml'),
		)
	})

	it('adds a row in the style of its neighbours', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [
			{path: ['schedule', 0, 'hours', 2], value: {days: ['Su'], from: '9:00am', to: '10:30am'}},
		])
		assert.equal(await read(), FIXTURE + "      - {days: [Su], from: '9:00am', to: '10:30am'}\n")
	})

	/// A bus timetable writes each trip on one line, its times unquoted, and each stop's coordinates beside its name.
	const TIMETABLE = `schedules:
  - coordinates:
      Library: [44.45, -93.15]
    stops: [Library, Carleton]
    times:
      - [3:00pm, 3:08pm]
`

	async function storeWithTimetable() {
		let root = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
		await writeFile(path.join(root, 'express.yaml'), TIMETABLE)
		return {
			store: new DocumentStore(root),
			read: () => readFile(path.join(root, 'express.yaml'), 'utf8'),
		}
	}

	it('adds a trip in the style of the trips beside it', async () => {
		let {store, read} = await storeWithTimetable()
		await store.edit('express.yaml', [
			{path: ['schedules', 0, 'times', 1], value: ['4:00pm', '4:08pm']},
		])
		assert.equal(await read(), TIMETABLE + '      - [4:00pm, 4:08pm]\n')
	})

	it("changes a trip's time without quoting it", async () => {
		let {store, read} = await storeWithTimetable()
		await store.edit('express.yaml', [{path: ['schedules', 0, 'times', 0, 1], value: '4:08pm'}])
		assert.equal(await read(), TIMETABLE.replace('3:08pm', '4:08pm'))
	})

	it("adds a stop's coordinates in the style of the others", async () => {
		let {store, read} = await storeWithTimetable()
		await store.edit('express.yaml', [
			{path: ['schedules', 0, 'coordinates', 'Carleton'], value: [44.46, -93.15]},
		])
		assert.match(await read(), /\n {6}Carleton: \[44\.46, -93\.15\]\n/u)
	})

	/// Closing writes `hours: []`; reopening adds a row to that list.
	it('writes a row added to a closed schedule on a line of its own', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [{path: ['schedule', 0, 'hours'], value: []}])
		await store.edit('cage.yaml', [
			{path: ['schedule', 0, 'hours', 0], value: {days: ['Mo'], from: '9:00am', to: '5:00pm'}},
		])
		assert.match(
			await read(),
			/\n {4}hours:\n {6}- \{days: \[Mo\], from: '9:00am', to: '5:00pm'\}\n/u,
		)
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

	it('quotes a time written over a plain scalar', async () => {
		let {store, read} = await storeWithFixture()
		await store.edit('cage.yaml', [{path: ['schedule', 0, 'notes'], value: '8:00pm'}])
		assert.match(await read(), /\n {4}notes: '8:00pm'\n/u)
	})

	it('refuses an edit with no value', async () => {
		let {store} = await storeWithFixture()
		await assert.rejects(store.edit('cage.yaml', [{path: ['name']}]), /needs a value/u)
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

describe('DocumentStore.rename', () => {
	it('swaps two names in use, leaving nothing half moved', async () => {
		let root = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
		await writeFile(path.join(root, 'a.yaml'), 'name: A\n')
		await writeFile(path.join(root, 'b.yaml'), 'name: B\n')
		await new DocumentStore(root).rename([
			{from: 'a.yaml', to: 'b.yaml'},
			{from: 'b.yaml', to: 'a.yaml'},
		])
		assert.equal(await readFile(path.join(root, 'a.yaml'), 'utf8'), 'name: B\n')
		assert.equal(await readFile(path.join(root, 'b.yaml'), 'utf8'), 'name: A\n')
		assert.deepEqual(readdirSync(root).toSorted(), ['a.yaml', 'b.yaml'])
	})
})
