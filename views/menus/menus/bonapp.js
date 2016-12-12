// @flow
import React from 'react'
import LoadingView from '../../components/loading'
import type {TopLevelViewPropsType} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import findIndex from 'lodash/findIndex'
import {BaseMenuView} from './base'
import type {
  BonAppMenuInfoType,
  DayPartMenuType,
  DayPartsCollectionType,
  BonAppCafeInfoType,
} from '../types'

export class BonAppMenuView extends React.Component {
  props: TopLevelViewPropsType & {
    now: momentT,
    cafeId: string,
    cafeInfo: BonAppCafeInfoType,
    cafeMenu: BonAppMenuInfoType,
  }

  findMenu(dayparts: DayPartsCollectionType, now: momentT): void|DayPartMenuType {
    if (!dayparts.length || !dayparts[0].length) {
      return
    }

    if (dayparts[0].length === 1) {
      return dayparts[0][0]
    }

    const times = dayparts[0].map(({starttime, endtime}) => ({
      startTime: moment.tz(starttime, 'H:mm', true, CENTRAL_TZ),
      endTime: moment.tz(endtime, 'H:mm', true, CENTRAL_TZ),
    }))

    let mealIndex = findIndex(times, ({startTime, endTime}) => now.isBetween(startTime, endTime))
    if (mealIndex === undefined) {
      if (now.isSameOrBefore(times[0].startTime)) {
        mealIndex = 0
      } else {
        mealIndex = times.length - 1
      }
    }

    return dayparts[0][mealIndex]
  }

  render() {
    let {
      now,
      cafeId,
      cafeMenu,
      cafeInfo,
    } = this.props

    let days = cafeInfo.cafes[cafeId].days
    let today = days.find(({date}) => date === now.format('YYYY-MM-DD'))
    if (!today || today.status === 'closed') {
      return <LoadingView text={today ? today.message : 'Closed today'} />
    }

    let dayparts = cafeMenu.days[0].cafes[cafeId].dayparts
    let mealInfo = this.findMenu(dayparts, now)
    let menus = mealInfo ? mealInfo.stations : []
    let mealName = mealInfo ? mealInfo.label : ''

    return (
      <BaseMenuView
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
