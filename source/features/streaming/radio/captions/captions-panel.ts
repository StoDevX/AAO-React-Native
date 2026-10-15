import type {Station} from '../campus-section'
import type {RadioPlayState} from '../types'

/** What takes the record's place in the sheet: the record itself, today's schedule, or the captions. */
export type Panel = 'record' | 'schedule' | 'captions'

/** Whether captions can run for the viewed station, and if not, why. */
export type CaptionsAvailability = 'available' | 'unsupported' | 'not-playing'

type StationState = {
	station: Pick<Station, 'captionsSupported'>
	/** Whether the viewed station is the one the player has loaded. */
	viewedIsPlaying: boolean
	playState: RadioPlayState
}

/**
 * Whether the Captions button can be used. A station is captioned from the
 * stream the player is playing, so one the player has not loaded, or has
 * stopped, has nothing to caption; a paused one keeps its panel.
 */
export function captionsAvailability({
	station,
	viewedIsPlaying,
	playState,
}: StationState): CaptionsAvailability {
	if (!station.captionsSupported) return 'unsupported'
	if (!viewedIsPlaying || playState === 'stopped') return 'not-playing'
	return 'available'
}

/** The Captions button's accessibility label: its name, or why it is dimmed. */
export function captionsButtonLabel(
	availability: CaptionsAvailability,
	stationName: string,
): string {
	switch (availability) {
		case 'available':
			return 'Captions'
		case 'unsupported':
			return `Captions are not available for ${stationName}`
		case 'not-playing':
			return 'Captions need the station to be playing'
		default: {
			let _exhaustive: never = availability
			throw new Error(`Unhandled captions availability: ${String(_exhaustive)}`)
		}
	}
}

/**
 * Whether the caption engine should be running: only while the captions panel
 * shows, and the station it shows is the one playing sound that can be captioned.
 */
export function shouldRunCaptions({
	active,
	...state
}: StationState & {
	/** Whether the captions panel is the one showing. */
	active: boolean
}): boolean {
	return active && captionsAvailability(state) === 'available' && state.playState === 'playing'
}

/** The panel after `pressed`'s button is pressed while `current` shows: pressing the showing panel's button returns to the record. */
export function selectPanel(current: Panel, pressed: 'schedule' | 'captions'): Panel {
	return current === pressed ? 'record' : pressed
}

/**
 * The panel to show. `chosen` is the viewer's choice since the sheet last
 * opened; without one the sheet opens on the captions the viewer left selected
 * (`captionsOn`), if they can run. A chosen captions panel that can no longer
 * run, for a station that cannot caption or one that stopped, gives way to the record.
 */
export function resolvePanel({
	chosen,
	captionsOn,
	availability,
}: {
	chosen: Panel | null
	captionsOn: boolean
	availability: CaptionsAvailability
}): Panel {
	let panel = chosen ?? (captionsOn ? 'captions' : 'record')
	return panel === 'captions' && availability !== 'available' ? 'record' : panel
}
