/* eslint-disable react/prop-types, camelcase */
// @flow
import React from 'react'
import LoadingView from '../components/loading'
import qs from 'querystring'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {FancyMenu} from './components/fancy-menu'
import type {
  BonAppMenuInfoType,
  BonAppCafeInfoType,
  StationMenuType,
  ProcessedMealType,
  DayPartMenuType,
  MenuItemContainerType,
} from './types'
import sample from 'lodash/sample'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import type momentT from 'moment'
import moment from 'moment-timezone'
import {trimStationName, trimItemLabel} from './lib/trim-names'
import {getTrimmedTextWithSpaces, parseHtml} from '../../lib/html'
import {AllHtmlEntities} from 'html-entities'
import {toLaxTitleCase} from 'titlecase'
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'
const CENTRAL_TZ = 'America/Winnipeg'

const bonappMenuBaseUrl = 'http://legacy.cafebonappetit.com/api/2/menus'
const bonappCafeBaseUrl = 'http://legacy.cafebonappetit.com/api/2/cafes'
const fetchJsonQuery = (url, query) =>
  fetchJson(`${url}?${qs.stringify(query)}`)
const entities = new AllHtmlEntities()

type BonAppPropsType = TopLevelViewPropsType & {
  cafeId: string,
  ignoreProvidedMenus?: boolean,
  loadingMessage: string[],
  name: string,
}

export class BonAppHostedMenu extends React.Component {
  state: {
    error: ?Error,
    loading: boolean,
    now: momentT,
    cafeInfo: ?BonAppCafeInfoType,
    cafeMenu: ?BonAppMenuInfoType,
  } = {
    error: null,
    loading: true,
    now: moment.tz(CENTRAL_TZ),
    cafeMenu: null,
    cafeInfo: null,
  }

  componentWillMount() {
    this.fetchData(this.props)
  }

  componentWillReceiveProps(newProps: BonAppPropsType) {
    this.props.cafeId !== newProps.cafeId && this.fetchData(newProps)
  }

  props: BonAppPropsType

  fetchData = async (props: BonAppPropsType) => {
    this.setState({loading: true})

    let cafeMenu = null
    let cafeInfo = null

    try {
      let requests = await Promise.all([
        fetchJsonQuery(bonappMenuBaseUrl, {cafe: props.cafeId}),
        fetchJsonQuery(bonappCafeBaseUrl, {cafe: props.cafeId}),
      ])
      cafeMenu = (requests[0]: BonAppMenuInfoType)
      cafeInfo = (requests[1]: BonAppCafeInfoType)
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      this.setState({error: err})
    }

    this.setState({
      loading: false,
      cafeMenu,
      cafeInfo,
      now: moment.tz(CENTRAL_TZ),
    })
  }

  findCafeMessage = (
    cafeId: string,
    cafeInfo: BonAppCafeInfoType,
    now: momentT,
  ) => {
    let actualCafeInfo = cafeInfo.cafes[cafeId]
    if (!actualCafeInfo) {
      return 'BonApp did not return a menu for that café'
    }

    const todayDate = now.format('YYYY-MM-DD')
    let todayMenu = actualCafeInfo.days.find(({date}) => date === todayDate)
    if (!todayMenu) {
      return 'Closed today'
    } else if (todayMenu.status === 'closed') {
      return todayMenu.message || 'Closed today'
    }

    return null
  }

  prepareSingleMenu(
    mealInfo: DayPartMenuType,
    foodItems: MenuItemContainerType,
    ignoreProvidedMenus: boolean,
  ): ProcessedMealType {
    let stationMenus: StationMenuType[] = mealInfo ? mealInfo.stations : []

    if (ignoreProvidedMenus) {
      // go over the list of all food items, turning it into a mapping
      // of {StationName: Array<FoodItemId>}
      const idsGroupedByStation = reduce(
        foodItems,
        (grouped, item) => {
          if (item.station in grouped) {
            grouped[item.station].push(item.id)
          } else {
            grouped[item.station] = [item.id]
          }
          return grouped
        },
        {},
      )

      // then we make our own StationMenus list
      stationMenus = Object.keys(idsGroupedByStation).map((name, i) => ({
        order_id: String(i),
        id: String(i),
        label: name,
        price: '',
        note: '',
        soup: false,
        items: idsGroupedByStation[name],
      }))
    }

    // Make sure to titlecase the station menus list, too, so the sort works
    stationMenus = stationMenus.map(s => ({
      ...s,
      label: toLaxTitleCase(s.label),
    }))

    return {
      stations: stationMenus,
      label: mealInfo.label || '',
      starttime: mealInfo.starttime || '0:00',
      endtime: mealInfo.endtime || '23:59',
    }
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text={sample(this.props.loadingMessage)} />
    }

    if (this.state.error) {
      return <NoticeView text={`Error: ${this.state.error.message}`} />
    }

    if (!this.state.cafeMenu || !this.state.cafeInfo) {
      let err = new Error(
        `Something went wrong loading BonApp cafe ${this.props.cafeId}`,
      )
      tracker.trackException(err)
      bugsnag.notify(err)
      return (
        <NoticeView text="Something went wrong. Email odt@stolaf.edu to let them know?" />
      )
    }

    let {cafeId, ignoreProvidedMenus = false} = this.props
    let {now, cafeMenu, cafeInfo} = this.state

    // We grab the "today" info from here because BonApp returns special
    // messages in this response, like "Closed for Christmas Break"
    // TODO: Figure out how to pass this down to FancyMenu, so we can render
    //       the filterbar to let people change meals if a meal/day isn't available.
    let specialMessage = this.findCafeMessage(cafeId, cafeInfo, now)
    if (specialMessage) {
      return <NoticeView text={specialMessage} />
    }

    // prepare all food items from bonapp for rendering
    const foodItems = mapValues(cafeMenu.items, item => ({
      ...item, // we want to edit the item, not replace it
      station: entities.decode(toLaxTitleCase(trimStationName(item.station))), // <b>@station names</b> are a mess
      label: entities.decode(trimItemLabel(item.label)), // clean up the titles
      description: getTrimmedTextWithSpaces(parseHtml(item.description || '')), // clean up the descriptions
    }))

    // We hard-code to the first day returned because we're only requesting
    // one day. `cafes` is a map of cafe ids to cafes, but we only request one
    // cafe at a time, so we just grab the one we requested.
    const dayparts = cafeMenu.days[0].cafes[cafeId].dayparts

    // either use the meals as provided by bonapp, or make our own custom meal info
    const mealInfoItems = dayparts[0].length
      ? dayparts[0]
      : [
          {
            label: 'Menu',
            starttime: '0:00',
            endtime: '23:59',
            id: 'na',
            abbreviation: 'M',
            stations: [],
          },
        ]
    const ignoreMenus = dayparts[0].length ? ignoreProvidedMenus : true
    const allMeals = mealInfoItems.map(mealInfo =>
      this.prepareSingleMenu(mealInfo, foodItems, ignoreMenus),
    )

    return (
      <FancyMenu
        navigation={this.props.navigation}
        foodItems={foodItems}
        menuCorIcons={cafeMenu.cor_icons}
        meals={allMeals}
        now={now}
        name={this.props.name}
      />
    )
  }
}
