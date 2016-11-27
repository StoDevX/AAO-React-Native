// @flow
import moment from 'moment-timezone'
export {moment}

export const dayMoment = (time: string) => moment.tz(time, 'ddd h:mma', false, 'America/Winnipeg')
export const hourMoment = (time: string) => moment.tz(time, 'h:mma', false, 'America/Winnipeg')
