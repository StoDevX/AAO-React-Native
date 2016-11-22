// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {ListView, RefreshControl} from 'react-native'
import {BuildingView} from './building'

import delay from 'delay'
import type {BuildingInfoType} from './types'
import hoursData from '../../data/building-hours.json'
(hoursData: BuildingInfoType[])

const buildingImages = {
  'alumni-hall': require('../../data/images/buildinghours/w1440/alumni-hall.jpg'),
  'boe': require('../../data/images/buildinghours/w1440/boe.jpg'),
  'bookstore': require('../../data/images/buildinghours/w1440/bookstore.jpg'),
  'buntrock': require('../../data/images/buildinghours/w1440/buntrock.jpg'),
  'cage': require('../../data/images/buildinghours/w1440/cage.jpg'),
  'christiansen': require('../../data/images/buildinghours/w1440/christiansen.jpg'),
  'convenience': require('../../data/images/buildinghours/w1440/convenience.jpg'),
  'disco': require('../../data/images/buildinghours/w1440/disco.jpg'),
  'dittmann': require('../../data/images/buildinghours/w1440/dittmann.jpg'),
  'hall-of-music': require('../../data/images/buildinghours/w1440/hall-of-music.jpg'),
  'halvorson': require('../../data/images/buildinghours/w1440/halvorson.jpg'),
  'old-main': require('../../data/images/buildinghours/w1440/old-main.jpg'),
  'pause-kitchen': require('../../data/images/buildinghours/w1440/pause-kitchen.jpg'),
  'post-office': require('../../data/images/buildinghours/w1440/post-office.jpg'),
  'regents-hall': require('../../data/images/buildinghours/w1440/regents-hall.jpg'),
  'regents-math': require('../../data/images/buildinghours/w1440/regents-math.jpg'),
  'rolvaag-library': require('../../data/images/buildinghours/w1440/rolvaag-library.jpg'),
  'skifter-studioa': require('../../data/images/buildinghours/w1440/skifter-studioa.jpg'),
  'skoglund': require('../../data/images/buildinghours/w1440/skoglund.jpg'),
  'stav': require('../../data/images/buildinghours/w1440/stav.jpg'),
  'theater': require('../../data/images/buildinghours/w1440/theater.jpg'),
  'tom-porter': require('../../data/images/buildinghours/w1440/tom-porter.jpg'),
  'tomson': require('../../data/images/buildinghours/w1440/tomson.jpg'),
}

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'



export default class BuildingHoursView extends React.Component {
  state = {
    dataSource: this.getDataSource(),
    intervalId: 0,
    now: moment.tz(CENTRAL_TZ),
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

  getDataSource(){
    return new ListView.DataSource({
      rowHasChanged: (r1: BuildingInfoType, r2: BuildingInfoType) => r1.name !== r2.name,
    }).cloneWithRows(hoursData)
  }

  updateTime = () => {
    this.setState({now: moment.tz(CENTRAL_TZ), dataSource: this.getDataSource()})
  }

  _renderRow = (data: BuildingInfoType) => {
    return (
      <BuildingView
        name={data.name}
        info={data}
        image={buildingImages[data.image]}
        now={this.state.now}
      />
    )
  }

  refresh = async () => {
    this.setState({refreshing: true})
    await delay(500)
    this.setState({now: moment.tz(CENTRAL_TZ), refreshing: false,
      dataSource: this.getDataSource(),
    })
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
