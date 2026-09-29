import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {exportPlan} from './make-icons.mjs'

describe('exportPlan', () => {
	it('exports a light and dark picker tile and Credits logo for each Icon Composer document', () => {
		let input = 'assets/windmill.icon'
		assert.deepEqual(exportPlan(['windmill.icon']), [
			{input, output: 'images/icons/windmill-icon.png', points: 28, rendition: 'Default'},
			{input, output: 'images/icons/windmill-icon-dark.png', points: 28, rendition: 'Dark'},
			{input, output: 'images/icons/windmill-logo.png', points: 100, rendition: 'Default'},
			{input, output: 'images/icons/windmill-logo-dark.png', points: 100, rendition: 'Dark'},
		])
	})

	it('ignores anything that is not an Icon Composer document', () => {
		assert.deepEqual(exportPlan(['0-source-icons', '.DS_Store']), [])
	})
})
