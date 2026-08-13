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
	| 'athletics'

// Stored as a string of the form "Label <https://example.com>".
export type LabelLinkString = string

export type Building = {
	accessibility: 'none' | 'wheelchair' | 'unknown'
	address: string | null
	categories: Array<Category>
	departments: Array<LabelLinkString>
	description: string
	floors: Array<LabelLinkString>
	name: string
	nickname: string
	offices: Array<LabelLinkString>
	photos?: Array<string>
}

export type Longitude = number
export type Latitude = number
export type Coordinate = [Longitude, Latitude]
export type Ring = Array<Coordinate>

export type Polygon = {
	coordinates: Array<Ring>
	type: 'Polygon'
}

export type Point = {
	coordinates: Coordinate
	type: 'Point'
}

export type GeometryCollection = {
	geometries: Array<Polygon | Point>
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
