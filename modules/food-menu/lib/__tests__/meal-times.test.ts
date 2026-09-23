import {describe, expect, test} from '@jest/globals'

import {formatMealTimes, mealWindow} from '../meal-times'

describe('formatMealTimes', () => {
	test('reads the padded hour BonApp publishes', () => {
		expect(formatMealTimes({starttime: '07:15', endtime: '09:45'}, 'en-US')).toBe('7:15AM – 9:45AM')
	})

	// Our own fallback menus write the hour unpadded, and strict parsing
	// accepts a format only for the spelling it names.
	test('reads the unpadded hour our own menus publish', () => {
		expect(formatMealTimes({starttime: '7:15', endtime: '9:45'}, 'en-US')).toBe('7:15AM – 9:45AM')
	})

	test('drops :00 on the hour, as every other time in the app does', () => {
		expect(formatMealTimes({starttime: '16:30', endtime: '20:00'}, 'en-US')).toBe('4:30PM – 8PM')
	})

	// Stav's day runs from breakfast to dinner, so both halves are named.
	test('names both halves of the day when the window crosses noon', () => {
		expect(formatMealTimes({starttime: '10:30', endtime: '14:00'}, 'en-US')).toBe('10:30AM – 2PM')
	})

	test('follows the locale onto a 24-hour clock', () => {
		expect(formatMealTimes({starttime: '16:30', endtime: '20:00'}, 'en-GB')).toBe('16:30 – 20:00')
	})

	// `DEFAULT_MENU` in menu-bonapp.tsx stands a whole day up in place of the
	// dayparts BonApp did not publish. That is our own invention, not a window
	// anyone is served in, so it is not a window to print.
	test('says nothing about a cafe whose menu spans the whole day', () => {
		expect(formatMealTimes({starttime: '0:00', endtime: '23:59'}, 'en-US')).toBeNull()
	})

	// BonApp writes the same span its own way, which is how Weitz published a
	// closed Sunday. Read on a clock two hours behind campus both ends land on
	// the same reading -- `10PM – 10PM` -- so a whole day has to be recognised
	// by what it covers rather than by how it is spelled.
	test("says nothing about a whole day spelled BonApp's way", () => {
		expect(formatMealTimes({starttime: '00:00', endtime: '24:00'}, 'en-US')).toBeNull()
	})

	// A window nobody could be served in is not a window either.
	test('says nothing about a window with no duration', () => {
		expect(formatMealTimes({starttime: '14:00', endtime: '14:00'}, 'en-US')).toBeNull()
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
		expect(formatMealTimes({starttime: '21:00', endtime: '1:00'}, 'en-US')).toBe('9PM – 1AM')
	})
})

describe('mealWindow', () => {
	// The day the clocks go forward is 23 hours long, so a whole day measured in
	// elapsed minutes falls short of one. It is still the whole day on the
	// campus clock, which is what BonApp writes for a cafe that is shut.
	test('says nothing about a whole day on the day the clocks go forward', () => {
		expect(mealWindow({starttime: '00:00', endtime: '24:00'}, '2027-03-14')).toBeNull()
		expect(mealWindow({starttime: '0:00', endtime: '23:59'}, '2027-03-14')).toBeNull()
	})

	// The day the clocks go back is 25 hours long, so a window short of the
	// whole day on the campus clock runs longer than a day in elapsed minutes.
	test('keeps a real window on the day the clocks go back', () => {
		let window = mealWindow({starttime: '00:00', endtime: '23:30'}, '2026-11-01')
		expect(window?.start.format('YYYY-MM-DD HH:mm')).toBe('2026-11-01 00:00')
		expect(window?.end.format('YYYY-MM-DD HH:mm')).toBe('2026-11-01 23:30')
	})

	test('closes a window that crosses midnight the following day', () => {
		let window = mealWindow({starttime: '22:00', endtime: '01:00'}, '2026-09-22')
		expect(window?.end.format('YYYY-MM-DD HH:mm')).toBe('2026-09-23 01:00')
	})
})
