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
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'HH:mm:ss'

import hoursData from '../data/building-hours.json'


// TODO: handle buildings that are open beyond midnight
function isBuildingOpen(hoursInfo: BuildingInfoType): BuildingStatusType {
  let dayOfWeek = moment.tz(CENTRAL_TZ).format('ddd')
  let times = hoursInfo.times.hours[dayOfWeek]
  if (!times) {
    return 'closed'
  }

  let [startTime, closeTime] = times
  startTime = moment(startTime, TIME_FORMAT, true).tz(CENTRAL_TZ)
  closeTime = moment(closeTime, TIME_FORMAT, true).tz(CENTRAL_TZ)
  let currentTime = moment()

  // Arbitrary date to satasfy the JS Date.parse() function
  if (currentTime.isBetween(startTime, closeTime)) {
    if (currentTime.clone().add(30, 'min').isAfter(closeTime)) {
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
