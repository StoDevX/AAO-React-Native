import {describe, expect, test} from '@jest/globals'

import {formatMealTimes} from '../meal-times'

describe('formatMealTimes', () => {
	test('reads the padded hour BonApp publishes', () => {
		expect(formatMealTimes({starttime: '07:15', endtime: '09:45'}, 'en-US')).toBe('7:15AM–9:45AM')
	})

	// Our own fallback menus write the hour unpadded, and strict parsing
	// accepts a format only for the spelling it names.
	test('reads the unpadded hour our own menus publish', () => {
		expect(formatMealTimes({starttime: '7:15', endtime: '9:45'}, 'en-US')).toBe('7:15AM–9:45AM')
	})

	test('drops :00 on the hour, as every other time in the app does', () => {
		expect(formatMealTimes({starttime: '16:30', endtime: '20:00'}, 'en-US')).toBe('4:30PM–8PM')
	})

	test('follows the locale onto a 24-hour clock', () => {
		expect(formatMealTimes({starttime: '16:30', endtime: '20:00'}, 'en-GB')).toBe('16:30–20:00')
	})

	// `DEFAULT_MENU` in menu-bonapp.tsx stands a whole day up in place of the
	// dayparts BonApp did not publish. That is our own invention, not a window
	// anyone is served in, so it is not a window to print.
	test('says nothing about a cafe whose menu spans the whole day', () => {
		expect(formatMealTimes({starttime: '0:00', endtime: '23:59'}, 'en-US')).toBeNull()
	})

	test('says nothing when a time is missing', () => {
		expect(formatMealTimes({starttime: '', endtime: '09:45'}, 'en-US')).toBeNull()
	})

	test('says nothing when a time is not a time', () => {
		expect(formatMealTimes({starttime: 'noon', endtime: '09:45'}, 'en-US')).toBeNull()
	})

	// Sayles' Late Night ends after midnight. The window is printed as it
	// stands; it is the reader's evening either way.
	test('prints a window that crosses midnight', () => {
		expect(formatMealTimes({starttime: '21:00', endtime: '1:00'}, 'en-US')).toBe('9PM–1AM')
	})
})
