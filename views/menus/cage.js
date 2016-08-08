import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView
} from 'react-native'
import NavigatorScreen from '../components/navigator-screen'
import MenuSection from './menuSection'

import menu from '../../data/cage-menu.json'

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})

export default class CageMenuView extends React.Component {
  constructor(props) {
    super(props)
    let ds = new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    })
    this.state = {
      dataSource: ds.cloneWithRows(menu)
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.name !== r2.name
  }

  _renderRow(data) {
    return (
      <MenuSection header={data.name} content={data.items} subText={data.subtext} />
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
