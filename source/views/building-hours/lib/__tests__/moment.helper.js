// @flow
import moment from 'moment-timezone'
export {moment}

export const dayMoment = (time: string, format: ?string = 'ddd h:mma') =>
	moment.tz(time, format, false, 'America/Winnipeg')
export const hourMoment = (time: string) =>
	moment.tz(time, 'h:mma', false, 'America/Winnipeg')
export const plainMoment = (time: string, format: string) =>
	moment.tz(time, format, false, 'America/Winnipeg')
