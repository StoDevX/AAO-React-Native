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

   getDayOfWeek() {
    var d = new Date();
    var dow = d.getDay();
    switch (dow) {
      case 1:
        return "Mon"
        break;
      case 2:
        return "Tue"
        break;
      case 3:
        return "Wed"
        break;
      case 4:
        return "Thu"
        break;
      case 5:
        return "Fri"
        break;
      case 6:
        return "Sat"
        break;
      case 7:
        return "Sun"
        break;
      default:
        return null; // clearly, this should never happen. If it does, there are bigger problems
        break;
    }
  }

  getCurrentTime() {
    var d = new Date();
    var hours =  d.getHours();
    var min = d.getMinutes();
    if (hours < 10) {
      hours = "0" + hours;
    }
    return hours + ":" + min + ":00";
  }

  // TODO: handle buildings that are open beyond midnight
  isBuildingOpen(hoursInfo) {
    var dow = this.getDayOfWeek();
    var times = hoursInfo.times.hours[dow];
    var startTime = times[0];
    var closeTime = times[1];
    var currentTime = this.getCurrentTime();

    // make comparisons
    console.log(hoursInfo.name);
    console.log("startTime: " + startTime);
    console.log("currentTime: " + currentTime);
    console.log("closeTime: " + closeTime);

    if (startTime <= currentTime && currentTime <= closeTime) {
      return true;
    } else {
      return false;
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
    var isOpen = this.isBuildingOpen(data);
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

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
