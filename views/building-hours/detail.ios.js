// @flow

import React from 'react'
import {View, Text, StyleSheet} from 'react-native'

import {buildingImages} from './images'
import type {BuildingType} from './types'
import type momentT from 'moment'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

const transparentPixel = require('../../data/images/transparent.png')

import {TableView, Section, Cell} from 'react-native-tableview-simple'
import ParallaxView from 'react-native-parallax-view'

import * as c from '../components/colors'
import {
  normalizeBuildingSchedule,
  formatStatusOfBuildingAtMoment,
  summarizeDays,
  getShortBuildingStatus,
} from './building-hours-helpers'

const styles = StyleSheet.create({
  inner: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  name: {
    textAlign: 'center',
    color: 'black',
    fontSize: 32,
    fontWeight: '300',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 5,
    alignSelf: 'center',
  },
  badgeText: {
    color: c.white,
    fontSize: 18,
  },
  scrollableStyle: {
    backgroundColor: c.iosLightBackground,
  },
})

export class BuildingHoursDetailView extends React.Component {
  state: {intervalId: number, now: momentT} = {
    intervalId: 0,
    now: moment.tz(CENTRAL_TZ),
  }

  componentWillMount() {
    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 10000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  props: BuildingType;

  updateTime = () => {
    this.setState({now: moment.tz(CENTRAL_TZ)})
  }

  render() {
    const bgColors = {
      'Open': c.moneyGreen,
      'Closed': c.salmon,
    }

    const headerImage = this.props.image
      ? buildingImages[this.props.image]
      : transparentPixel
    const openStatus = getShortBuildingStatus(this.props, this.state.now)
    const schedules = normalizeBuildingSchedule(this.props, this.state.now)

    return (
      <ParallaxView
        backgroundSource={headerImage}
        windowHeight={100}
        scrollableViewStyle={styles.scrollableStyle}
      >
        <View style={{flex: 1}}>
          <View style={styles.inner}>
            <Text style={styles.name}>{this.props.name}</Text>
          </View>

          <View style={[styles.badge, {backgroundColor: bgColors[openStatus] || c.goldenrod}]}>
            <Text style={styles.badgeText}>{openStatus}</Text>
          </View>

          {<TableView>
            {schedules.map(set =>
              <Section key={set.title} header={set.title}>
                {set.hours.map((schedule, i) =>
                  <Cell
                    key={i}
                    cellStyle='LeftDetail'
                    title={formatStatusOfBuildingAtMoment(schedule, this.state.now)}
                    detail={summarizeDays(schedule.days)}
                  />
                )}
              </Section>
            )}
          </TableView>}
        </View>
      </ParallaxView>
    )
  }
}
