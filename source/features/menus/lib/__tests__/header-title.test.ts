import {describe, expect, test} from '@jest/globals'

import {spokenTime, subtitle} from '../header-title'

describe('subtitle', () => {
	test('joins the day, the meal and the window', () => {
		expect(subtitle('Sun', 'Lunch', '11AM – 1:30PM')).toBe('Sun • Lunch • 11AM – 1:30PM')
	})

	// The Carleton chooser has no day and no meal; a cafe whose menu carries
	// no hours has no window.
	test('leaves out the parts a screen does not have', () => {
		expect(subtitle('Sun', null, null)).toBe('Sun')
		expect(subtitle(null, null, null)).toBe('')
	})
})

describe('spokenTime', () => {
	// Read aloud, the dash is either silence or the word "dash". Replacing the
	// spaces around it as well as the dash itself keeps the words apart by one
	// space rather than three.
	test('reads the dash as the word between two times', () => {
		expect(spokenTime('11AM – 1:30PM')).toBe('11AM to 1:30PM')
	})

	test('leaves a window it cannot find a dash in alone', () => {
		expect(spokenTime('11AM')).toBe('11AM')
	})
})
