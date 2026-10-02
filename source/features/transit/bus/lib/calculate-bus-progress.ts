import type {Moment} from 'moment-timezone'

/**
 * Calculates how far along the bus is between two stops, as a fraction
 * from 0 (still at previousStopDeparture) to 1 (arrived at nextStopArrival).
 */
export function calculateBusProgress(
	previousStopDeparture: Moment,
	nextStopArrival: Moment,
	now: Moment,
): number {
	let totalDuration = nextStopArrival.diff(previousStopDeparture)
	let elapsed = now.diff(previousStopDeparture)

	if (totalDuration === 0) {
		return 0
	}

	let progress = elapsed / totalDuration
	return Math.max(0, Math.min(1, progress))
}
