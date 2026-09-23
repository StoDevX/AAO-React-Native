import {describe, expect, test} from '@jest/globals'

import {menuSubtitle, spokenTime} from '../header-title'

const SUNDAY = {weekdayShort: 'Sun', weekdayLong: 'Sunday', closed: false, reopening: null}

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
				closed: false,
				reopening: null,
			}),
		).toBe('11AM – 1PM')
		expect(
			menuSubtitle({
				weekdayShort: null,
				weekdayLong: null,
				cafeName: 'Carleton',
				mealName: null,
				time: null,
				closed: false,
				reopening: null,
			}),
		).toBe('')
	})

	// Carleton's Weitz Center serves a daypart called `Weitz Café`, which is the
	// building again rather than a meal. It adds nothing the title above it does
	// not already say, so it goes the way `The Cage` does.
	test('drops a meal that only repeats what the cafe is called', () => {
		expect(
			menuSubtitle({
				...SUNDAY,
				cafeName: 'Weitz Center',
				mealName: 'Weitz Café',
				time: '7:30AM – 3PM',
			}),
		).toBe('Sunday • 7:30AM – 3PM')
	})

	// The same cafe's other daypart. A meal keeps its name as long as it carries
	// a word of its own, so matching a *part* of the cafe's name is not enough.
	test('keeps a meal that carries a word the cafe does not', () => {
		expect(
			menuSubtitle({
				...SUNDAY,
				cafeName: 'Weitz Center',
				mealName: 'Weitz Lunch',
				time: '11AM – 3PM',
			}),
		).toBe('Sun • Weitz Lunch • 11AM – 3PM')
	})

	// `The` is the whole of what these two share, and an article is not a name.
	test('does not confuse two cafes that share an article', () => {
		expect(
			menuSubtitle({...SUNDAY, cafeName: 'The Pause', mealName: 'The Cage', time: '7:30AM – 8PM'}),
		).toBe('Sun • The Cage • 7:30AM – 8PM')
	})

	// `every` over no words is true, so a meal whose whole name is place words
	// would be dropped against any cafe at all -- `Kitchen` under `Stav Hall`.
	test('keeps a meal of place words the cafe never says', () => {
		expect(
			menuSubtitle({...SUNDAY, cafeName: 'Stav Hall', mealName: 'Kitchen', time: '8AM – 10AM'}),
		).toBe('Sun • Kitchen • 8AM – 10AM')
	})

	test('drops a meal of place words the cafe does say', () => {
		expect(
			menuSubtitle({...SUNDAY, cafeName: 'Weitz Café', mealName: 'Café', time: '8AM – 10AM'}),
		).toBe('Sunday • 8AM – 10AM')
	})

	// Nothing under the name is true of a cafe that is shut with nothing to
	// promise about opening again -- not the meal, not a window, not even the
	// day it is shut on -- so the name stands alone. The meal is the one of
	// those that arrives from the picker rather than from the screen, and so the
	// one a caller is liable to leave in.
	test('says nothing at all about a shut cafe with nothing to promise', () => {
		expect(
			menuSubtitle({
				...SUNDAY,
				cafeName: 'Stav Hall',
				mealName: 'Lunch',
				time: '11AM – 1:30PM',
				closed: true,
				reopening: null,
			}),
		).toBe('')
	})

	// A shut cafe with something to say about opening again says it beside the
	// day it is shut on. The meal and its window stay out: neither is being
	// served.
	test('says when a shut cafe opens again', () => {
		expect(
			menuSubtitle({
				...SUNDAY,
				cafeName: 'The Pause Kitchen',
				mealName: 'Menu',
				time: null,
				closed: true,
				reopening: 'Opens at 4 PM',
			}),
		).toBe('Sunday • Opens at 4 PM')
	})

	// An accent is not a different word: BonApp is not consistent about
	// writing one, and `Café` under `Weitz Cafe` still says the name twice.
	test('reads a word the same with or without its accent', () => {
		expect(
			menuSubtitle({...SUNDAY, cafeName: 'Weitz Cafe', mealName: 'Café', time: '8AM – 10AM'}),
		).toBe('Sunday • 8AM – 10AM')
		expect(
			menuSubtitle({...SUNDAY, cafeName: 'Crêpe Corner', mealName: 'Crepe', time: '8AM – 10AM'}),
		).toBe('Sunday • 8AM – 10AM')
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
