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

		expect(lines).toEqual(['Boe Memorial Chapel', '7:00 PM – Fri, Sep. 11th, 2026'])
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
