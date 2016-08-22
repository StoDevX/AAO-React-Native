// @flow
/**
 * All About Olaf
 * Bus tab of the transportation page
 */

import React from 'react'
import {
  Text,
  StyleSheet,
  View,
  ListView,
} from 'react-native'
import stops from '../../data/bus-times.json'
import BusLineView from './busLine'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    flexDirection: 'row',
    marginRight: 5,
    marginLeft: 5,
  },
  busLine: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  lineRow: {
    marginTop: 10,
  },
})

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
      <View style={styles.lineRow}>
        <Text style={styles.busLine}> {data.line} </Text>
        <BusLineView schedule={data.schedule} />
      </View>
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
