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
