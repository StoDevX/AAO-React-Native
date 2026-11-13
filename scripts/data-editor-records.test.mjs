import assert from 'node:assert/strict'
import {readdirSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {describe, it} from 'node:test'
import {load} from 'js-yaml'
import {listRecords, loadCatalog} from './data-editor-datasets.mjs'
import {DATA_BASE} from './paths.mjs'
import {
	createRecord,
	orderedNames,
	removeRecord,
	reorderRecords,
	slugFor,
} from './data-editor-records.mjs'
import {scratchData} from './data-editor-test-support.mjs'

const filesIn = (folder) => readdirSync(path.join(DATA_BASE, folder)).toSorted()

describe('slugFor', () => {
	it('drops apostrophes', () => {
		assert.equal(slugFor("Lion's Pantry", new Set()), 'lions-pantry')
	})

	it('folds accents', () => {
		assert.equal(slugFor('Café', new Set()), 'cafe')
	})

	it('numbers a slug already taken', () => {
		assert.equal(slugFor('PubSafe', new Set(['pubsafe'])), 'pubsafe-2')
	})
})

describe('orderedNames', () => {
	it('renumbers a one-part prefix in the order given', () => {
		let [first, second, ...rest] = filesIn('transportation')
		assert.deepEqual(orderedNames([second, first, ...rest]), [
			'1-ole-bikes.yaml',
			'2-hiawathaland-transit.yaml',
			'3-campus-go.yaml',
			'4-break-airport-shuttles.yaml',
			'5-first-choice-shuttle.yaml',
			'6-all-options.yaml',
		])
	})

	it('renumbers within a section, and leaves the other sections as they are', () => {
		let [first, second, ...rest] = filesIn('contact-info')
		let names = orderedNames(
			[second, first, ...rest],
			['A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'C', 'D', 'D'],
		)
		assert.deepEqual(names.slice(0, 2), ['1-1-mobile-crisis.yaml', '1-2-pubsafe.yaml'])
		assert.deepEqual(names.slice(5), filesIn('contact-info').slice(5))
	})

	it("numbers a sectioned folder by the sections shown, not the files' old prefixes", () => {
		let names = orderedNames(
			['1-1-pubsafe.yaml', '5-1-title-ix.yaml', '1-2-mobile-crisis.yaml', '1-5-lighthouse.yaml'],
			['Safety', 'Safety', 'Safety', 'Wellness'],
		)
		assert.deepEqual(names, [
			'1-1-pubsafe.yaml',
			'1-2-title-ix.yaml',
			'1-3-mobile-crisis.yaml',
			'2-1-lighthouse.yaml',
		])
	})

	it('keeps the digits a title begins with in a folder of one-part prefixes', () => {
		assert.deepEqual(orderedNames(['1-a.yaml', '2-b.yaml', '7-24-hour-shuttle.yaml']), [
			'1-a.yaml',
			'2-b.yaml',
			'3-24-hour-shuttle.yaml',
		])
	})
})

describe('createRecord', () => {
	it('titles a new contact and files it after the others', async () => {
		let {dataDir} = await scratchData()
		let {created, problems} = await createRecord(dataDir, 'contact-info', {
			title: 'Title IX',
			section: 'Wellness',
		})
		assert.equal(created.file, 'contact-info/5-1-title-ix.yaml')
		assert.equal(created.section, 'Wellness')
		assert.equal(created.title, 'Title IX')
		let data = load(await readFile(path.join(dataDir, created.file), 'utf8'))
		assert.deepEqual(data, {title: 'Title IX', category: 'Wellness'})
		assert.ok(
			problems.some((problem) => problem.message.includes('Phone Number')),
			JSON.stringify(problems),
		)
	})

	it('appends a new FAQ to the list', async () => {
		let {dataDir} = await scratchData()
		let {created, records} = await createRecord(dataDir, 'faqs', {title: 'Where is the Pause?'})
		assert.deepEqual(created.path, ['faqs', records.length - 1])
	})
})

describe('removeRecord', () => {
	it('removes a FAQ and leaves the text above the list alone', async () => {
		let {dataDir} = await scratchData()
		let file = path.join(dataDir, 'faqs.yaml')
		let before = await readFile(file, 'utf8')
		let {records} = await removeRecord(dataDir, 'faqs', {file: 'faqs.yaml', path: ['faqs', 0]})
		let after = await readFile(file, 'utf8')
		assert.equal(records.length, load(before).faqs.length - 1)
		assert.equal(after.slice(0, after.indexOf('faqs:')), before.slice(0, before.indexOf('faqs:')))
	})

	it('removes a contact file', async () => {
		let {dataDir} = await scratchData()
		let {records} = await removeRecord(dataDir, 'contact-info', {
			file: 'contact-info/1-1-pubsafe.yaml',
			path: [],
		})
		assert.ok(!records.some((record) => record.title === 'PubSafe'))
	})
})

describe('reorderRecords', () => {
	it('moves a contact above another, keeping both', async () => {
		let {dataDir} = await scratchData()
		let files = filesIn('contact-info').map((name) => ({file: `contact-info/${name}`, path: []}))
		let [first, second, ...rest] = files
		let {records} = await reorderRecords(dataDir, 'contact-info', [second, first, ...rest])
		assert.deepEqual(
			records.slice(0, 2).map((record) => [record.file, record.title]),
			[
				['contact-info/1-1-mobile-crisis.yaml', 'Mobile Crisis'],
				['contact-info/1-2-pubsafe.yaml', 'PubSafe'],
			],
		)
	})

	it('moves a FAQ with the comment written above it', async () => {
		let {dataDir} = await scratchData()
		let file = path.join(dataDir, 'faqs.yaml')
		let text = await readFile(file, 'utf8')
		let second = text.indexOf('  - id:', text.indexOf('  - id:') + 1)
		await writeFile(file, `${text.slice(0, second)}  # about SIS\n${text.slice(second)}`)
		let count = load(text).faqs.length
		let order = [1, 0, ...Array.from({length: count - 2}, (_, index) => index + 2)].map(
			(index) => ({
				file: 'faqs.yaml',
				path: ['faqs', index],
			}),
		)
		await reorderRecords(dataDir, 'faqs', order)
		let after = await readFile(file, 'utf8')
		assert.match(after, /faqs:\n {2}# about SIS\n {2}- id: sis-login-disabled/u)
	})
})

describe('records a scrape or generator names', () => {
	it('cannot be reordered, since the scrape writes them by name', async () => {
		let {dataDir} = await scratchData()
		let order = listRecords(dataDir, loadCatalog(dataDir), 'building-hours').map((record) => ({
			file: record.file,
			path: record.path,
		}))
		await assert.rejects(
			reorderRecords(dataDir, 'building-hours', order.toReversed()),
			/scrape|generat/u,
		)
	})

	it('cannot be removed', async () => {
		let {dataDir} = await scratchData()
		await assert.rejects(
			removeRecord(dataDir, 'bus-times', {file: 'bus-times/3-red-line.yaml', path: []}),
			/generat/u,
		)
		await assert.rejects(
			removeRecord(dataDir, 'building-hours', {file: 'building-hours/1-1-cage.yaml', path: []}),
			/scrape/u,
		)
	})
})

describe('an order', () => {
	it('must hold every record of the set once', async () => {
		let {dataDir} = await scratchData()
		let files = filesIn('transportation').map((name) => ({
			file: `transportation/${name}`,
			path: [],
		}))
		await assert.rejects(reorderRecords(dataDir, 'transportation', files.slice(1)), /every record/u)
		await assert.rejects(
			reorderRecords(dataDir, 'transportation', [files[0], ...files.slice(0, -1)]),
			/every record/u,
		)
	})
})
