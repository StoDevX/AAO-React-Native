// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {ListView, RefreshControl} from 'react-native'
import BuildingView from './building'

import delay from 'delay'
import type {BuildingInfoType} from './types'
import hoursData from '../../data/building-hours.json'

const buildingImages = {
  pause: require('../../data/images/buildinghours/pause.jpg'),
  bookstore: require('../../data/images/buildinghours/bookstore.jpg'),
  convenience: require('../../data/images/buildinghours/convenience.jpg'),
  postoffice: require('../../data/images/buildinghours/postoffice.small.jpeg'),
  rolvaag: require('../../data/images/buildinghours/rolvaag.small.jpeg'),
  halvorson: require('../../data/images/buildinghours/halvorson.small.jpeg'),
  skoglund: require('../../data/images/buildinghours/skoglund.jpg'),
  cage: require('../../data/images/buildinghours/cage.jpg'),
  stav: require('../../data/images/buildinghours/stav.small.jpeg'),
  disco: require('../../data/images/buildinghours/disco.jpg'),
  alumni: require('../../data/images/buildinghours/alumni.jpg'),
  boe: require('../../data/images/buildinghours/boe.jpg'),
  buntrock: require('../../data/images/buildinghours/buntrock.jpg'),
  christiansan: require('../../data/images/buildinghours/christiansan.jpg'),
  dittmann: require('../../data/images/buildinghours/dittmann.jpg'),
  music: require('../../data/images/buildinghours/hall.music.jpg'),
  oldmain: require('../../data/images/buildinghours/oldmain.jpg'),
  porter: require('../../data/images/buildinghours/porter.jpg'),
  regents: require('../../data/images/buildinghours/regents.jpg'),
  math: require('../../data/images/buildinghours/math.jpg'),
  skifter: require('../../data/images/buildinghours/studioa.jpg'),
  theater: require('../../data/images/buildinghours/theater.jpg'),
  tomson: require('../../data/images/buildinghours/tomson.jpg'),
}


export default class BuildingHoursView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1: BuildingInfoType, r2: BuildingInfoType) => r1.name !== r2.name,
    }).cloneWithRows(hoursData),
    intervalId: 0,
    now: Date.now(),
    refreshing: false,
  }

  componentWillMount() {
    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 10000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  updateTime = () => {
    this.setState({now: Date.now()})
  }

  _renderRow = (data: BuildingInfoType) => {
    return (
      <BuildingView
        name={data.name}
        info={data}
        image={buildingImages[data.image]}
      />
    )
  }

  refresh = async () => {
    this.setState({refreshing: true})
    await delay(500)
    this.setState({now: Date.now()})
    this.setState({refreshing: false})
  }

  // Render a given scene
  render() {
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this._renderRow.bind(this)}
        pageSize={4}
        initialListSize={6}
        removeClippedSubviews={false}  // remove after https://github.com/facebook/react-native/issues/8607#issuecomment-241715202
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.refresh}
          />
        }
      />
    )
  }
}
