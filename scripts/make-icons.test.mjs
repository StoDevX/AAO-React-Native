import assert from 'node:assert/strict'
import {join} from 'node:path'
import {describe, it} from 'node:test'
import {exportPlan, retroPreviews, retroSetImages} from './make-icons.mjs'

describe('exportPlan', () => {
	it('exports a light and dark preview for each Icon Composer document', () => {
		let input = 'assets/windmill.icon'
		assert.deepEqual(exportPlan(['windmill.icon']), [
			{
				input,
				output: 'images/icons/windmill.png',
				points: 100,
				rendition: 'Default',
			},
			{
				input,
				output: 'images/icons/windmill-dark.png',
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
				['images/icons/windmill-tinted-light.png', 'TintedLight'],
				['images/icons/windmill-tinted-dark.png', 'TintedDark'],
			],
		)
	})

	it('ignores anything that is not an Icon Composer document', () => {
		assert.deepEqual(exportPlan(['0-source-icons', '.DS_Store']), [])
	})
})

describe('retroPreviews', () => {
	it('previews the Retro icon from its source document in both appearances', () => {
		let plan = retroPreviews()
		assert.deepEqual(
			plan.map((p) => [p.output, p.rendition]),
			[
				['images/icons/old-main-retro.png', 'Default'],
				['images/icons/old-main-retro-dark.png', 'Dark'],
			],
		)
		for (let p of plan) {
			assert.equal(p.input, 'assets/0-source-icons/old-main-retro.icon')
			assert.equal(p.points, 100)
		}
	})
})

describe('retroSetImages', () => {
	it('stacks each appearance from the layers of the source document, bottom first', () => {
		let assets = 'assets/0-source-icons/old-main-retro.icon/Assets'
		assert.deepEqual(retroSetImages(), [
			{
				output: 'assets/old-main-retro.xcassets/old-main-retro.appiconset/light.png',
				layers: ['background.png', 'pixels-glow.png', 'pixels.svg', 'wave.png'].map((layer) =>
					join(assets, layer),
				),
			},
			{
				output: 'assets/old-main-retro.xcassets/old-main-retro.appiconset/dark.png',
				layers: [
					'background-amber.png',
					'pixels-amber-glow.png',
					'pixels-amber.svg',
					'wave.png',
				].map((layer) => join(assets, layer)),
			},
		])
	})
})
