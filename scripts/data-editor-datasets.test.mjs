import assert from 'node:assert/strict'
import {cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import {load} from 'js-yaml'
import {listRecords, loadCatalog, recordSchema} from './data-editor-datasets.mjs'
import {DATA_BASE} from './paths.mjs'

const catalog = loadCatalog(DATA_BASE)

/** A copy of the repo's data, to change without touching the checkout. */
function dataCopy() {
	let dir = mkdtempSync(path.join(tmpdir(), 'datasets-'))
	cpSync(DATA_BASE, dir, {recursive: true})
	return dir
}

describe('the data-set catalog', () => {
	it('describes every set in a group, and puts every described set in a group', () => {
		let grouped = catalog.groups.flatMap((group) => group.sets)
		let byName = (a, b) => a.localeCompare(b)
		assert.deepEqual(grouped.toSorted(byName), Object.keys(catalog.sets).toSorted(byName))
		assert.equal(new Set(grouped).size, grouped.length)
	})

	it('names paths that exist in data/', () => {
		for (let [name, set] of Object.entries(catalog.sets)) {
			assert.ok(existsSync(path.join(DATA_BASE, set.path)), `${name}: ${set.path}`)
		}
	})

	it('names schemas that exist', () => {
		for (let [name, set] of Object.entries(catalog.sets)) {
			if (set.schema === undefined) continue
			let file = path.join(DATA_BASE, '_schemas', `${set.schema}.yaml`)
			assert.ok(existsSync(file), `${name}: ${set.schema}`)
		}
	})
})

describe('listRecords', () => {
	it('titles and sections contacts', () => {
		let pubsafe = load(readFileSync(path.join(DATA_BASE, 'contact-info/1-1-pubsafe.yaml'), 'utf8'))
		assert.deepEqual(listRecords(DATA_BASE, catalog, 'contact-info')[0], {
			set: 'contact-info',
			file: 'contact-info/1-1-pubsafe.yaml',
			path: [],
			title: 'PubSafe',
			subtitle: pubsafe.synopsis,
			section: 'Safety',
			editable: true,
		})
	})

	it('places FAQs at their index', () => {
		let [first] = listRecords(DATA_BASE, catalog, 'faqs')
		assert.deepEqual(first.path, ['faqs', 0])
		assert.equal(first.title, 'Say hello to us')
	})

	it('keys a map entry by its name', () => {
		let stav = listRecords(DATA_BASE, catalog, 'bonapp-overrides').find(
			(record) => record.title === 'stav-hall',
		)
		assert.deepEqual(stav?.path, ['venues', 'stav-hall'])
	})

	it('lists a whole-file set as one record', () => {
		let records = listRecords(DATA_BASE, catalog, 'pause-menu')
		assert.equal(records.length, 1)
		assert.deepEqual(records[0].path, [])
	})

	it('does not offer generated bus lines for editing', () => {
		let records = listRecords(DATA_BASE, catalog, 'bus-times')
		assert.equal(records.find((record) => record.title === 'Red Line')?.editable, false)
		assert.equal(records.find((record) => record.file.endsWith('1-express.yaml'))?.editable, true)
	})

	it('does not offer a read-only set for editing', () => {
		assert.ok(listRecords(DATA_BASE, catalog, 'student-wages').every((record) => !record.editable))
	})

	it('names an untitled record for its kind', () => {
		let dir = dataCopy()
		let file = path.join(dir, 'faqs.yaml')
		writeFileSync(file, readFileSync(file, 'utf8').replace("    question: 'Say hello to us'\n", ''))
		assert.equal(listRecords(dir, loadCatalog(dir), 'faqs')[0].title, 'Untitled FAQ')
	})
})

describe('recordSchema', () => {
	it('inlines the shared definitions', () => {
		let phone = recordSchema(DATA_BASE, catalog, 'contact-info').properties.phoneNumber
		assert.equal(phone.$ref, undefined)
		assert.equal(typeof phone.pattern, 'string')
	})

	it('is the item schema for a list set', () => {
		let schema = recordSchema(DATA_BASE, catalog, 'faqs')
		assert.ok(schema.required.includes('question'))
	})

	it('is the entry schema for a map set', () => {
		let schema = recordSchema(DATA_BASE, catalog, 'bonapp-overrides')
		assert.ok('dayparts' in schema.properties)
	})
})
