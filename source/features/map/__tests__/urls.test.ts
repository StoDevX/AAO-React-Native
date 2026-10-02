import {
	appleMapsDirectionsUrl,
	appleMapsSearchUrl,
	basemapScheme,
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
		expect(mapStyleUrl('stolaf', 'light')).not.toBe(mapStyleUrl('carleton', 'light'))
	})

	it("draws St. Olaf's dark basemap in dark mode", () => {
		expect(mapStyleUrl('stolaf', 'dark')).toBe('https://stolaf.dev/campus-map-data/style-dark.json')
		expect(mapStyleUrl('stolaf', 'light')).toBe('https://stolaf.dev/campus-map-data/style.json')
	})

	// Carleton's style has no dark variant.
	it("keeps Carleton's basemap in dark mode", () => {
		expect(mapStyleUrl('carleton', 'dark')).toBe(mapStyleUrl('carleton', 'light'))
	})
})

describe('basemapScheme', () => {
	it('is dark only for a campus with a dark style, in dark mode', () => {
		expect(basemapScheme('stolaf', 'dark')).toBe('dark')
		expect(basemapScheme('stolaf', 'light')).toBe('light')
		expect(basemapScheme('carleton', 'dark')).toBe('light')
		expect(basemapScheme('carleton', 'light')).toBe('light')
	})

	// Before the system reports an appearance, the light basemap is the one
	// every campus has.
	it('falls back to light when the appearance is unknown', () => {
		expect(basemapScheme('stolaf', 'unspecified')).toBe('light')
		expect(basemapScheme('stolaf', undefined)).toBe('light')
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
