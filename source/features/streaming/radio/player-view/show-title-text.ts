import type {EventType} from '@frogpond/event-type'
import {formatCompactTimeRange} from '@frogpond/time-format'

import type {Station} from '../stations'
import type {ScheduleStatus} from './schedule-note'

/**
 * The title block's two lines: the show on air, else the station off air.
 * Until the schedule has loaded it cannot say which, so it names the station
 * and claims nothing.
 */
export function showTitleText(
	station: Station,
	current: EventType | null,
	status: ScheduleStatus,
): {title: string; subtitle: string} {
	if (!current) {
		return {title: station.stationName, subtitle: status === 'ready' ? 'Off Air' : ''}
	}
	return {
		title: current.title,
		subtitle: `${station.stationName} · ${formatCompactTimeRange(current.startTime, current.endTime)}`,
	}
}

/**
 * The line under the title where Music has a scrubber, which a stream has no
 * use for: ON AIR or OFF AIR by the schedule, LOADING until it has loaded, and
 * nothing if it could not, as it cannot say which.
 */
export function airStatusText(
	current: EventType | null,
	status: ScheduleStatus,
): {text: string; spoken: string} {
	switch (status) {
		case 'loading':
			return {text: 'LOADING', spoken: 'Loading'}
		case 'error':
			return {text: '', spoken: 'Air status unavailable'}
		default:
			return current ? {text: 'ON AIR', spoken: 'On air'} : {text: 'OFF AIR', spoken: 'Off air'}
	}
}
