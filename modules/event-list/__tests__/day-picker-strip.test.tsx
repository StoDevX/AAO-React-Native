import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react-native'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'

import {DayPickerStrip, deriveDays} from '../day-picker-strip'
import type {SourcedEvent} from '../types'

const NOW = moment('2026-08-23T12:00:00Z')

describe('deriveDays', () => {
	test('returns empty array when events is empty', () => {
		let result = deriveDays([], NOW)
		expect(result).toEqual([])
	})

	test('returns today when only today has events', () => {
		let events = [
			{
				sourceId: 'a',
				key: 'k',
				event: {startTime: moment('2026-08-23T14:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(1)
		expect(result[0].isSame(NOW, 'day')).toBe(true)
	})

	test('returns days in order starting from today', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-25T10:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '3',
				event: {startTime: moment('2026-08-24T10:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(3)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
		expect(result[1].format('YYYY-MM-DD')).toBe('2026-08-24')
		expect(result[2].format('YYYY-MM-DD')).toBe('2026-08-25')
	})

	test('excludes days before today', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-22T10:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(1)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
	})

	test('excludes ongoing events from day derivation', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-20T10:00:00Z'), isOngoing: true},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(1)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
	})

	test('deduplicates days with multiple events', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-23T09:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-23T14:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(1)
	})

	test('fills in gap days between events', () => {
		let events = [
			{
				sourceId: 'a',
				key: '1',
				event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false},
			},
			{
				sourceId: 'a',
				key: '2',
				event: {startTime: moment('2026-08-26T10:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as unknown as SourcedEvent[], NOW)
		expect(result).toHaveLength(4)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
		expect(result[1].format('YYYY-MM-DD')).toBe('2026-08-24')
		expect(result[2].format('YYYY-MM-DD')).toBe('2026-08-25')
		expect(result[3].format('YYYY-MM-DD')).toBe('2026-08-26')
	})
})

describe('DayPickerStrip', () => {
	test('renders a cell for each day', async () => {
		let days = [
			moment('2026-08-23T12:00:00Z'),
			moment('2026-08-24T12:00:00Z'),
			moment('2026-08-25T12:00:00Z'),
		]

		await render(
			<DayPickerStrip days={days} now={NOW} onSelectDay={jest.fn()} selectedDay={days[0]} />,
		)

		expect(screen.getByText('23')).toBeTruthy()
		expect(screen.getByText('24')).toBeTruthy()
		expect(screen.getByText('25')).toBeTruthy()
	})

	test('renders single-letter weekday above date', async () => {
		let days = [moment('2026-08-23T12:00:00Z')] // Sunday

		await render(
			<DayPickerStrip days={days} now={NOW} onSelectDay={jest.fn()} selectedDay={days[0]} />,
		)

		expect(screen.getByText('S')).toBeTruthy()
		expect(screen.getByText('23')).toBeTruthy()
	})

	test('calls onSelectDay when a day is tapped', async () => {
		let days = [moment('2026-08-23T12:00:00Z'), moment('2026-08-24T12:00:00Z')]
		let onSelectDay = jest.fn()

		await render(
			<DayPickerStrip days={days} now={NOW} onSelectDay={onSelectDay} selectedDay={days[0]} />,
		)

		fireEvent.press(screen.getByText('24'))

		expect(onSelectDay).toHaveBeenCalledTimes(1)
		let selectedDay = onSelectDay.mock.calls[0][0] as moment.Moment
		expect(selectedDay.format('YYYY-MM-DD')).toBe('2026-08-24')
	})

	test('renders nothing when days is empty', async () => {
		let result = await render(
			<DayPickerStrip days={[]} now={NOW} onSelectDay={jest.fn()} selectedDay={null} />,
		)

		expect(result.toJSON()).toBeNull()
	})
})
