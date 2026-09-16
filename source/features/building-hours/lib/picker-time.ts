import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import {timezone} from '@frogpond/constants'

import {TIME_FORMAT} from './constants'

/**
 * A SwiftUI `DatePicker` takes and reports a whole instant, and draws it in
 * the reader's own zone. This editor deliberately stays on St. Olaf's own
 * wall clock regardless: an admin here is entering the campus's canonical
 * schedule, not their own view of it, so `7:30am` on the picker's face must
 * mean 7:30am Central even though `@frogpond/time-format` no longer preserves
 * a zone for anything a reader sees elsewhere in the app.
 *
 * Only the hour and minute on the picker's face cross the boundary: campus
 * wall clock out, reader's wall clock in.
 */
export function toPickerDate(time: Moment): Date {
	return moment().hours(time.hours()).minutes(time.minutes()).seconds(0).milliseconds(0).toDate()
}

/** The counterpart: what the picker was left showing, kept as campus time on purpose. */
export function fromPickerDate(picked: Date): string {
	let onTheFace = moment(picked)
	return moment
		.tz(timezone())
		.hours(onTheFace.hours())
		.minutes(onTheFace.minutes())
		.format(TIME_FORMAT)
}
