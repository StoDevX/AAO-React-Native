// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {ListView, RefreshControl, StyleSheet, Platform} from 'react-native'
import {BuildingRow} from './row'
import {NoticeView} from '../components/notice'
import {tracker} from '../../analytics'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'
import {data as fallbackBuildingHours} from '../../docs/building-hours'
import groupBy from 'lodash/groupBy'

import * as c from '../components/colors'
import {ListSeparator, ListSectionHeader} from '../components/list'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

export {BuildingHoursDetailView} from './detail'

const githubBaseUrl = 'https://stodevx.github.io/AAO-React-Native'

const styles = StyleSheet.create({
  container: {
    backgroundColor: c.white,
  },
})

const groupBuildings = (buildings: BuildingType[]) => groupBy(buildings, b => b.category || 'Other')

type BuildingHoursPropsType = TopLevelViewPropsType & {
  now: momentT,
  loading: boolean,
  onRefresh: () => any,
  buildings: {[key: string]: BuildingType[]},
};

class BuildingHoursList extends React.Component {
  state = {
    dataSource: this.getDataSource(this.props),
  }

  componentWillMount() {
    this.setState({dataSource: this.getDataSource(this.props)})
  }

  componentWillReceiveProps(nextProps: BuildingHoursPropsType) {
    this.setState({dataSource: this.getDataSource(nextProps)})
  }

  props: BuildingHoursPropsType;

  getDataSource(props: BuildingHoursPropsType) {
    return new ListView.DataSource({
      rowHasChanged: (r1: BuildingType, r2: BuildingType) => r1 !== r2,
      sectionHeaderHasChanged: (r1: any, r2: any) => r1 !== r2,
    }).cloneWithRowsAndSections(props.buildings)
  }

  onPressRow = (data: BuildingType) => {
    tracker.trackEvent('building-hours', data.name)
    this.props.navigator.push({
      id: 'BuildingHoursDetailView',
      index: this.props.route.index + 1,
      title: data.name,
      backButtonTitle: 'Hours',
      props: data,
      sceneConfig: Platform.OS === 'android' ? 'fromBottom' : undefined,
    })
  }

  renderRow = (data: BuildingType) => {
    return (
      <BuildingRow
        name={data.name}
        info={data}
        now={this.props.now}
        onPress={() => this.onPressRow(data)}
      />
    )
  }

  renderSectionHeader = (data: any, id: string) => {
    return <ListSectionHeader style={styles.rowSectionHeader} title={id} />
  }

  renderSeparator = (sectionID: any, rowID: any) => {
    return <ListSeparator key={`${sectionID}-${rowID}`} />
  }

  render() {
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        contentContainerStyle={styles.container}
        removeClippedSubviews={false}  // remove after https://github.com/facebook/react-native/issues/8607#issuecomment-241715202
        refreshControl={
          <RefreshControl
            refreshing={this.props.loading}
            onRefresh={this.props.onRefresh}
          />
        }
      />
    )
  }
}


export class BuildingHoursView extends React.Component {
  state: {
    error: ?Error,
    loading: boolean,
    now: momentT,
    buildings: {[key: string]: BuildingType[]},
    intervalId: number,
  } = {
    error: null,
    loading: true,
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
    now: moment.tz(CENTRAL_TZ),
    buildings: groupBuildings(fallbackBuildingHours),
    intervalId: 0,
  }

  componentWillMount() {
    this.fetchData()

    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 10000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  props: TopLevelViewPropsType;

  updateTime = () => {
    this.setState({now: moment.tz(CENTRAL_TZ)})
  }

  fetchData = async () => {
    this.setState({loading: true})

    let buildings: BuildingType[] = []
    try {
      let container = await fetchJson(`${githubBaseUrl}/building-hours.json`)
      let data = container.data
      buildings = data
    } catch (err) {
      tracker.trackException(err.message)
      console.warn(err)
      buildings = fallbackBuildingHours
    }

    if (__DEV__) {
      buildings = fallbackBuildingHours
    }

    this.setState({
      loading: false,
      buildings: groupBuildings(buildings),
      now: moment.tz(CENTRAL_TZ),
    })
  }

  render() {
    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    return (
      <BuildingHoursList
        route={this.props.route}
        navigator={this.props.navigator}
        buildings={this.state.buildings}
        now={this.state.now}
        onRefresh={this.fetchData}
        loading={this.state.loading}
      />
    )
  }
}
