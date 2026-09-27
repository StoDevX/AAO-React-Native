import {
	appleMapsDirectionsUrl,
	appleMapsSearchUrl,
	buildingPhotoUrl,
	mapCredits,
	mapStyleUrl,
} from '../urls'

describe('buildingPhotoUrl', () => {
	// ccc-server stores `photos` as bare filenames, so a record is useless
	// without this prefix.
	it('resolves a bare filename against the photo host', () => {
		expect(buildingPhotoUrl('leighton.jpg')).toBe(
			'https://carls-app.github.io/map-data/cache/img/leighton.jpg',
		)
	})
})

describe('appleMapsSearchUrl', () => {
	it('hands the address to Maps over https', () => {
		expect(appleMapsSearchUrl('1520 St Olaf Ave')).toBe(
			'https://maps.apple.com/?q=1520%20St%20Olaf%20Ave',
		)
	})

	// Northfield addresses carry commas and hashes; an unescaped `#` would
	// truncate the query at the fragment.
	it('escapes a punctuated address rather than truncating it', () => {
		expect(appleMapsSearchUrl('1 Old Main Dr, #200')).toBe(
			'https://maps.apple.com/?q=1%20Old%20Main%20Dr%2C%20%23200',
		)
	})
})

describe('mapStyleUrl', () => {
	// Carleton's style does cover St. Olaf, but it draws the campus as an
	// anonymous cluster of grey footprints.
	it('gives each campus its own basemap', () => {
		expect(mapStyleUrl('stolaf')).not.toBe(mapStyleUrl('carleton'))
	})
})

describe('appleMapsDirectionsUrl', () => {
	it('asks for walking directions to a point, latitude first', () => {
		expect(appleMapsDirectionsUrl([-93.1839, 44.4618])).toBe(
			'https://maps.apple.com/?daddr=44.4618,-93.1839&dirflg=w',
		)
	})
})

// The tiles' licence requires the OpenStreetMap credit; each campus's style
// also credits its college. These mirror the styles' own source attributions.
describe('mapCredits', () => {
	it("credits OpenStreetMap, then St. Olaf, for St. Olaf's map", () => {
		expect(mapCredits('stolaf')).toEqual([
			{label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright'},
			{label: 'St. Olaf College', url: 'https://wp.stolaf.edu/'},
		])
	})

	it("credits OpenStreetMap, then Carleton, for Carleton's map", () => {
		expect(mapCredits('carleton')).toEqual([
			{label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright'},
			{label: 'Carleton College', url: 'https://www.carleton.edu/'},
		])
	})
})
