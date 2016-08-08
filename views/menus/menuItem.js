/**
 * All About Olaf
 * A list of the items availiable from a single menuSection
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView
} from 'react-native'
import NavigatorScreen from '../components/navigator-screen'

var styles = StyleSheet.create({
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
  }
})

export default class CageMenuView extends React.Component {
  constructor(props) {
    super(props)

    let ds = new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    })
    this.state = {
      dataSource: ds.cloneWithRows(this.props.items)
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.name !== r2.name
  }

  _renderRow(data) {
    return (
      <View style={styles.container}>
        <Text style={styles.name}>{data.name}</Text><Text style={styles.price}>{data.price}</Text>
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
