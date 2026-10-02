import type {EventType} from '@frogpond/event-type'
import {formatCompactTimeRange} from '@frogpond/time-format'

import type {Station} from '../stations'

/** The title block's two lines: the show on air, else the station off air. */
export function showTitleText(
	station: Station,
	current: EventType | null,
): {title: string; subtitle: string} {
	if (!current) {
		return {title: station.stationName, subtitle: 'Off Air'}
	}
	return {
		title: current.title,
		subtitle: `${station.stationName} · ${formatCompactTimeRange(current.startTime, current.endTime)}`,
	}
}
