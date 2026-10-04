import {describe, expect, test} from '@jest/globals'

import {parseStationNow, presentNowPlaying} from '../now-playing'
import {STATIONS, logoImage} from '../stations'

const SONG = {
	title: 'River Run: Lvl 1',
	artist: 'The Beths',
	album: '',
	time: '2026-10-03 08:28:01',
	duration: 247,
	links: {
		artwork: 'https://is1-ssl.mzstatic.com/image/thumb/a/100x100bb.jpg',
		artwork_600: 'https://is1-ssl.mzstatic.com/image/thumb/a/600x600bb.jpg',
	},
}

describe('parseStationNow', () => {
	test('takes the song on air, with its large artwork, and how long to wait', () => {
		expect(parseStationNow({now: SONG, recent: [], refreshSecs: 144})).toStrictEqual({
			song: {
				title: 'River Run: Lvl 1',
				artist: 'The Beths',
				artworkUri: 'https://is1-ssl.mzstatic.com/image/thumb/a/600x600bb.jpg',
			},
			refreshMs: 129_000,
		})
	})

	test('has no song when none is on air', () => {
		expect(parseStationNow({now: null, refreshSecs: 60}).song).toBeNull()
	})

	test('has no song when it lacks a title, as there would be nothing to say', () => {
		expect(parseStationNow({now: {...SONG, title: ' '}, refreshSecs: 60}).song).toBeNull()
		expect(parseStationNow({now: {artist: 'The Beths'}, refreshSecs: 60}).song).toBeNull()
	})

	test('keeps a song with no artist, by its title alone', () => {
		let song = parseStationNow({now: {...SONG, artist: ' '}, refreshSecs: 60}).song
		expect(song).toMatchObject({title: 'River Run: Lvl 1', artist: null})
	})

	test('keeps a song with no artwork, without any', () => {
		let song = parseStationNow({now: {...SONG, links: {}}, refreshSecs: 60}).song
		expect(song).toStrictEqual({title: 'River Run: Lvl 1', artist: 'The Beths', artworkUri: null})
	})

	test('waits until 15 seconds before the song should end, while it is a way off', () => {
		expect(parseStationNow({now: SONG, refreshSecs: 144}).refreshMs).toBe(129_000)
		expect(parseStationNow({now: SONG, refreshSecs: 45}).refreshMs).toBe(30_000)
	})

	test('asks every five seconds for the last 30, until the song changes', () => {
		expect(parseStationNow({now: SONG, refreshSecs: 30}).refreshMs).toBe(5_000)
		// The feed's count stops a few seconds short of the end, and holds there.
		expect(parseStationNow({now: SONG, refreshSecs: 9}).refreshMs).toBe(5_000)
		expect(parseStationNow({now: SONG, refreshSecs: 0}).refreshMs).toBe(5_000)
		expect(parseStationNow({now: SONG, refreshSecs: -3}).refreshMs).toBe(5_000)
	})

	test('does not ask every five seconds when no song is on air, but every 15', () => {
		expect(parseStationNow({now: null, refreshSecs: 3}).refreshMs).toBe(15_000)
		expect(parseStationNow({now: null, refreshSecs: 144}).refreshMs).toBe(129_000)
	})

	test('asks in a minute without a say from the feed', () => {
		expect(parseStationNow({now: SONG}).refreshMs).toBe(60_000)
		expect(parseStationNow({now: SONG, refreshSecs: 'soon'}).refreshMs).toBe(60_000)
	})

	test('reads anything else as nothing on air', () => {
		expect(parseStationNow(null)).toStrictEqual({song: null, refreshMs: 60_000})
		expect(parseStationNow('<html>')).toStrictEqual({song: null, refreshMs: 60_000})
		expect(parseStationNow([])).toStrictEqual({song: null, refreshMs: 60_000})
	})
})

describe('presentNowPlaying', () => {
	let station = STATIONS.krlx
	let logo = station.logos[0]
	let song = {title: 'River Run: Lvl 1', artist: 'The Beths', artworkUri: 'https://x/600.jpg'}

	test('shows the song, its artist, the station and the song’s artwork', () => {
		expect(presentNowPlaying(song, station, logo)).toStrictEqual({
			title: 'River Run: Lvl 1',
			artist: 'The Beths',
			albumTitle: '88.1 KRLX-FM',
			artworkUri: 'https://x/600.jpg',
			isSong: true,
		})
	})

	test('leaves the artist out for a song with none', () => {
		let shown = presentNowPlaying({...song, artist: null}, station, logo)
		expect(shown).toStrictEqual({
			title: 'River Run: Lvl 1',
			albumTitle: '88.1 KRLX-FM',
			artworkUri: 'https://x/600.jpg',
			isSong: true,
		})
	})

	test('shows the station’s logo for a song with no artwork of its own', () => {
		let shown = presentNowPlaying({...song, artworkUri: null}, station, logo)
		expect(shown).toMatchObject({
			title: 'River Run: Lvl 1',
			isSong: true,
			artworkUri: logoImage(logo).uri,
		})
	})

	test('shows the show on air, under the station, with no song', () => {
		expect(presentNowPlaying(null, station, logo, {title: 'Pitch Perfect'})).toStrictEqual({
			title: 'Pitch Perfect',
			artist: '88.1 KRLX-FM',
			artworkUri: logoImage(logo).uri,
			isSong: false,
		})
	})

	test('shows the song, not the show, when both are on air', () => {
		let shown = presentNowPlaying(song, station, logo, {title: 'Pitch Perfect'})
		expect(shown).toMatchObject({title: 'River Run: Lvl 1', artist: 'The Beths'})
	})

	test('shows the station and its logo with no song', () => {
		expect(presentNowPlaying(null, station, logo)).toStrictEqual({
			title: '88.1 KRLX-FM',
			artworkUri: logoImage(logo).uri,
			isSong: false,
		})
	})
})
