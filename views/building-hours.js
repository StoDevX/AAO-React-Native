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
    return (
      <View style={styles.container}>
        <BuildingView name={data.name} open={false} imageSource={data.image}/>
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
