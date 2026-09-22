import {describe, expect, test} from '@jest/globals'

import {menuSubtitle, spokenTime} from '../header-title'

const SUNDAY = {weekdayShort: 'Sun', weekdayLong: 'Sunday'}

describe('menuSubtitle', () => {
	test('joins the day, the meal and the window', () => {
		expect(
			menuSubtitle({
				...SUNDAY,
				cafeName: 'Stav Hall',
				mealName: 'Dinner',
				time: '2:30PM – 6PM',
			}),
		).toBe('Sun • Dinner • 2:30PM – 6PM')
	})

	// BonApp names The Cage's only daypart after the cafe, so naming the meal
	// would say the cafe's name twice over.
	test('drops a meal named after the cafe serving it', () => {
		expect(
			menuSubtitle({
				...SUNDAY,
				cafeName: 'The Cage',
				mealName: 'The Cage',
				time: '7:30AM – 8PM',
			}),
		).toBe('Sunday • 7:30AM – 8PM')
	})

	test('matches the cafe name past its casing and its spacing', () => {
		expect(
			menuSubtitle({
				...SUNDAY,
				cafeName: 'The Cage',
				mealName: '  the cage ',
				time: '7:30AM – 8PM',
			}),
		).toBe('Sunday • 7:30AM – 8PM')
	})

	// A line carrying a meal is already tight; a line without one has the room,
	// and an abbreviation alone out there reads as a truncation.
	test('spells the day out when no meal is named', () => {
		expect(
			menuSubtitle({...SUNDAY, cafeName: 'The Cage', mealName: null, time: '7:30AM – 8PM'}),
		).toBe('Sunday • 7:30AM – 8PM')
	})

	// The Carleton chooser has no day and no meal; the Pause's menu is a file we
	// keep rather than a day's service, so it publishes no day at all.
	test('leaves out the parts a screen does not have', () => {
		expect(
			menuSubtitle({
				weekdayShort: null,
				weekdayLong: null,
				cafeName: 'The Pause',
				mealName: null,
				time: '11AM – 1PM',
			}),
		).toBe('11AM – 1PM')
		expect(
			menuSubtitle({
				weekdayShort: null,
				weekdayLong: null,
				cafeName: 'Carleton',
				mealName: null,
				time: null,
			}),
		).toBe('')
	})

	test('names a meal that is not the cafe over again', () => {
		expect(
			menuSubtitle({...SUNDAY, cafeName: 'The Cage', mealName: 'Breakfast', time: '9AM – 10:30AM'}),
		).toBe('Sun • Breakfast • 9AM – 10:30AM')
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
