// @flow
import React from 'react'
import LoadingView from '../components/loading'
import {NoticeView} from '../components/notice'
import {FancyMenu} from './components/fancy-menu'
import {fetchJson} from '../components/fetch'
import type {TopLevelViewPropsType} from '../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import sample from 'lodash/sample'
import type {MenuItemContainerType, MasterCorIconMapType} from './types'

const githubMenuBaseUrl = 'https://stodevx.github.io/AAO-React-Native/menus'

export class GithubHostedMenu extends React.Component {
  state: {
    loading: boolean,
    now: momentT,
    foodItems: ?MenuItemContainerType,
    corIcons: ?MasterCorIconMapType,
  } = {
    loading: true,
    now: moment.tz(CENTRAL_TZ),
    foodItems: null,
    corIcons: null,
  }

  componentWillMount() {
    this.fetchData()
  }

  props: TopLevelViewPropsType & {
    cafeId: string,
    loadingMessage: string[],
  }

  fetchData = async () => {
    this.setState({loading: true})

    let foodItems
    let corIcons
    try {
      ({items: foodItems, corIcons} = await fetchJson(`${githubMenuBaseUrl}/pause.json`))
    } catch (err) {
      console.warn(err)
    }

    this.setState({loading: false, corIcons, foodItems, now: moment.tz(CENTRAL_TZ)})
  }

  render() {
    if (this.state.loading) {
      let msg = sample(this.props.loadingMessage)
      return <LoadingView text={msg} />
    }

    if (!this.state.foodItems || !this.state.corIcons) {
      return <NoticeView text='Something went wrong. Email odt@stolaf.edu to let them know?' />
    }

    return (
      <FancyMenu
        route={this.props.route}
        navigator={this.props.navigator}
        foodItems={this.state.foodItems}
        menuCorIcons={this.state.corIcons}
        menuLabel='Din-din'
        now={this.state.now}
      />
    )
  }
}
