import {CAMPUSES, type CampusDefinition} from '../../../campuses'
import {imageUrl, remoteImage, type RemoteImage} from '../../../lib/remote-images'
import type {Station, StationId} from './campus-section'
import type {RadioLogo} from './theme'

export type {Station, StationId}

const campuses: ReadonlyArray<CampusDefinition> = CAMPUSES

/**
 * Every campus's stations, in the registry's order: what the player's picker
 * offers, on every campus, and the first of them is the one a fresh install
 * views first.
 */
export const STATION_LIST: ReadonlyArray<Station> = campuses.flatMap(
	(campus) => campus.radio?.stations ?? [],
)

/** Each station by id. Every `StationId` names a station some campus runs. */
export const STATIONS = Object.fromEntries(
	STATION_LIST.map((station) => [station.id, station]),
) as Readonly<Record<StationId, Station>>

/** A logo as an `<Image source>`, fetched from the server when it is drawn. */
export const logoImage = (logo: RadioLogo): RemoteImage => remoteImage('streaming', logo.imageName)

/** Every logo of every station, for fetching before the sheet opens. */
export const allStationImageUrls = (): string[] =>
	Object.values(STATIONS).flatMap((station) =>
		station.logos.map((logo) => imageUrl('streaming', logo.imageName)),
	)
