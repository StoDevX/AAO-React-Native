import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import {timezone} from '@frogpond/constants'

import {TIME_FORMAT} from './constants'

/**
 * A SwiftUI `DatePicker` takes and reports a whole instant, and draws it in
 * the reader's own zone. Building hours are St. Olaf wall-clock times, so an
 * instant handed straight to the picker is shown shifted by however far the
 * reader is from campus -- a row reading 7:30am opening a picker reading
 * 8:30 AM -- and read back shifted the other way.
 *
 * Only the hour and minute on the picker's face were ever chosen, so those
 * are all that cross the boundary: campus wall clock out, reader's wall clock
 * in.
 */
export function toPickerDate(time: Moment): Date {
	return moment().hours(time.hours()).minutes(time.minutes()).seconds(0).milliseconds(0).toDate()
}

/** The counterpart: what the picker was left showing, as a campus time. */
export function fromPickerDate(picked: Date): string {
	let onTheFace = moment(picked)
	return moment
		.tz(timezone())
		.hours(onTheFace.hours())
		.minutes(onTheFace.minutes())
		.format(TIME_FORMAT)
}
