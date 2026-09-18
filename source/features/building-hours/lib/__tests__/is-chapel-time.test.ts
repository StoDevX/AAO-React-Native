import {describe, expect, it} from '@jest/globals'
import {findChapelWindow, findNextChapelWindow, isChapelTime} from '../chapel'
import {dayMoment, plainMoment} from './moment.helper'

// 2026-09-07 is a Monday; chapel runs 10:10-10:30am.
let at = (date: string, time: string) => plainMoment(`${date}T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

it('checks if a moment is during chapel time', () => {
	let m = isChapelTime(dayMoment('Mon 10:10am'))
	expect(m).toBe(true)
})

it('returns false if there is no chapel that day', () => {
	let m = isChapelTime(dayMoment('Sat 10:10am'))
	expect(m).toBe(false)
})

it('returns false if chapel is over', () => {
	let m = isChapelTime(dayMoment('Fri 1:00pm'))
	expect(m).toBe(false)
})

describe('findChapelWindow', () => {
	it('returns the window running right now', () => {
		let window = findChapelWindow(at('2026-09-07', '10:15:00'))

		expect(window?.open.format('HH:mm')).toBe('10:10')
		expect(window?.close.format('HH:mm')).toBe('10:30')
	})

	it('returns null outside chapel', () => {
		expect(findChapelWindow(at('2026-09-07', '10:35:00'))).toBeNull()
	})

	it('returns null on a day with no chapel', () => {
		// 2026-09-12 is a Saturday.
		expect(findChapelWindow(at('2026-09-12', '10:15:00'))).toBeNull()
	})
})

describe('findNextChapelWindow', () => {
	it("returns today's window before chapel starts", () => {
		let window = findNextChapelWindow(at('2026-09-07', '10:05:00'))

		expect(window?.open.format('HH:mm')).toBe('10:10')
		expect(window?.close.format('HH:mm')).toBe('10:30')
	})

	it('returns null once chapel is running', () => {
		expect(findNextChapelWindow(at('2026-09-07', '10:15:00'))).toBeNull()
	})

	it('returns null once chapel is over', () => {
		expect(findNextChapelWindow(at('2026-09-07', '11:00:00'))).toBeNull()
	})

	it('returns null on a day with no chapel', () => {
		// 2026-09-12 is a Saturday.
		expect(findNextChapelWindow(at('2026-09-12', '09:00:00'))).toBeNull()
	})
})
