import {describe, expect, test} from '@jest/globals'

import * as gradients from '../gradients'
import {FALLBACK_GRADIENT, GRADIENT_NAMES, resolveGradient} from '../resolve-gradient'

const INLINE: [string, string] = [
	'color(display-p3 0.9294 0.4863 0.5216)',
	'color(display-p3 0.902 0.3882 0.4118)',
]

const camelize = (name: string): string => name.replace(/-(.)/gu, (_, c: string) => c.toUpperCase())

describe('resolveGradient', () => {
	test('resolves a name to the gradient it is named after', () => {
		expect(resolveGradient('red')).toEqual(gradients.redGradient)
	})

	// The names live here and the gradients live in gradients.ts, so the two
	// can drift: a name can survive review and still resolve to nothing.
	test('every advertised name matches an exported gradient', () => {
		for (let name of GRADIENT_NAMES) {
			let exported = (gradients as Record<string, unknown>)[`${camelize(name)}Gradient`]
			expect(exported).toBeDefined()
			expect(resolveGradient(name)).toEqual(exported)
		}
	})

	test('advertises every gradient the module exports', () => {
		let exported = Object.keys(gradients).filter((key) => key.endsWith('Gradient'))
		expect(GRADIENT_NAMES).toHaveLength(exported.length)
	})

	test('passes an explicit pair through', () => {
		expect(resolveGradient(INLINE)).toEqual(INLINE)
	})

	test.each([
		['an unknown name', 'chartreuse'],
		['a one-colour array', ['color(display-p3 1 1 1)']],
		['a three-colour array', [...INLINE, 'color(display-p3 1 1 1)']],
		['a pair that is not strings', [1, 2]],
		['nothing at all', undefined],
		['an object', {inner: 'red'}],
	])('falls back on %s', (_label, value) => {
		expect(resolveGradient(value)).toEqual(FALLBACK_GRADIENT)
	})
})
