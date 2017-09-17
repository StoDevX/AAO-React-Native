// @flow

import React from 'react'
import {StyleSheet} from 'react-native'
import type {BusLineType} from './types'
import MapView from 'react-native-maps'
import moment from 'moment-timezone'
import {NoticeView} from '../../components/notice'
import type {TopLevelViewPropsType} from '../../types'
import {getScheduleForNow} from './lib'
import zip from 'lodash/zip'
import uniqBy from 'lodash/uniqBy'
import isEqual from 'lodash/isEqual'

const TIMEZONE = 'America/Winnipeg'

const styles = StyleSheet.create({
  map: {...StyleSheet.absoluteFillObject},
})

export class BusMapView extends React.PureComponent {
  static navigationOptions = ({navigation}) => ({
    title: `${navigation.state.params.line.name} Map`,
  })

  props: TopLevelViewPropsType & {
    navigation: {
      state: {
        params: {
          line: BusLineType,
        },
      },
    },
  }

  state = {
    intervalId: 0,
    now: moment.tz(TIMEZONE),
    region: {
      latitude: 44.44946671480875,
      latitudeDelta: 0.06175530810822494,
      longitude: -93.17014753996669,
      longitudeDelta: 0.05493163793703104,
    },
  }

  componentWillMount() {
    // This updates the screen every second, so that the "next bus" times are
    // updated without needing to leave and come back.
    this.setState(() => ({intervalId: setInterval(this.updateTime, 1000)}))
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  onRegionChangeComplete = (newRegion: {
    latitude: number,
    latitudeDelta: number,
    longitude: number,
    longitudeDelta: number,
  }) => {
    this.setState(state => {
      if (isEqual(state.region, newRegion)) {
        return
      }

      return {region: newRegion}
    })
  }

  updateTime = () => {
    this.setState(() => ({now: moment.tz(TIMEZONE)}))
  }

  render() {
    let {now} = this.state
    // now = moment.tz('Fri 8:13pm', 'ddd h:mma', true, TIMEZONE)
    const lineToDisplay = this.props.navigation.state.params.line

    const schedule = getScheduleForNow(lineToDisplay.schedules, now)
    if (!schedule) {
      const notice = `No schedule was found for today, ${now.format('dddd')}`
      return <NoticeView text={notice} />
    }

    const coords = schedule.coordinates || []
    if (!coords.length) {
      const today = now.format('dddd')
      return (
        <NoticeView
          text={`No coordinates have been provided for today's (${today}) schedule on the "${lineToDisplay}" line`}
        />
      )
    }

    const markers = uniqBy(
      zip(coords, schedule.stops),
      ([[lat, lng]]) => `${lat},${lng}`,
    )

    return (
      <MapView
        region={this.state.region}
        style={styles.map}
        onRegionChangeComplete={this.onRegionChangeComplete}
        loadingEnabled={true}
      >
        {markers.map(([[latitude, longitude], title], i) =>
          <MapView.Marker
            key={i}
            coordinate={{latitude, longitude}}
            title={title}
            // description={marker.description}
            // TODO: add "next arrival" time as the description
          />,
        )}
      </MapView>
    )
  }
}
