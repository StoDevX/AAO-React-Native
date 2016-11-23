// @flow
import moment from 'moment-timezone'
export {moment}

export const dayMoment = (time: string) => moment.tz(time, 'ddd H:mm', false, 'America/Winnipeg')
export const hourMoment = (time: string) => moment.tz(time, 'H:mm', false, 'America/Winnipeg')
