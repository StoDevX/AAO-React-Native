// @flow
import moment from 'moment-timezone'

export const time = (time: string) =>
	moment.tz(time, 'h:mma', true, 'US/Central')

export const dayAndTime = (time: string) =>
	moment.tz(time, 'dd h:mma', true, 'US/Central')
