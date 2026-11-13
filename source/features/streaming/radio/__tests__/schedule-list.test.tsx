import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'
import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {ScheduleList} from '../player-view/schedule-list'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))

const KSTO = STATIONS.ksto
const noop = () => undefined

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

		await render(<ScheduleList onPressShow={noop} station={KSTO} status="ready" upcoming={shows} />)

		expect(screen.getByTestId('radio-schedule-list')).toBeTruthy()
		expect(screen.getByText('Show 0')).toBeTruthy()
	})

	test('says why there is nothing to list instead', async () => {
		await render(<ScheduleList onPressShow={noop} station={KSTO} status="ready" upcoming={[]} />)

		expect(screen.getByText('Nothing else today')).toBeTruthy()
		expect(screen.queryByTestId('radio-schedule-list')).toBeNull()
	})

	test("tapping a show's bell follows it, and tapping it again unfollows it", async () => {
		useRadioStore.setState({followedShows: [], reminderPermission: 'granted'})
		jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({
			granted: true,
			canAskAgain: true,
			expires: 'never',
			status: Notifications.PermissionStatus.GRANTED,
		})
		await render(
			<ScheduleList
				onPressShow={noop}
				station={KSTO}
				status="ready"
				upcoming={[show('Cafecito Hour', 21)]}
			/>,
		)

		await fireEvent.press(screen.getByLabelText('Remind me about Cafecito Hour'))
		expect(useRadioStore.getState().followedShows).toStrictEqual([
			{stationId: 'ksto', title: 'Cafecito Hour'},
		])

		await fireEvent.press(
			await waitFor(() => screen.getByLabelText('Stop reminding me about Cafecito Hour')),
		)
		expect(useRadioStore.getState().followedShows).toStrictEqual([])
	})

	test('a followed show whose reminders cannot arrive still offers to remind, and stays followed', async () => {
		useRadioStore.setState({
			followedShows: [{stationId: 'ksto', title: 'Cafecito Hour'}],
			reminderPermission: 'denied',
		})
		await render(
			<ScheduleList
				onPressShow={noop}
				station={KSTO}
				status="ready"
				upcoming={[show('Cafecito Hour', 21)]}
			/>,
		)

		await fireEvent.press(screen.getByLabelText('Remind me about Cafecito Hour'))
		expect(useRadioStore.getState().followedShows).toStrictEqual([
			{stationId: 'ksto', title: 'Cafecito Hour'},
		])
	})

	test('offers the full schedule below the list and in place of it', async () => {
		useRadioStore.setState({fullScheduleOpen: false})
		await render(<ScheduleList onPressShow={noop} station={KSTO} status="ready" upcoming={[]} />)

		await fireEvent.press(screen.getByText('See full schedule'))
		expect(useRadioStore.getState().fullScheduleOpen).toBe(true)
	})
})
