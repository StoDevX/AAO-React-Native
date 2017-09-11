/**
 * @flow
 *
 * <BuildingDetail/> manages the time that's passed on to the rest of the
 * building.
 */

import React from 'react'
import type {BuildingType} from '../types'
import moment from 'moment-timezone'
import {BuildingDetail} from './building'
import {CENTRAL_TZ} from '../lib'
import type {TopLevelViewPropsType} from '../../types'

export class BuildingHoursDetailView extends React.PureComponent {
  static navigationOptions = ({navigation}) => {
    return {
      title: navigation.state.params.building.name,
    }
  }

  props: TopLevelViewPropsType & {
    navigation: {state: {params: {building: BuildingType}}},
  }

  state: {intervalId: number, now: moment} = {
    intervalId: 0,
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
    now: moment.tz(CENTRAL_TZ),
  }

  componentWillMount() {
    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 1000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  updateTime = () => {
    this.setState(() => ({now: moment.tz(CENTRAL_TZ)}))
  }

  reportProblem = () => {
    this.props.navigation.navigate('BuildingHoursProblemReportView', {
      initialBuilding: this.props.navigation.state.params.building,
    })
  }

  render() {
    const info = this.props.navigation.state.params.building
    const {now} = this.state

    return (
      <BuildingDetail
        info={info}
        now={now}
        onProblemReport={this.reportProblem}
      />
    )
  }
}
