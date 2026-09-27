import {describe, expect, test} from '@jest/globals'
import {collapsedDetentFor} from '../sheet-detents'

describe('collapsedDetentFor', () => {
	test('holds the default header block before it has been measured', () => {
		expect(collapsedDetentFor(null)).toEqual({height: 76})
	})

	test('grows to hold a header block enlarged by the text size', () => {
		expect(collapsedDetentFor(156)).toEqual({height: 156})
	})

	// A stop a fraction short slices the field's top edge off.
	test('rounds a fractional height up', () => {
		expect(collapsedDetentFor(155.33)).toEqual({height: 156})
	})

	// A view's first geometry report can come before layout, at zero.
	test('never shrinks below the default header block', () => {
		expect(collapsedDetentFor(0)).toEqual({height: 76})
	})
})
