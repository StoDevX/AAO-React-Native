import {describe, expect, test} from '@jest/globals'
import {selectedOptions} from '../selected-options'

const OPTIONS = [{title: 'Athletics'}, {title: 'Music'}, {title: 'Theater'}]

describe('selectedOptions', () => {
	test('shows everything when the user has picked nothing', () => {
		expect(selectedOptions(OPTIONS, null)).toEqual(OPTIONS)
	})

	test('narrows to the titles the user picked', () => {
		expect(selectedOptions(OPTIONS, ['Music'])).toEqual([{title: 'Music'}])
	})

	// An empty pick is the user turning every category off, which is not the
	// same as never having touched the filter.
	test('shows nothing when the user has cleared every title', () => {
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
