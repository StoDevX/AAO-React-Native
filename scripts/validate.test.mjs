import assert from 'node:assert/strict'
import {mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import {createValidator} from './validate.mjs'

/** A schema folder holding only the two files every validator loads. */
function schemaFolder() {
	let dir = mkdtempSync(path.join(tmpdir(), 'schemas-'))
	writeFileSync(
		path.join(dir, '_defs.yaml'),
		"$id: _defs.json\ndefinitions:\n  phone: {type: string, pattern: '^\\d{10}$'}\n",
	)
	writeFileSync(path.join(dir, '_schedules.yaml'), '$id: schedules.json\n')
	return dir
}

describe('createValidator', () => {
	it('accepts the editor keyword', () => {
		let validator = createValidator(schemaFolder())
		assert.doesNotThrow(() =>
			validator.compile({type: 'string', editor: 'markdown', title: 'Text'}),
		)
	})

	it('resolves _defs from the folder it is given', () => {
		let check = createValidator(schemaFolder()).compile({$ref: '_defs.json#/definitions/phone'})
		assert.equal(check('5077863666'), true)
		assert.equal(check('786-3666'), false)
	})
})
