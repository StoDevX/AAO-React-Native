import {describe, expect, test} from '@jest/globals'
import {selectedOptions} from '../selected-options'

const OPTIONS = [{title: 'Athletics'}, {title: 'Music'}, {title: 'Theater'}]

describe('selectedOptions', () => {
	// Selecting nothing is the resting state and shows everything, so an
	// untouched filter selects no options rather than all of them.
	test('selects nothing when the user has picked nothing', () => {
		expect(selectedOptions(OPTIONS, null)).toEqual([])
	})

	test('narrows to the titles the user picked', () => {
		expect(selectedOptions(OPTIONS, ['Music'])).toEqual([{title: 'Music'}])
	})

	// Clearing every title and never having touched the filter are the same
	// state: both show everything.
	test('selects nothing when the user has cleared every title', () => {
		expect(selectedOptions(OPTIONS, [])).toEqual([])
	})

	// The feed decides what is on offer, so a title that has since gone away
	// cannot select anything -- and must not resurrect the option either.
	test('ignores picked titles the options no longer offer', () => {
		expect(selectedOptions(OPTIONS, ['Music', 'Lectures'])).toEqual([{title: 'Music'}])
	})

	test('keeps the order the options came in, not the order they were picked', () => {
		expect(selectedOptions(OPTIONS, ['Theater', 'Athletics'])).toEqual([
			{title: 'Athletics'},
			{title: 'Theater'},
		])
	})
})
