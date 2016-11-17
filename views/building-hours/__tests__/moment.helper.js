// @flow
import moment from 'moment-timezone'
export {moment}

export const dayMoment = time => moment.tz(time, 'ddd H:mm', false, 'America/Winnipeg')
export const hourMoment = time => moment.tz(time, 'H:mm', false, 'America/Winnipeg')
