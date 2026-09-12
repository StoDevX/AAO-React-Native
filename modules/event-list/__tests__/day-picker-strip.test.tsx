import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react-native'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'

import {DayPickerStrip} from '../day-picker-strip'

// A Sunday, so "this week" runs 2026-08-23 (Sun) through 2026-08-29 (Sat).
const NOW = moment('2026-08-23T12:00:00Z')

describe('DayPickerStrip', () => {
	test('renders a cell for each day', async () => {
		let days = [
			moment('2026-08-23T12:00:00Z'),
			moment('2026-08-24T12:00:00Z'),
			moment('2026-08-25T12:00:00Z'),
		]

		await render(
			<DayPickerStrip
				days={days}
				daysWithEvents={new Set()}
				now={NOW}
				onSelectDay={jest.fn()}
				selectedDay={days[0]}
			/>,
		)

		expect(screen.getByText('23')).toBeTruthy()
		expect(screen.getByText('24')).toBeTruthy()
		expect(screen.getByText('25')).toBeTruthy()
	})

	test('renders single-letter weekday above date', async () => {
		let days = [moment('2026-08-23T12:00:00Z')] // Sunday

		await render(
			<DayPickerStrip
				days={days}
				daysWithEvents={new Set()}
				now={NOW}
				onSelectDay={jest.fn()}
				selectedDay={days[0]}
			/>,
		)

		expect(screen.getByText('S')).toBeTruthy()
		expect(screen.getByText('23')).toBeTruthy()
	})

	test('calls onSelectDay when a day is tapped', async () => {
		let days = [moment('2026-08-23T12:00:00Z'), moment('2026-08-24T12:00:00Z')]
		let onSelectDay = jest.fn()

		await render(
			<DayPickerStrip
				days={days}
				daysWithEvents={new Set()}
				now={NOW}
				onSelectDay={onSelectDay}
				selectedDay={days[0]}
			/>,
		)

		fireEvent.press(screen.getByText('24'))

		expect(onSelectDay).toHaveBeenCalledTimes(1)
		let selectedDay = onSelectDay.mock.calls[0][0] as moment.Moment
		expect(selectedDay.format('YYYY-MM-DD')).toBe('2026-08-24')
	})

	test('renders nothing when days is empty', async () => {
		let result = await render(
			<DayPickerStrip
				days={[]}
				daysWithEvents={new Set()}
				now={NOW}
				onSelectDay={jest.fn()}
				selectedDay={null}
			/>,
		)

		expect(result.toJSON()).toBeNull()
	})

	test('marks a day that has events', async () => {
		let days = [moment('2026-08-23T12:00:00Z'), moment('2026-08-24T12:00:00Z')]

		await render(
			<DayPickerStrip
				days={days}
				daysWithEvents={new Set(['2026-08-24'])}
				now={NOW}
				onSelectDay={jest.fn()}
				selectedDay={days[0]}
			/>,
		)

		expect(screen.getByTestId('day-dot-2026-08-24')).toBeTruthy()
		expect(screen.queryByTestId('day-dot-2026-08-23')).toBeNull()
	})
})
