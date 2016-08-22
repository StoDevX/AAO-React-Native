// @flow
import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  ListView,
} from 'react-native'
import moment from 'moment-timezone'
import stops from '../../data/bus-times.json'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    flexDirection: 'row',
  },
})

function getNextStopTime(times) {
  // for (let time of times) {
  //   let currentTime = moment()
  //   let stopTime = moment(currentTime.get('date') + time)
  //   if (stopTime.isAfter(currentTime)) {
  //     return time
  //   }
  // }
  return 'None'
}

export default class BusView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(stops),
  }

  _rowHasChanged(r1: busStopType, r2: busStopType) {
    return r1.location !== r2.location
  }

  _renderRow(data: busStopType) {
    return (
      <Text>{data.location} {getNextStopTime(data.times)}</Text>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)} />
      </View>
    )
  }
}
