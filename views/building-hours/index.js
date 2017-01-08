// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {ListView, RefreshControl, StyleSheet} from 'react-native'
import {BuildingRow} from './row'

import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'
import delay from 'delay'
import {data as buildingHours} from '../../docs/building-hours'
import groupBy from 'lodash/groupBy'
import {ListSeparator, ListSectionHeader} from '../components/list'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
})

export class BuildingHoursView extends React.Component {
  state = {
    dataSource: this.getDataSource(),
    intervalId: 0,
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
    now: moment.tz(CENTRAL_TZ),
    refreshing: false,
  }

  componentWillMount() {
    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 10000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  props: TopLevelViewPropsType;

  getDataSource(){
    return new ListView.DataSource({
      rowHasChanged: (r1: BuildingType, r2: BuildingType) => r1 !== r2,
      sectionHeaderHasChanged: (r1: any, r2: any) => r1 !== r2,
    }).cloneWithRowsAndSections(groupBy(buildingHours, b => b.category || 'Other'))
  }

  updateTime = () => {
    this.setState({
      now: moment.tz(CENTRAL_TZ),
      dataSource: this.getDataSource(),
    })
  }

  renderRow = (data: BuildingType) => {
    return (
      <BuildingRow
        name={data.name}
        info={data}
        now={this.state.now}
        onPress={() => this.props.navigator.push({
          index: this.props.route.index + 1,
          id: 'BuildingHoursDetailView',
          title: data.name,
          backButtonTitle: 'Hours',
          props: data,
        })}
      />
    )
  }

  renderSectionHeader = (data: any, id: string) => {
    return <ListSectionHeader style={styles.rowSectionHeader} title={id} />
  }

  renderSeparator = (sectionID: any, rowID: any) => {
    return <ListSeparator key={`${sectionID}-${rowID}`} />
  }

  refresh = async () => {
    this.setState({refreshing: true})
    await delay(500)
    this.setState({
      now: moment.tz(CENTRAL_TZ),
      refreshing: false,
      dataSource: this.getDataSource(),
    })
  }

  // Render a given scene
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
            refreshing={this.state.refreshing}
            onRefresh={this.refresh}
          />
        }
      />
    )
  }
}
