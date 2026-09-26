import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'

import {statusWindow} from '../status-window'
import type {NamedBuildingScheduleType, SingleBuildingScheduleType} from '../../types'

const timezone = 'America/Chicago'

// 2026-09-07 is a Monday.
function at(time: string) {
	return moment.tz(`2026-09-07 ${time}`, timezone)
}

const breakfast: SingleBuildingScheduleType = {days: ['Mo'], from: '7:15am', to: '9:45am'}
const lunch: SingleBuildingScheduleType = {days: ['Mo'], from: '10:30am', to: '2:00pm'}
const dinner: SingleBuildingScheduleType = {days: ['Mo'], from: '4:30pm', to: '8:00pm'}

const stav: Array<NamedBuildingScheduleType> = [
	{title: 'Breakfast', hours: [breakfast]},
	{title: 'Lunch', hours: [lunch]},
	{title: 'Dinner', hours: [dinner]},
]

describe('statusWindow', () => {
	test('is the window running now', () => {
		expect(statusWindow(stav, at('08:00'))).toBe(breakfast)
	})

	test('is the next window to open today when nothing is running', () => {
		expect(statusWindow(stav, at('15:00'))).toBe(dinner)
	})

	test("is today's first window before anything opens", () => {
		expect(statusWindow(stav, at('06:00'))).toBe(breakfast)
	})

	test("is today's last window once everything has closed", () => {
		expect(statusWindow(stav, at('21:00'))).toBe(dinner)
	})

	test('picks the earliest of the windows still to come, whatever order they are written in', () => {
		let reversed = [...stav].reverse()
		expect(statusWindow(reversed, at('09:50'))).toBe(lunch)
	})

	// A window's days name the day it opens, so after midnight the window
	// still running is the one that opened yesterday.
	test('is the late window still running after midnight', () => {
		let late: SingleBuildingScheduleType = {days: ['Su'], from: '7:00am', to: '1:00am'}
		let early: SingleBuildingScheduleType = {days: ['Mo'], from: '7:00am', to: '12:00am'}
		let blocks = [{title: 'Hours', hours: [early, late]}]
		expect(statusWindow(blocks, at('00:30'))).toBe(late)
	})

	test('reads empty days as every day, as findOpenWindow does', () => {
		let always: SingleBuildingScheduleType = {days: [], from: '9:00am', to: '5:00pm'}
		expect(statusWindow([{title: 'Hours', hours: [always]}], at('07:00'))).toBe(always)
	})

	test('is nothing when no window opens today', () => {
		let tuesday: SingleBuildingScheduleType = {days: ['Tu'], from: '9:00am', to: '5:00pm'}
		expect(statusWindow([{title: 'Hours', hours: [tuesday]}], at('12:00'))).toBeNull()
	})
})
