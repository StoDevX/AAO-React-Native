import {STATIONS, type StationId} from './stations'

/** A station the player credits, and where its site is. */
export type RadioCredit = {label: string; url: string}

const ORDER: StationId[] = ['ksto', 'krlx']

/** One credit per station, in the order the station picker lists them. */
export function radioCredits(): Array<RadioCredit> {
	return ORDER.map((id) => ({label: STATIONS[id].stationName, url: STATIONS[id].websiteUrl}))
}
