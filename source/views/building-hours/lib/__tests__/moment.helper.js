// @flow
import moment from 'moment-timezone'
export {moment}

const CENTRAL_TZ = 'America/Chicago'

export const dayMoment = (time: string, format: ?string = 'ddd h:mma') =>
	moment.tz(time, format, false, CENTRAL_TZ)
export const hourMoment = (time: string) =>
	moment.tz(time, 'h:mma', false, CENTRAL_TZ)
export const plainMoment = (time: string, format: string) =>
	moment.tz(time, format, false, CENTRAL_TZ)
