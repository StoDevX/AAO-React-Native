import {makeBuilding} from '../../__tests__/fixtures'
import type {Building, Feature, GeometryCollection} from '../../types'
import {cutoutBounds} from '../cutout-bounds'

function withGeometry(geometry: GeometryCollection): Feature<Building> {
	return {...makeBuilding({id: 'toh', name: 'Tomson Hall'}), geometry}
}

describe('cutoutBounds', () => {
	it('boxes a building that has an outline to draw', () => {
		let polygon = withGeometry({
			type: 'GeometryCollection',
			geometries: [
				{
					type: 'Polygon',
					coordinates: [
						[
							[-93.18, 44.46],
							[-93.17, 44.46],
							[-93.17, 44.47],
							[-93.18, 44.47],
						],
					],
				},
			],
		})

		expect(cutoutBounds(polygon)).toBeDefined()
	})

	// The Cage, Stav Hall and the rest of Buntrock's dining rooms key to a
	// point-of-interest record whose only geometry is a Point. There is no
	// footprint to fill, outline or label.
	it('has no box for a feature whose only geometry is a Point', () => {
		let point = withGeometry({
			type: 'GeometryCollection',
			geometries: [{type: 'Point', coordinates: [-93.1827, 44.4619]}],
		})

		expect(cutoutBounds(point)).toBeUndefined()
	})

	// A `building` key can resolve to a records-only stub with no coordinates.
	it('has no box for a feature with no coordinates', () => {
		expect(cutoutBounds(withGeometry({type: 'GeometryCollection', geometries: []}))).toBeUndefined()
	})
})
