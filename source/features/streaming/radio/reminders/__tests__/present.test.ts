import {describe, expect, test} from '@jest/globals'

import {reminderStation, shouldPresentReminder} from '../present'

const KSTO_REMINDER = {stationId: 'ksto', title: 'Cafecito Hour'}

describe('shouldPresentReminder', () => {
	test('hides a reminder for the station playing now', () => {
		expect(shouldPresentReminder(KSTO_REMINDER, {stationId: 'ksto', playState: 'playing'})).toBe(
			false,
		)
	})

	test('hides a reminder for the station starting now', () => {
		expect(shouldPresentReminder(KSTO_REMINDER, {stationId: 'ksto', playState: 'starting'})).toBe(
			false,
		)
	})

	test('shows a reminder for another station', () => {
		expect(shouldPresentReminder(KSTO_REMINDER, {stationId: 'krlx', playState: 'playing'})).toBe(
			true,
		)
	})

	test('shows a reminder when its station is paused', () => {
		expect(shouldPresentReminder(KSTO_REMINDER, {stationId: 'ksto', playState: 'paused'})).toBe(
			true,
		)
	})

	test('shows notifications that are not reminders', () => {
		expect(shouldPresentReminder({}, {stationId: 'ksto', playState: 'playing'})).toBe(true)
	})
})

describe('reminderStation', () => {
	test("is the reminder's station", () => {
		expect(reminderStation({stationId: 'krlx', title: 'Static'})).toBe('krlx')
	})

	test('is null for a station the app does not have', () => {
		expect(reminderStation({stationId: 'nope'})).toBeNull()
	})

	test('is null for a notification without data', () => {
		expect(reminderStation(undefined)).toBeNull()
	})
})
