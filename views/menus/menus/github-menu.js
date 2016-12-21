// @flow
import React from 'react'
import {View, Text} from 'react-native'
import LoadingView from '../../components/loading'
import {FilteredMenuView} from '../components/filtered-menu'
import {fetchJson} from '../../components/fetch'
import type {TopLevelViewPropsType} from '../../types'
import {TopLevelViewPropTypes} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import {githubMenuBaseUrl} from '../data'
import sample from 'lodash/sample'
import type {
  StationMenuType,
  MenuItemContainerType,
  MasterCorIconMapType,
} from '../types'

export class GithubHostedMenu extends React.Component {
  static propTypes = {
    cafeId: React.PropTypes.string.isRequired,
    loadingMessage: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    ...TopLevelViewPropTypes,
  }

  state: {
    loading: boolean,
    now: momentT,
    stationMenus: ?(StationMenuType[]),
    foodItems: ?MenuItemContainerType,
    corIcons: ?MasterCorIconMapType,
  } = {
    loading: true,
    now: moment.tz(CENTRAL_TZ),
    stationMenus: null,
    foodItems: null,
    corIcons: null,
  }

  componentDidMount() {
    this.fetchData()
  }

  props: TopLevelViewPropsType & {
    cafeId: string,
    loadingMessage: string[],
  }

  fetchData = async () => {
    this.setState({loading: true})

    let stationMenus
    let foodItems
    let corIcons
    try {
      ({stations: stationMenus, items: foodItems, corIcons} = await fetchJson(`${githubMenuBaseUrl}/pause.json`))
    } catch (err) {
      console.warn(err)
    }

    this.setState({loading: false, corIcons, foodItems, stationMenus, now: moment.tz(CENTRAL_TZ)})
  }

  render() {
    if (this.state.loading) {
      let msg = sample(this.props.loadingMessage)
      return <LoadingView text={msg} />
    }

    if (!this.state.stationMenus || !this.state.foodItems || !this.state.corIcons) {
      return (
        <View>
          <Text>Something went wrong. Email odt@stolaf.edu to let them know?</Text>
        </View>
      )
    }

    return (
      <FilteredMenuView
        route={this.props.route}
        navigator={this.props.navigator}
        stationMenus={this.state.stationMenus}
        foodItems={this.state.foodItems}
        menuCorIcons={this.state.corIcons}
        menuLabel='Din-din'
        now={this.state.now}
      />
    )
  }
}
