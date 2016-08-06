/**
 * All About Olaf
 * iOS BuildingHours page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
  ListView
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'
import BuildingView from './components/building'

import hoursData from '../data/building-hours.json'

function getDayOfWeek() {
  let d = new Date()
  let dow = d.getDay()
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
      return null // clearly, this should never happen. If it does, there are bigger problems
  }
}

function getCurrentTime() {
  let d = new Date()
  let hours =  d.getHours()
  let min = d.getMinutes()
  if (hours < 10) {
    hours = '0' + hours
  }
  return `${hours}:${min}:00`
}

// TODO: handle buildings that are open beyond midnight
function isBuildingOpen(hoursInfo) {
  let dow = getDayOfWeek()
  let times = hoursInfo.times.hours[dow]
  if (!times) {
    return false
  }
  let [startTime, closeTime] = times
  let currentTime = getCurrentTime()

  // make comparisons
  console.log(hoursInfo.name)
  console.log('startTime:', startTime)
  console.log('currentTime:', currentTime)
  console.log('closeTime:', closeTime)

  if (startTime <= currentTime && currentTime <= closeTime) {
    return true
  }

  return false
}

export default class BuildingHoursView extends React.Component {
  constructor() {
    super()
    let ds = new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    })
    this.state = {
      dataSource: ds.cloneWithRows(hoursData)
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.name !== r2.name
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="Building Hours"
      renderScene={this.renderScene.bind(this)}
    />
  }

  _renderRow(data) {
    let isOpen = isBuildingOpen(data)
    return (
      <View style={styles.container}>
        <BuildingView name={data.name} open={isOpen} imageSource={data.image}/>
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
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
