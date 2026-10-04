import {buildingPhoto} from '../building-photo'

describe('buildingPhoto', () => {
	it('gives a St. Olaf venue the photograph its key names, fetched from the server', () => {
		expect(buildingPhoto('stolaf', 'cage')).toStrictEqual({
			uri: 'https://stolaf.api.frogpond.tech/v1/images/spaces/cage.webp',
			cache: 'force-cache',
		})
	})

	it('has none for a venue that names no image', () => {
		expect(buildingPhoto('stolaf', undefined)).toBeNull()
	})

	// The photos are St. Olaf's alone. Carleton's Writing Center carries the
	// key `disco`, which at St. Olaf is a different room -- showing it would
	// put the wrong building on the screen, not merely no building.
	it('never resolves a Carleton venue, even on a key that collides', () => {
		expect(buildingPhoto('carleton', 'disco')).toBeNull()
	})
})
