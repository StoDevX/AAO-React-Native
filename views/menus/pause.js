import React from 'react'
import {
  View,
  StyleSheet,
  ListView,
} from 'react-native'

import MenuSection from './menuSection'
import menu from '../../data/pause-menu.json'
import type {MenuSectionType} from './types'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    flexDirection: 'row',
  },
})



export default class PauseMenuView extends React.Component{
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(menu),
  }

  _rowHasChanged(r1: MenuSectionType, r2: MenuSectionType) {
    return r1.name !== r2.name
  }

  _renderRow(data: MenuSectionType) {
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
