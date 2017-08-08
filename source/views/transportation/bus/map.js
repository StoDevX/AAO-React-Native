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

import {data as defaultBusLines} from '../../../../docs/bus-times.json'

const TIMEZONE = 'America/Winnipeg'

const styles = StyleSheet.create({
  map: {...StyleSheet.absoluteFillObject},
})

export class BusMapView extends React.PureComponent {
  static navigationOptions = ({navigation}) => ({
    title: `${navigation.state.params.line} Map`,
  })

  static defaultProps = {
    busLines: defaultBusLines,
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
    this.setState(() => ({intervalId: setInterval(this.updateTime, 5000)}))
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  props: TopLevelViewPropsType & {
    busLines: BusLineType[],
    navigation: {
      state: {
        params: {
          line: string,
        },
      },
    },
  }

  onRegionChangeComplete = (region: {
    latitude: number,
    latitudeDelta: number,
    longitude: number,
    longitudeDelta: number,
  }) => {
    this.setState(state => {
      const initialRegion = state.initialRegion

      if (initialRegion && isEqual(initialRegion, region)) {
        return state
      }

      return {initialRegion: region}
    })
  }

  updateTime = () => {
    this.setState(() => ({now: moment.tz(TIMEZONE)}))
  }

  render() {
    let {now} = this.state
    // now = moment.tz('Fri 8:13pm', 'ddd h:mma', true, TIMEZONE)
    const busLines = this.props.busLines
    const lineToDisplay = this.props.navigation.state.params.line
    const activeBusLine = busLines.find(({line}) => line === lineToDisplay)

    if (!activeBusLine) {
      const lines = busLines.map(({line}) => line).join(', ')
      const notice = `The line "${lineToDisplay}" was not found among ${lines}`
      return <NoticeView text={notice} />
    }

    const schedule = getScheduleForNow(activeBusLine.schedules, now)
    if (!schedule) {
      const notice = `No schedule was found for today, ${now.format('dddd')}`
      return <NoticeView text={notice} />
    }

    const coords = schedule.coordinates || []
    if (!coords.length) {
      const notice = `No coordinates have been provided for today's (${now.format(
        'dddd',
      )}) schedule on the "${lineToDisplay}" line`
      return <NoticeView text={notice} />
    }

    const markers = uniqBy(
      zip(coords, schedule.stops),
      ([[lat, lng]]) => `${lat},${lng}`,
    )

    return (
      <MapView
        region={this.state.initialRegion}
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
