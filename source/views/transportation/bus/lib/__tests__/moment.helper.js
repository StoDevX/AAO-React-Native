// @flow
import moment from 'moment-timezone'

const CENTRAL_TZ = 'America/Chicago'

export const time = (time: string) => moment.tz(time, 'h:mma', true, CENTRAL_TZ)

export const dayAndTime = (time: string) =>
	moment.tz(time, 'dd h:mma', true, CENTRAL_TZ)
