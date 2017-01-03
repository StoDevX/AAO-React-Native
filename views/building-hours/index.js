// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {View, Text, ListView, RefreshControl, StyleSheet, TouchableHighlight, TouchableNativeFeedback, Platform, Navigator} from 'react-native'
import {BuildingRow} from './row'

import type {BuildingType} from './types'
import delay from 'delay'
import {data as buildingHours} from '../../docs/building-hours'
import {Separator} from '../components/separator'
import groupBy from 'lodash/groupBy'
const Touchable = Platform.OS === 'ios' ? TouchableHighlight : TouchableNativeFeedback

import * as c from '../components/colors'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

export {BuildingHoursDetailView} from './detail'

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

  props: {
    navigator: any,
    route: any,
  }

  getDataSource(){
    return new ListView.DataSource({
      rowHasChanged: (r1: BuildingType, r2: BuildingType) => r1.name !== r2.name,
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
      <Touchable
        underlayColor='#ebebeb'
        onPress={() => this.props.navigator.push({
          id: 'BuildingHoursDetailView',
          index: this.props.route.index + 1,
          title: data.name,
          backButtonTitle: 'Hours',
          props: data,
          sceneConfig: Platform.OS === 'android' ? Navigator.SceneConfigs.FloatFromBottom : undefined,
        })}
        // this child <View> is required; the Touchable needs a View as its direct child.
      >
        <View>
          <BuildingRow
            name={data.name}
            info={data}
            now={this.state.now}
            style={styles.row}
          />
        </View>
      </Touchable>
    )
  }

  renderSectionHeader = (data: any, id: string) => {
    return (
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>{id}</Text>
      </View>
    )
  }

  renderSeparator = (sectionID: any, rowID: any) => {
    if (Platform.OS === 'android') {
      return null
    }
    return <Separator key={`${sectionID}-${rowID}`} style={styles.separator} />
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


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  separator: {
    marginLeft: 15,
  },
  row: {
    paddingLeft: 15,
    paddingRight: Platform.OS === 'ios' ? 6 : 15,
  },

  rowSectionHeader: {
    backgroundColor: Platform.OS === 'ios' ? c.iosListSectionHeader : 'white',
    paddingTop: Platform.OS === 'ios' ? 5 : 10,
    paddingBottom: Platform.OS === 'ios' ? 5 : 15,
    paddingLeft: 15,
    borderTopWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderColor: '#c8c7cc',
  },
  rowSectionHeaderText: {
    color: 'rgb(113, 113, 118)',
    fontWeight: Platform.OS === 'ios' ? 'normal' : '500',
  },
})
