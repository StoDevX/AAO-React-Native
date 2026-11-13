import {describe, expect, test} from '@jest/globals'

import * as ios from '../platform'
import * as android from '../platform.android'

/** The names a `PlatformColor` was given, as React Native's iOS Jest setup records them. */
function namesOf(color: unknown): unknown {
	return (color as {semantic?: unknown}).semantic
}

describe('platform.android', () => {
	// Metro picks platform.android.ts on Android in place of platform.ts, so a
	// name missing here is undefined there, wherever a screen reads it.
	test('exports every colour platform.ts does, and no others', () => {
		expect(Object.keys(android).sort()).toEqual(Object.keys(ios).sort())
	})

	// An iOS name such as 'label' resolves to nothing on Android, and a view
	// given it fails when React Native converts its props. Every Android
	// colour must be a theme attribute or a resource.
	test.each(Object.entries(android).filter(([, color]) => namesOf(color) !== undefined))(
		'%s names an Android theme attribute or resource',
		(_name, color) => {
			let names = namesOf(color)
			expect(Array.isArray(names)).toBe(true)
			for (let path of names as unknown[]) {
				expect(path).toMatch(/^(\?attr\/color[A-Z]\w+|@color\/\w+|@android:color\/\w+)$/u)
			}
		},
	)
})
