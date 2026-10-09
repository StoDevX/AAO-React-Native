import type {CampusId} from '../../campuses/ids'
import type {BuildingDirectory} from './directory/types'

/**
 * A basemap style: a map-style source in the sources manifest, by its id
 * (`stolaf-light`), resolved against the published manifest; or a fixed URL.
 */
export type MapStyle = {manifestId: string} | {url: string}

/// A credit the map shows, and where it leads.
export type MapCredit = {label: string; url: string}

/** A campus's map: the Map screen, its cards, and the outline on Hours' detail. */
export type MapSection = {
	/** The server whose `map/geojson` this campus reads; its own when absent. */
	server?: CampusId
	/** The screen's title, which the next screen's Back button reads. */
	title: string
	/** Where the camera starts, as GeoJSON orders it: longitude, latitude. */
	center: readonly [longitude: number, latitude: number]
	/** The college's credit, shown after OpenStreetMap's in the About menu. */
	credit: MapCredit
	/** The basemap in the light appearance, and wherever there is no dark one. */
	style: MapStyle
	/** The basemap in the dark appearance. Absent keeps the map light in dark mode. */
	darkStyle?: MapStyle
	/** The basemap's building-name layer, which Hours' outline hides for its own building. */
	buildingLabelsLayer?: string
	/** Where `photos` filenames in the map feed resolve; absent means no photos are shown. */
	photoRoot?: string
	/** Whether this campus's Hours venues carry `building` keys, which join them to map places. */
	venuesByBuilding?: true
	/** Each building's floor directory, read from `spaces/directory`. */
	buildingDirectory?: {
		/** This repository's copy, read by UI tests naming no campus and by the dev override. */
		bundled?: ReadonlyArray<BuildingDirectory>
	}
}
