import {
	appleMapsDirectionsUrl,
	appleMapsSearchUrl,
	basemapScheme,
	buildingPhotoUrl,
	mapCredits,
} from '../urls'
import {carleton} from '../../../campuses/edu-carleton'
import {stolaf} from '../../../campuses/edu-stolaf'

describe('buildingPhotoUrl', () => {
	// ccc-server stores `photos` as bare filenames, so a record is useless
	// without its campus's prefix.
	it("resolves a bare filename against the campus's photo host", () => {
		expect(buildingPhotoUrl(carleton.map.photoRoot, 'leighton.jpg')).toBe(
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

describe('basemapScheme', () => {
	it('is dark only for a campus with a dark style, in dark mode', () => {
		expect(basemapScheme(stolaf.map, 'dark')).toBe('dark')
		expect(basemapScheme(stolaf.map, 'light')).toBe('light')
		expect(basemapScheme(carleton.map, 'dark')).toBe('light')
		expect(basemapScheme(carleton.map, 'light')).toBe('light')
	})

	it('falls back to light when the appearance is unknown', () => {
		expect(basemapScheme(stolaf.map, 'unspecified')).toBe('light')
		expect(basemapScheme(stolaf.map, undefined)).toBe('light')
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
		expect(mapCredits(stolaf.map)).toEqual([
			{label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright'},
			{label: 'St. Olaf College', url: 'https://wp.stolaf.edu/'},
		])
	})

	it("credits OpenStreetMap, then Carleton, for Carleton's map", () => {
		expect(mapCredits(carleton.map)).toEqual([
			{label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright'},
			{label: 'Carleton College', url: 'https://www.carleton.edu/'},
		])
	})
})
