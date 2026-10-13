import {CAMPUSES, type CampusDefinition, type CampusId} from '../../../campuses'
import {remoteImage, type RemoteImage} from '../../../lib/remote-images'
import type {Station, StationId} from './campus-section'
import type {RadioLogo} from './theme'

export type {Station, StationId}

const campuses: ReadonlyArray<CampusDefinition> = CAMPUSES

/**
 * Every campus's stations, in the registry's order. The first is the one a
 * fresh install views first; the picker offers `stationsOffered`.
 */
export const STATION_LIST: ReadonlyArray<Station> = campuses.flatMap(
	(campus) => campus.radio?.stations ?? [],
)

/**
 * The stations the player offers on `active`: every campus's, except those of
 * a dev-only campus, which only that campus offers. A dev-only campus offers
 * only its own, so nothing it plays reaches another campus's servers.
 */
export function stationsOffered(active: CampusDefinition): ReadonlyArray<Station> {
	if (active.devOnly) {
		return active.radio?.stations ?? []
	}
	return campuses
		.filter((campus) => !campus.devOnly)
		.flatMap((campus) => campus.radio?.stations ?? [])
}

/** The campus that runs `stationId`. */
export function stationCampus(stationId: StationId): CampusId {
	let campus = campuses.find((each) =>
		each.radio?.stations.some((station) => station.id === stationId),
	)
	if (campus === undefined) {
		throw new Error(`no campus runs station "${stationId}"`)
	}
	return campus.id
}

/** Each station by id. Every `StationId` names a station some campus runs. */
export const STATIONS = Object.fromEntries(
	STATION_LIST.map((station) => [station.id, station]),
) as Readonly<Record<StationId, Station>>

/** A logo as an `<Image source>`, fetched from the server when it is drawn. */
export const logoImage = (logo: RadioLogo): RemoteImage => remoteImage('streaming', logo.imageName)
