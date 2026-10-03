import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {exportPlan} from './make-icons.mjs'

describe('exportPlan', () => {
	it('exports a light and dark preview for each Icon Composer document', () => {
		let input = 'assets/windmill.icon'
		assert.deepEqual(exportPlan(['windmill.icon']), [
			{
				input,
				preview: 'logo',
				output: 'images/icons/windmill-logo.png',
				points: 100,
				rendition: 'Default',
			},
			{
				input,
				preview: 'logo',
				output: 'images/icons/windmill-logo-dark.png',
				points: 100,
				rendition: 'Dark',
			},
		])
	})

	it('adds the tinted renditions when asked for all of them', () => {
		let tinted = exportPlan(['windmill.icon'], {all: true}).filter((p) =>
			p.rendition.startsWith('Tinted'),
		)
		assert.deepEqual(
			tinted.map((p) => [p.output, p.rendition]),
			[
				['images/icons/windmill-logo-tinted-light.png', 'TintedLight'],
				['images/icons/windmill-logo-tinted-dark.png', 'TintedDark'],
			],
		)
	})

	it('ignores anything that is not an Icon Composer document', () => {
		assert.deepEqual(exportPlan(['0-source-icons', '.DS_Store']), [])
	})
})
