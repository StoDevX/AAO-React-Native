// @flow
import React from 'react'
import LoadingView from '../components/loading'
import {FancyMenu} from './components/fancy-menu'
import {fetchJson} from '../components/fetch'
import type {TopLevelViewPropsType} from '../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import sample from 'lodash/sample'
import type {MenuItemType, MasterCorIconMapType} from './types'

const githubMenuBaseUrl = 'https://stodevx.github.io/AAO-React-Native/menus'

export class GitHubHostedMenu extends React.Component {
  state: {
    loading: boolean,
    now: momentT,
    foodItems: MenuItemType[],
    corIcons: MasterCorIconMapType,
  } = {
    loading: true,
    now: moment.tz(CENTRAL_TZ),
    foodItems: [],
    corIcons: {},
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
