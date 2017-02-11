// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {ListView, RefreshControl, StyleSheet, Platform} from 'react-native'
import {BuildingRow} from './row'
import {tracker} from '../../analytics'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'

import * as c from '../components/colors'
import {ListSeparator, ListSectionHeader} from '../components/list'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
  container: {
    backgroundColor: c.white,
  },
})

type BuildingHoursPropsType = TopLevelViewPropsType & {
  now: momentT,
  loading: boolean,
  onRefresh: () => any,
  buildings: {[key: string]: BuildingType[]},
};

export class BuildingHoursList extends React.Component {
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
