// @flow
/**
 * All About Olaf
 * Bus Line list helper
 */

import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
} from 'react-native'
import BusStopView from './busStop'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    flexDirection: 'row',
  },
})

export default class BusLineView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(this.props.schedule)
  }

  _rowHasChanged(r1: busStopType, r2: busStopType) {
    return r1.location !== r2.location
  }

  _renderRow(data: busStopType) {
    return (
      <BusStopView location={data.location} times={data.times} />
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
