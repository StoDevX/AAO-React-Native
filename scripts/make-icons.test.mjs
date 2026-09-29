import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {exportPlan} from './make-icons.mjs'

describe('exportPlan', () => {
	it('exports a picker tile and a Credits logo for each Icon Composer document', () => {
		assert.deepEqual(exportPlan(['windmill.icon']), [
			{input: 'assets/windmill.icon', output: 'images/icons/windmill-icon.png', points: 28},
			{input: 'assets/windmill.icon', output: 'images/icons/windmill-logo.png', points: 100},
		])
	})

	it('ignores anything that is not an Icon Composer document', () => {
		assert.deepEqual(exportPlan(['0-source-icons', '.DS_Store']), [])
	})
})
