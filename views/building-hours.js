// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'
import BuildingView from './components/building'

import hoursData from '../data/building-hours.json'

function getDayOfWeek(): DayOfWeekType {
  let dow = new Date().getDay()
  switch (dow) {
    case 1:
      return 'Mon'
    case 2:
      return 'Tue'
    case 3:
      return 'Wed'
    case 4:
      return 'Thu'
    case 5:
      return 'Fri'
    case 6:
      return 'Sat'
    case 7:
      return 'Sun'
    default:
      // clearly, this should never happen. If it does, there are bigger problems
      throw new TypeError(`${dow} is not a day of the week between 1 and 7!`)
  }
}

function getCurrentTime(): string {
  let d = new Date()
  let hours =  d.getHours()
  let min = d.getMinutes()
  if (hours < 10) {
    hours = '0' + hours
  }
  return `${hours}:${min}:00`
}

// TODO: handle buildings that are open beyond midnight
function isBuildingOpen(hoursInfo: BuildingInfoType): BuildingStatusType {
  let dow = getDayOfWeek()
  let times = hoursInfo.times.hours[dow]
  if (!times) {
    return 'closed'
  }

  let [startTime, closeTime] = times
  let currentTime = getCurrentTime()

  // Arbitrary date to satasfy the JS Date.parse() function
  if (Date.parse('01/01/2016 ' + startTime) < Date.parse('01/01/2016 ' + currentTime) && Date.parse('01/01/2016 ' + currentTime) < Date.parse('01/01/2016 ' + closeTime)) {
    if (Date.parse('01/01/2016 ' + closeTime) - Date.parse('01/01/2016 ' + currentTime) < 1800000) { // 1800000 is 30 min in ms
      return 'almostClosed'
    }
    return 'open'
  }
  return 'closed'
}

export type BuildingStatusType = 'closed'|'almostClosed'|'open';
type DayOfWeekType = 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun';
type BuildingInfoType = {
  name: string,
  image: string,
  times: {
    hours: {
      [key: DayOfWeekType]: [string, string],
    },
  },
};

export default class BuildingHoursView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(hoursData),
  }

  _rowHasChanged(r1: BuildingInfoType, r2: BuildingInfoType) {
    return r1.name !== r2.name
  }

  _renderRow(data: BuildingInfoType) {
    let isOpen = isBuildingOpen(data)
    return (
      <View style={styles.container}>
        <BuildingView name={data.name} open={isOpen} imageSource={data.image} />
      </View>
    )
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)}
        />
      </View>
    )
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='Building Hours'
      renderScene={this.renderScene.bind(this)}
    />
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
