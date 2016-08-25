// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {
  StyleSheet,
  ListView,
} from 'react-native'

import BuildingView from './building'
import {isBuildingOpen} from './is-building-open'

import type {BuildingInfoType} from './types'
import hoursData from '../../data/building-hours.json'

const buildingImages = {
  pausekitchen: require('../../data/images/buildinghours/pausekitchen.small.jpeg'),
  bookstore: require('../../data/images/buildinghours/bookstore.small.jpeg'),
  convenience: require('../../data/images/buildinghours/convenience.small.jpeg'),
  postoffice: require('../../data/images/buildinghours/postoffice.small.jpeg'),
  rolvaag: require('../../data/images/buildinghours/rolvaag.small.jpeg'),
  halvorson: require('../../data/images/buildinghours/halvorson.small.jpeg'),
  skoglund: require('../../data/images/buildinghours/skoglund.small.jpeg'),
  cage: require('../../data/images/buildinghours/cage.small.jpeg'),
  stav: require('../../data/images/buildinghours/stav.small.jpeg'),
  disco: require('../../data/images/buildinghours/disco.small.jpeg'),
}


export default class BuildingHoursView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(hoursData),
  }

  _rowHasChanged(r1: BuildingInfoType, r2: BuildingInfoType) {
    return r1.name !== r2.name
  }

  _renderRow(data: BuildingInfoType) {
    let isOpen = isBuildingOpen(data)
    return (
      <BuildingView
        style={styles.container}
        name={data.name}
        open={isOpen}
        image={buildingImages[data.image]}
      />
    )
  }

  // Render a given scene
  render() {
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this._renderRow.bind(this)}
        contentContainerStyle={styles.container}
        pageSize={4}
        initialListSize={6}
      />
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
