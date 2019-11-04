// @flow

export type Category =
	| 'administrative'
	| 'academic'
	| 'outdoors'
	| 'building'
	| 'employee-housing'
	| 'student-housing'
	| 'hall'
	| 'parking'
	| 'house'

// "Label <link>"
export opaque type LabelLinkString = string

export function parseLinkString(
	str: LabelLinkString,
): {label: string, href: string} {
	let regex = /^(.*) <(.*)>$/
	let matches = regex.exec(str)
	return {label: matches[1], href: matches[2]}
}

export type Building = {
	accessibility: 'none' | 'wheelchair' | 'unknown',
	address: ?string,
	categories: Array<Category>,
	departments: Array<LabelLinkString>,
	description: string,
	floors: Array<LabelLinkString>,
	name: string,
	nickname: string,
	offices: Array<LabelLinkString>,
	photos?: [string],
}

export opaque type Longitude: number = number
export opaque type Latitude: number = number
export opaque type Coordinate: [Longitude, Latitude] = [Longitude, Latitude]
export type Ring = Array<Coordinate>

export type Polygon = {
	coordinates: Array<Ring>,
	type: 'Polygon',
}

export type Point = {
	coordinates: [Longitude, Latitude],
	type: 'Point',
}

export type GeometryCollection = {
	geometries: Array<Polygon | Point>,
	type: 'GeometryCollection',
}

export type Feature<T> = {
	geometry: GeometryCollection,
	id: string,
	properties: T,
	type: 'Feature',
}

export type FeatureCollection<T> = {
	type: 'FeatureCollection',
	features: Array<Feature<T>>,
}
