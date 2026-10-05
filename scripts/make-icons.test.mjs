import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {exportPlan, retroExports, retroPreviews} from './make-icons.mjs'

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

describe('retroExports', () => {
	it('renders a 1024px light and dark icon into the Retro app icon set', () => {
		let plan = retroExports()
		assert.deepEqual(
			plan.map((p) => [p.output, p.rendition]),
			[
				['assets/old-main-retro.xcassets/old-main-retro.appiconset/light.png', 'Default'],
				['assets/old-main-retro.xcassets/old-main-retro.appiconset/dark.png', 'Dark'],
			],
		)
		for (let p of plan) {
			assert.equal(p.input, 'assets/0-source-icons/old-main-retro.icon')
			assert.equal(p.points, 1024)
			assert.equal(p.scale, 1)
			// ictool writes 16 bits a channel, which doubles what actool stores.
			assert.equal(p.depth, 8)
			// ictool bakes in the rounded mask; iOS applies its own, and wants no alpha.
			assert.equal(p.opaque, true)
			// actool stores a 16-bit copy beside each Display P3 image, which undoes the 8 bits.
			assert.equal(p.srgb, true)
		}
	})
})
