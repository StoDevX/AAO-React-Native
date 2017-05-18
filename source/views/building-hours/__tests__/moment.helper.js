// @flow
import moment from 'moment-timezone'
export {moment}

moment.tz.setDefault('America/Winnipeg')

export const dayMoment = (time: string, format: ?string = 'ddd h:mma') =>
  moment(time, format, false)
export const hourMoment = (time: string) => moment(time, 'h:mma', false)
