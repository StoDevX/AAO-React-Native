// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
} from 'react-native'

import BuildingView from './components/building'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'HH:mm:ss'

import hoursData from '../data/building-hours.json'

const buildingImages = {
  pausekitchen: require('../data/images/buildinghours/pausekitchen.jpeg'),
  bookstore: require('../data/images/buildinghours/bookstore.jpeg'),
  convenience: require('../data/images/buildinghours/convenience.jpeg'),
  postoffice: require('../data/images/buildinghours/postoffice.jpeg'),
  rolvaag: require('../data/images/buildinghours/rolvaag.jpeg'),
  halvorson: require('../data/images/buildinghours/halvorson.jpeg'),
  skoglund: require('../data/images/buildinghours/skoglund.jpeg'),
  cage: require('../data/images/buildinghours/cage.jpeg'),
  stav: require('../data/images/buildinghours/stav.jpeg'),
  disco: require('../data/images/buildinghours/disco.jpeg'),
}


function isBuildingOpen(hoursInfo: BuildingInfoType): BuildingStatusType {
  let dayOfWeek = moment.tz(CENTRAL_TZ).format('ddd')
  let times = hoursInfo.times.hours[dayOfWeek]
  if (!times) {
    return 'closed'
  }

  let [startTime, closeTime, options={nextDay: false}] = times
  startTime = moment.tz(startTime, TIME_FORMAT, true, CENTRAL_TZ)
  closeTime = moment.tz(closeTime, TIME_FORMAT, true, CENTRAL_TZ)
  let currentTime = moment()

  if (options.nextDay) {
    closeTime.add(1, 'day')
  }

  if (currentTime.isBetween(startTime, closeTime)) {
    if (currentTime.clone().add(30, 'min').isAfter(closeTime)) {
      return 'almostClosed'
    }
    return 'open'
  }
  return 'closed'
}

export type BuildingStatusType = 'closed'|'almostClosed'|'open';
type DayOfWeekType = 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun';
type BuildingInfoType = {
  name: string,
  image: string,
  times: {
    hours: {
      [key: DayOfWeekType]: [string, string, ?{nextDay: boolean}],
    },
  },
};

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
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)}
        />
      </View>
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
