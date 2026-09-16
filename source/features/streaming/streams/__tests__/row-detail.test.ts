import moment from 'moment-timezone'
import {streamDetailLines} from '../lib'
import type {StreamType} from '../types'

function makeStream(props: Partial<StreamType>): StreamType {
	return {
		category: 'Music',
		eid: '1',
		iframesrc: '',
		lastmod: '',
		player: '',
		poster: '',
		starttime: '',
		status: 'upcoming',
		thumb: '',
		title: 'Organ Recital',
		date: moment.tz('2026-09-11T19:00:00', 'America/Winnipeg'),
		...props,
	}
}

describe('streamDetailLines', () => {
	it('puts the subtitle above the showing time', () => {
		let lines = streamDetailLines(makeStream({subtitle: 'Boe Memorial Chapel'}))

		// Node's ICU joins with a comma; Apple's ICU (verified on-device) uses
		// "at" instead. Either is a correct localization choice -- this test
		// only pins Node's, which is what CI actually runs under.
		expect(lines).toEqual(['Boe Memorial Chapel', 'Sep 11, 2026, 7:00 PM'])
	})

	it('spells the showing time in the locale', () => {
		let lines = streamDetailLines(makeStream({subtitle: 'Boe'}), 'ja-JP')

		expect(lines).toEqual(['Boe', '2026/09/11 19:00'])
	})

	it('falls back to the performer when there is no subtitle', () => {
		let lines = streamDetailLines(makeStream({performer: 'St. Olaf Choir'}))

		expect(lines[0]).toBe('St. Olaf Choir')
	})

	/// An archived stream has already happened, so its start time says nothing
	/// useful -- the old row hid it, and so does this.
	it('omits the time for an archived stream', () => {
		let lines = streamDetailLines(makeStream({subtitle: 'Boe', status: 'archived'}))

		expect(lines).toEqual(['Boe'])
	})

	it('decodes the HTML entities these titles arrive with', () => {
		let lines = streamDetailLines(makeStream({subtitle: 'Bach &amp; Handel', status: 'archived'}))

		expect(lines).toEqual(['Bach & Handel'])
	})

	it('yields nothing when a stream has neither subtitle nor performer', () => {
		let lines = streamDetailLines(makeStream({status: 'archived'}))

		expect(lines).toEqual([])
	})
})
