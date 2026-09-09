// The union of both campuses' live values -- read out of the two feeds
// directly rather than assumed, since the two campuses categorise their
// buildings independently and share only about a third of these values.
export type Category =
	| 'academic'
	| 'accessible-parking'
	| 'administrative'
	| 'admissions'
	| 'admissions-parking'
	| 'athletics'
	| 'bookstore'
	| 'building'
	| 'campus-parking'
	| 'dining'
	| 'employee-housing'
	| 'ev-charging'
	| 'field'
	| 'hall'
	| 'house'
	| 'housing'
	| 'landmark'
	| 'memorial'
	| 'outdoors'
	| 'parking'
	| 'point-of-interest'
	| 'residence-hall'
	| 'student-center'
	| 'student-housing'
	| 'visitor-center'
	| 'visitor-information'
	| 'visitor-parking'

// Stored as a string of the form "Label <https://example.com>".
export type LabelLinkString = string

/** A label/href pair, already split apart. St. Olaf's `links` field arrives
 * in this shape rather than as a `LabelLinkString`. */
export type LabelLink = {
	label: string
	href: string
}

export type Building = {
	accessibility: 'none' | 'wheelchair' | 'unknown'
	address: string | null
	categories: Array<Category>
	/** Carleton serves these as `LabelLinkString`s; St. Olaf serves them as
	 * `LabelLink` objects already split apart. */
	departments: Array<LabelLinkString | LabelLink>
	description: string
	floors: Array<LabelLinkString>
	name: string
	nickname: string
	offices: Array<LabelLinkString>
	photos?: Array<string>
	/** St. Olaf-only: the building's short code, e.g. "AB" for Flaten Art Barn. */
	abbreviation?: string | null
	/** St. Olaf-only: further links the campus map surfaces per building. */
	links?: Array<LabelLink>
	/** St. Olaf-only: a human-readable category summary, e.g. "Administrative & Academic". */
	type?: string | null
}

export type Longitude = number
export type Latitude = number
export type Coordinate = [Longitude, Latitude]
export type Ring = Array<Coordinate>

export type Polygon = {
	coordinates: Array<Ring>
	type: 'Polygon'
}

/** A handful of St. Olaf features (e.g. the field house, the townhouses) are
 * several disjoint rings under one id, which GeoJSON models as one
 * MultiPolygon rather than several Polygons. */
export type MultiPolygon = {
	coordinates: Array<Array<Ring>>
	type: 'MultiPolygon'
}

export type Point = {
	coordinates: Coordinate
	type: 'Point'
}

export type GeometryCollection = {
	geometries: Array<Polygon | Point | MultiPolygon>
	type: 'GeometryCollection'
}

export type Feature<T> = {
	geometry: GeometryCollection
	id: string
	properties: T
	type: 'Feature'
}

export type FeatureCollection<T> = {
	type: 'FeatureCollection'
	features: Array<Feature<T>>
}
