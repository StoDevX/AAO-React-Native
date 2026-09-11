import moment from 'moment-timezone'
import {timezone} from '@frogpond/constants'

import {fromPickerDate, toPickerDate} from '../picker-time'

/// The suite pins the process to campus time, which is the one zone where a
/// conversion that does nothing at all would pass -- and Node's zone cannot be
/// repointed once a worker has started, as `modules/ccc-calendar`'s ical tests
/// record. Moving moment's own default is the way round it, and is what these
/// helpers read the reader's zone through.
function readerIsIn(zone: string) {
	moment.tz.setDefault(zone)
}

afterEach(() => {
	moment.tz.setDefault()
})

const CAMPUS_OPENING = () => moment.tz('7:30am', 'h:mma', true, timezone())

describe('toPickerDate', () => {
	it('puts the campus wall-clock time on the picker face', () => {
		readerIsIn('America/Chicago')

		expect(moment(toPickerDate(CAMPUS_OPENING())).format('h:mma')).toBe('7:30am')
	})

	/// The hours belong to St. Olaf, not to whoever is reading them. Handing
	/// the picker the instant instead of the face would show a reader in Tokyo
	/// a dining hall opening at half past nine in the evening.
	it('shows the same face to a reader far from campus', () => {
		readerIsIn('Asia/Tokyo')

		expect(moment(toPickerDate(CAMPUS_OPENING())).format('h:mma')).toBe('7:30am')
	})

	it('drops the seconds a picker cannot show', () => {
		readerIsIn('America/Chicago')

		let onTheFace = toPickerDate(CAMPUS_OPENING())

		expect(onTheFace.getSeconds()).toBe(0)
		expect(onTheFace.getMilliseconds()).toBe(0)
	})
})

describe('fromPickerDate', () => {
	it('reads the picker face back as a campus time', () => {
		readerIsIn('America/Chicago')
		let picked = moment().hours(20).minutes(0).toDate()

		expect(fromPickerDate(picked)).toBe('8:00pm')
	})

	it('reads it back as campus time for a reader far from campus', () => {
		readerIsIn('Asia/Tokyo')
		let picked = moment().hours(20).minutes(0).toDate()

		expect(fromPickerDate(picked)).toBe('8:00pm')
	})

	it.each(['America/Chicago', 'Asia/Tokyo', 'Pacific/Auckland', 'Atlantic/Azores'])(
		'round-trips a time untouched for a reader in %s',
		(zone) => {
			readerIsIn(zone)
			let evening = moment.tz('8:00pm', 'h:mma', true, timezone())

			expect(fromPickerDate(toPickerDate(evening))).toBe('8:00pm')
		},
	)

	it('keeps minutes that are not on the hour', () => {
		readerIsIn('Asia/Tokyo')

		expect(fromPickerDate(toPickerDate(CAMPUS_OPENING()))).toBe('7:30am')
	})
})
