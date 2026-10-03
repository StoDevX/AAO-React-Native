import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {formatCompactTimeRange} from '@frogpond/time-format'

import {showTitleText} from '../player-view/show-title-text'
import {STATIONS} from '../stations'

const SHOW: EventType = {
	title: 'Morning Drive',
	description: '',
	location: '',
	startTime: moment.tz('2026-10-02T08:00', 'America/Chicago'),
	endTime: moment.tz('2026-10-02T10:00', 'America/Chicago'),
	isAllDay: false,
	isMultiDay: false,
	isSameInstant: false,
	isOngoing: false,
	links: [],
	categories: [],
	config: {startTime: true, endTime: true, subtitle: 'description'},
}

describe('showTitleText', () => {
	test('names the show on air, with the station and its hours below', () => {
		expect(showTitleText(STATIONS.krlx, SHOW, 'ready')).toStrictEqual({
			title: 'Morning Drive',
			subtitle: `88.1 KRLX-FM · ${formatCompactTimeRange(SHOW.startTime, SHOW.endTime)}`,
		})
	})

	test('says the station is off air when the schedule has no show on', () => {
		expect(showTitleText(STATIONS.krlx, null, 'ready')).toStrictEqual({
			title: '88.1 KRLX-FM',
			subtitle: 'Off Air',
		})
	})

	test('claims nothing about the air while the schedule loads', () => {
		expect(showTitleText(STATIONS.krlx, null, 'loading')).toStrictEqual({
			title: '88.1 KRLX-FM',
			subtitle: '',
		})
	})

	test('claims nothing about the air when the schedule could not load', () => {
		expect(showTitleText(STATIONS.krlx, null, 'error')).toStrictEqual({
			title: '88.1 KRLX-FM',
			subtitle: '',
		})
	})
})
