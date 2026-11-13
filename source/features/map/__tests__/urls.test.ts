import {
	mapsDirectionsUrl,
	mapsSearchUrl,
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

describe('mapsSearchUrl', () => {
	it('hands the address to Maps over https', () => {
		expect(mapsSearchUrl('1520 St Olaf Ave', 'ios')).toBe(
			'https://maps.apple.com/?q=1520%20St%20Olaf%20Ave',
		)
	})

	// Northfield addresses carry commas and hashes; an unescaped `#` would
	// truncate the query at the fragment.
	it('escapes a punctuated address rather than truncating it', () => {
		expect(mapsSearchUrl('1 Old Main Dr, #200', 'ios')).toBe(
			'https://maps.apple.com/?q=1%20Old%20Main%20Dr%2C%20%23200',
		)
	})

	it("hands the address to Android's maps app as a geo: URI", () => {
		expect(mapsSearchUrl('1 Old Main Dr, #200', 'android')).toBe(
			'geo:0,0?q=1%20Old%20Main%20Dr%2C%20%23200',
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
		expect(basemapScheme(stolaf.map, null)).toBe('light')
		expect(basemapScheme(stolaf.map, undefined)).toBe('light')
	})
})

describe('mapsDirectionsUrl', () => {
	it('asks for walking directions to a point, latitude first', () => {
		expect(mapsDirectionsUrl([-93.1839, 44.4618], 'ios')).toBe(
			'https://maps.apple.com/?daddr=44.4618,-93.1839&dirflg=w',
		)
	})

	it('asks Google Maps for walking directions on Android', () => {
		expect(mapsDirectionsUrl([-93.1839, 44.4618], 'android')).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=44.4618,-93.1839&travelmode=walking',
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
