// @flow
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import findIndex from 'lodash/findIndex'
import type {DayPartMenuType, DayPartsCollectionType} from '../types'

export function findMenu(dayparts: DayPartsCollectionType, now: momentT): void|DayPartMenuType {
  // `dayparts` is, conceptually, a collection of bonapp menus for a
  // location. It's a single-element array of arrays, so we first check
  // to see if either dimension is empty.
  if (!dayparts.length || !dayparts[0].length) {
    return
  }

  // Now that we know they're not empty, we grab the single element out of
  // the top array for easier use.
  const daypart = dayparts[0]

  // If there's only a single bonapp menu for this location (think the Cage,
  // instead of the Caf), we just return that item.
  if (daypart.length === 1) {
    return daypart[0]
  }

  // Otherwise, we make ourselves a list of {starttime, endtime} pairs so we
  // can query times relative to `now`. Also make sure to set dayOfYear to
  // `now`, so that we don't have our days wandering all over the place.
  const times = daypart.map(({starttime, endtime}) => ({
    start: moment.tz(starttime, 'H:mm', true, CENTRAL_TZ).dayOfYear(now.dayOfYear()),
    end: moment.tz(endtime, 'H:mm', true, CENTRAL_TZ).dayOfYear(now.dayOfYear()),
  }))

  // We grab the first meal that ends sometime after `now`. The only time
  // this really fails is in the early morning, if it's like 1am and you're
  // wondering what there was at dinner.
  let mealIndex = findIndex(times, ({end}) => now.isSameOrBefore(end))

  // If we didn't find a meal, we must be after the last meal, so we want to
  // return the last meal of the day.
  if (mealIndex === -1) {
    mealIndex = times.length - 1
  }

  return daypart[mealIndex]
}
