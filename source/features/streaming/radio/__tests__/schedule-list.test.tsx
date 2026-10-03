import * as React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {ScheduleList} from '../player-view/schedule-list'

function show(title: string, hour: number): EventType {
	return {
		title,
		description: '',
		location: '',
		startTime: moment.tz(`2026-10-03T${String(hour).padStart(2, '0')}:00`, 'America/Chicago'),
		endTime: moment.tz(`2026-10-03T${String(hour + 1).padStart(2, '0')}:00`, 'America/Chicago'),
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'description'},
	}
}

describe('ScheduleList', () => {
	test('lists the shows still to come, in a list that scrolls', async () => {
		let shows = Array.from({length: 20}, (_, i) => show(`Show ${i}`, i + 2))

		await render(<ScheduleList status="ready" upcoming={shows} />)

		expect(screen.getByTestId('radio-schedule-list')).toBeTruthy()
		expect(screen.getByText('Show 0')).toBeTruthy()
	})

	test('says why there is nothing to list instead', async () => {
		await render(<ScheduleList status="ready" upcoming={[]} />)

		expect(screen.getByText('Nothing else today')).toBeTruthy()
		expect(screen.queryByTestId('radio-schedule-list')).toBeNull()
	})
})
