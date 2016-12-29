// @flow
import React from 'react'
import LoadingView from '../components/loading'
import qs from 'querystring'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {FancyMenu} from './components/fancy-menu'
import type {BonAppMenuInfoType, BonAppCafeInfoType} from './types'
import sample from 'lodash/sample'
import values from 'lodash/values'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import {findMenu} from './lib/find-menu'

const bonappMenuBaseUrl = 'http://legacy.cafebonappetit.com/api/2/menus'
const bonappCafeBaseUrl = 'http://legacy.cafebonappetit.com/api/2/cafes'
const fetchJsonQuery = (url, query) => fetchJson(`${url}?${qs.stringify(query)}`)

type BonAppPropsType = TopLevelViewPropsType & {
  cafeId: string,
  loadingMessage: string[],
  name: string,
};

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

  props: BonAppPropsType;

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
      this.setState({error: err})
    }

    this.setState({loading: false, cafeMenu, cafeInfo, now: moment.tz(CENTRAL_TZ)})
  }

  findCafeMessage = (cafeId: string, cafeInfo: BonAppCafeInfoType, now: momentT) => {
    let actualCafeInfo = cafeInfo.cafes[cafeId]
    if (!actualCafeInfo) {
      return 'BonApp did not return a menu for that café'
    }

    let today = actualCafeInfo.days.find(({date}) => date === now.format('YYYY-MM-DD'))
    if (!today) {
      return 'Closed today'
    } else if (today.status === 'closed') {
      return today.message || 'Closed today'
    }

    return null
  }

  render() {
    if (this.state.loading) {
      return <LoadingView text={sample(this.props.loadingMessage)} />
    }

    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    if (!this.state.cafeMenu || !this.state.cafeInfo) {
      return <NoticeView text='Something went wrong. Email odt@stolaf.edu to let them know?' />
    }

    let {cafeId} = this.props
    let {now, cafeMenu, cafeInfo} = this.state

    // We grab the "today" info from here because BonApp returns special
    // messages in this response, like "Closed for Christmas Break"
    let specialMessage = this.findCafeMessage(cafeId, cafeInfo, now)
    if (specialMessage) {
      return <NoticeView text={specialMessage} />
    }

    // We hard-code to the first day returned because we're only requesting one day.
    // `cafes` is a map of cafe ids to cafes, but we only request one at a time.
    let dayparts = cafeMenu.days[0].cafes[cafeId].dayparts
    let mealInfo = findMenu(dayparts, now)
    let mealName = mealInfo ? mealInfo.label : ''
    let stationMenus = mealInfo ? mealInfo.stations : []

    return (
      <FancyMenu
        route={this.props.route}
        navigator={this.props.navigator}
        foodItems={values(cafeMenu.items)}
        menuCorIcons={cafeMenu.cor_icons}
        menuLabel={mealName}
        now={now}
        name={this.props.name}
        stationMenus={stationMenus}
      />
    )
  }
}
