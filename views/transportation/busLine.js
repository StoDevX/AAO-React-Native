// @flow
/**
 * All About Olaf
 * Bus Line list helper
 */

import React from 'react'
import {
  StyleSheet,
  ListView,
} from 'react-native'
import BusStopView from './busStop'
import type {BusStopType} from './types'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
  },
})

export default class BusLineView extends React.Component {
  static propTypes = {
    schedule: React.PropTypes.any,
  }

  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(this.props.schedule),
  }

  _rowHasChanged(r1: BusStopType, r2: BusStopType) {
    return r1.location !== r2.location
  }

  _renderRow(data: BusStopType) {
    return (
      <BusStopView location={data.location} times={data.times} />
    )
  }

  render() {
    return (
      <ListView
        contentContainerStyle={styles.container}
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
      />
    )
  }
}
