import {STATIONS, type StationId} from '../stations'
import type {RadioPlayState} from '../types'

/** The reminder's Listen button, which opens the player on its station and plays it. */
export const LISTEN_ACTION = 'listen'

/** The station a reminder's `data` names, or null when it names none the app has. */
export function reminderStation(data: unknown): StationId | null {
	if (typeof data !== 'object' || data === null || !('stationId' in data)) {
		return null
	}
	let {stationId} = data
	return typeof stationId === 'string' && stationId in STATIONS ? (stationId as StationId) : null
}

/**
 * Whether a notification arriving while the app is open is shown. A reminder
 * for the station already starting or playing is not: the person is listening.
 */
export function shouldPresentReminder(
	data: unknown,
	radio: {stationId: StationId | null; playState: RadioPlayState},
): boolean {
	let stationId = reminderStation(data)
	let listening = radio.playState === 'starting' || radio.playState === 'playing'
	return stationId === null || stationId !== radio.stationId || !listening
}

/**
 * What a response to a reminder asks for: its station's player, playing when
 * Listen was pressed. Null when the notification is not a reminder.
 */
export function reminderResponse(
	data: unknown,
	actionIdentifier: string,
): {stationId: StationId; listen: boolean} | null {
	let stationId = reminderStation(data)
	return stationId === null ? null : {stationId, listen: actionIdentifier === LISTEN_ACTION}
}
