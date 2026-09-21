import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import {findBusDataFiles, validate} from './validate-bus-schedules.mjs'

/** A minimal line, valid unless a caller breaks it. */
function line(overrides = {}) {
	return {
		line: 'Test Line',
		colors: {bar: 'rgb(0, 0, 0)', dot: 'rgb(0, 0, 0)'},
		schedules: [
			{
				days: ['Mo'],
				stops: ['First', 'Second'],
				times: [['6:00am', '6:10am']],
			},
		],
		...overrides,
	}
}

describe('validate', () => {
	it('accepts a schedule whose times match its stops', () => {
		assert.deepEqual([...validate(line())], [])
	})

	it('reports a row with more times than stops', () => {
		let broken = line({
			schedules: [
				{days: ['Mo'], stops: ['First', 'Second'], times: [['6:00am', '6:10am', '6:20am']]},
			],
		})

		let errors = [...validate(broken)]

		assert.equal(errors.length, 1)
		assert.match(errors[0], /2 named stops but 3 arrival times/u)
	})

	it('reports times that run backwards', () => {
		let broken = line({
			schedules: [{days: ['Mo'], stops: ['First', 'Second'], times: [['6:10am', '6:00am']]}],
		})

		let errors = [...validate(broken)]

		assert.equal(errors.length, 1)
		assert.match(errors[0], /"6:10am" is after "6:00am"/u)
	})
})

describe('findBusDataFiles', () => {
	it('skips _-prefixed files, which are overrides rather than bus lines', () => {
		let dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bus-times-'))
		fs.writeFileSync(path.join(dir, 'blue-line.yaml'), 'line: Blue\n')
		fs.writeFileSync(path.join(dir, '_curation.yaml'), 'routes: {}\n')
		fs.writeFileSync(path.join(dir, '_repairs.yaml'), 'repairs: []\n')

		let found = findBusDataFiles(dir).map((f) => path.basename(f))

		assert.deepEqual(found, ['blue-line.yaml'])
	})
})
