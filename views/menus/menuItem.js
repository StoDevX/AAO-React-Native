// @flow
/**
 * All About Olaf
 * A list of the items availiable from a single menuSection
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView,
} from 'react-native'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: 5,
    marginRight: 5,
  },
  name: {
    textAlign: 'left',
  },
  price: {
    textAlign: 'right',
  },
})

import type {MenuItemType} from './types'

export default class CageMenuView extends React.Component {
  static propTypes = {
    items: React.PropTypes.arrayOf(React.PropTypes.object),
  }

  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(this.props.items),
  }

  _rowHasChanged(r1: MenuItemType, r2: MenuItemType) {
    return r1.name !== r2.name
  }

  _renderRow(data: MenuItemType) {
    return (
      <View style={styles.container}>
        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.price}>{data.price}</Text>
      </View>
    )
  }

  render() {
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
