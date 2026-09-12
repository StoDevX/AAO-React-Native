import type {ImageSourcePropType} from 'react-native'

import {buildingPhoto} from '../building-photo'

const CAGE: ImageSourcePropType = {uri: 'cage.jpg', width: 100, height: 100, scale: 1}
const DISCO: ImageSourcePropType = {uri: 'disco.jpg', width: 100, height: 100, scale: 1}

const images = new Map<string, ImageSourcePropType>([
	['cage', CAGE],
	['disco', DISCO],
])

describe('buildingPhoto', () => {
	it('finds a St. Olaf venue its own photograph', () => {
		expect(buildingPhoto('stolaf', 'cage', images)).toBe(CAGE)
	})

	it('has none for a venue that names no image', () => {
		expect(buildingPhoto('stolaf', undefined, images)).toBeNull()
	})

	it('has none for a key the registry does not hold', () => {
		expect(buildingPhoto('stolaf', 'sayles', images)).toBeNull()
	})

	// The registry is St. Olaf's alone. Carleton's Writing Center carries the
	// key `disco`, which at St. Olaf is a different room -- showing it would
	// put the wrong building on the screen, not merely no building.
	it('never resolves a Carleton venue, even on a key that collides', () => {
		expect(buildingPhoto('carleton', 'disco', images)).toBeNull()
	})
})
