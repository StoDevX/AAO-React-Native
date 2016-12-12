// @flow
import React from 'react'
import {View, Text} from 'react-native'
import LoadingView from '../../components/loading'
import {BonAppMenuView} from './bonapp'
import type {TopLevelViewPropsType} from '../../types'
import {TopLevelViewPropTypes} from '../../types'
import type momentT from 'moment'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import {bonappMenuBaseUrl, bonappCafeBaseUrl} from '../data'
import sample from 'lodash/sample'
import type {BonAppMenuInfoType, BonAppCafeInfoType} from '../types'
import {fetchJson} from './fetch'


export class RemoteMenuView extends React.Component {
  static propTypes = {
    cafeId: React.PropTypes.string.isRequired,
    loadingMessage: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    ...TopLevelViewPropTypes,
  }

  state: {
    loading: boolean,
    now: momentT,
    cafeInfo: ?BonAppCafeInfoType,
    cafeMenu: ?BonAppMenuInfoType,
  } = {
    loading: true,
    now: moment.tz(CENTRAL_TZ),
    cafeMenu: null,
    cafeInfo: null,
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

    let requests = await Promise.all([
      fetchJson(bonappMenuBaseUrl, {cafe: this.props.cafeId}),
      fetchJson(bonappCafeBaseUrl, {cafe: this.props.cafeId}),
    ])

    let [
      cafeMenu: BonAppMenuInfoType,
      cafeInfo: BonAppCafeInfoType,
    ] = requests

    this.setState({loading: false, cafeMenu, cafeInfo, now: moment.tz(CENTRAL_TZ)})
  }

  render() {
    if (this.state.loading) {
      let msg = sample(this.props.loadingMessage)
      return <LoadingView text={msg} />
    }

    if (!this.state.cafeMenu || !this.state.cafeInfo) {
      return (
        <View>
          <Text>Something went wrong. Email odt@stolaf.edu to let them know?</Text>
        </View>
      )
    }

    return (
      <BonAppMenuView
        route={this.props.route}
        navigator={this.props.navigator}
        cafeId={this.props.cafeId}
        cafeInfo={this.state.cafeInfo}
        cafeMenu={this.state.cafeMenu}
        now={this.state.now}
      />
    )
  }
}
