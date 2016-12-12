// @flow
import React from 'react'
import LoadingView from '../../components/loading'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import findIndex from 'lodash/findIndex'
import {FilteredMenuView} from '../parts/filtered-menu'
import type {
  BonAppMenuInfoType,
  DayPartMenuType,
  DayPartsCollectionType,
  BonAppCafeInfoType,
} from '../types'

export class BonAppMenuWrapper extends React.Component {
  props: TopLevelViewPropsType & {
    now: momentT,
    cafeId: string,
    cafeInfo: BonAppCafeInfoType,
    cafeMenu: BonAppMenuInfoType,
  }

  findMenu(dayparts: DayPartsCollectionType, now: momentT): void|DayPartMenuType {
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
    // can query times relative to `now`.
    const times = daypart.map(({starttime, endtime}) => ({
      startTime: moment.tz(starttime, 'H:mm', true, CENTRAL_TZ),
      endTime: moment.tz(endtime, 'H:mm', true, CENTRAL_TZ),
    }))

    // We grab the first meal that ends sometime after `now`. The only time
    // this really fails is in the early morning, if it's like 1am and you're
    // wondering what there was at dinner.
    let mealIndex = findIndex(times, ({endTime}) => now.isSameOrBefore(endTime))

    // If we didn't find a meal, we must be after the last meal, so we want to
    // return the last meal of the day.
    if (mealIndex === -1) {
      mealIndex = times.length - 1
    }

    return daypart[mealIndex]
  }

  render() {
    let {
      now,
      cafeId,
      cafeMenu,
      cafeInfo,
    } = this.props

    // We grab the "today" info from here because BonApp returns special
    // messages in this response, like "Closed for Christmas Break"
    let days = cafeInfo.cafes[cafeId].days
    let today = days.find(({date}) => date === now.format('YYYY-MM-DD'))
    if (!today || today.status === 'closed') {
      return <LoadingView text={today ? today.message : 'Closed today'} />
    }

    // We hard-code to the first day returned because we're only requesting one day.
    // `cafes` is a map of cafe ids to cafes, but we only request one at a time.
    let dayparts = cafeMenu.days[0].cafes[cafeId].dayparts
    let mealInfo = this.findMenu(dayparts, now)
    let menus = mealInfo ? mealInfo.stations : []
    let mealName = mealInfo ? mealInfo.label : ''

    return (
      <FilteredMenuView
        route={this.props.route}
        navigator={this.props.navigator}
        now={this.props.now}
        stationMenus={menus}
        menuLabel={mealName}
        menuCorIcons={cafeMenu.cor_icons}
        foodItems={cafeMenu.items}
      />
    )
  }
}
