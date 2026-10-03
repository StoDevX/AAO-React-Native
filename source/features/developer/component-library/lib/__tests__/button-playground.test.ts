import {describe, expect, it} from '@jest/globals'

import {DEFAULT_BUTTON, playgroundModifiers, type ButtonPlayground} from '../button-playground'

/** The modifiers as name/value pairs, which is what the playground decides. */
function described(button: ButtonPlayground) {
	return playgroundModifiers(button).map((modifier) => {
		let {$type, ...rest} = modifier as {$type: string} & Record<string, unknown>
		return [$type, rest]
	})
}

describe('playgroundModifiers', () => {
	it('applies the style, size and shape it is set to', () => {
		let modifiers = described({
			...DEFAULT_BUTTON,
			style: 'borderedProminent',
			size: 'large',
			shape: 'capsule',
		})

		expect(modifiers).toContainEqual(['buttonStyle', {style: 'borderedProminent'}])
		expect(modifiers).toContainEqual(['controlSize', {size: 'large'}])
		expect(modifiers).toContainEqual(['buttonBorderShape', {shape: 'capsule'}])
	})

	it('tints only when a tint is chosen', () => {
		let types = (button: ButtonPlayground) => described(button).map(([type]) => type)

		expect(types({...DEFAULT_BUTTON, tint: 'default'})).not.toContain('tint')
		expect(types({...DEFAULT_BUTTON, tint: 'gold'})).toContain('tint')
	})

	it('disables only when asked to', () => {
		let disabledValue = (button: ButtonPlayground) =>
			described(button).find(([type]) => type === 'disabled')?.[1]

		expect(disabledValue({...DEFAULT_BUTTON, disabled: true})).toEqual({disabled: true})
		expect(disabledValue({...DEFAULT_BUTTON, disabled: false})).toEqual({disabled: false})
	})
})
