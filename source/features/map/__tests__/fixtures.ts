import type {Building, Feature} from '../types'

type Overrides = Partial<Building> & {id: string}

export function makeBuilding({id, ...properties}: Overrides): Feature<Building> {
	return {
		type: 'Feature',
		id,
		geometry: {type: 'GeometryCollection', geometries: []},
		properties: {
			accessibility: 'unknown',
			address: null,
			categories: ['building'],
			departments: [],
			description: '',
			floors: [],
			name: id,
			nickname: '',
			offices: [],
			...properties,
		},
	}
}
