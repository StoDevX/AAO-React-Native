// @flow
import moment from 'moment-timezone'
export {moment}

export const dayMoment = (time: string, format: ?string = 'ddd h:mma') =>
	moment.tz(time, format, false, 'US/Central')
export const hourMoment = (time: string) =>
	moment.tz(time, 'h:mma', false, 'US/Central')
export const plainMoment = (time: string, format: string) =>
	moment.tz(time, format, false, 'US/Central')
