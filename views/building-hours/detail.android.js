// @flow

import React from 'react'
import {View, Text, StyleSheet} from 'react-native'

import {buildingImages} from './images'
import type {BuildingType, DayOfWeekEnumType} from './types'
import type momentT from 'moment'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

const transparentPixel = require('../../data/images/transparent.png')

import ParallaxView from 'react-native-parallax-view'

import * as c from '../components/colors'
import {
  normalizeBuildingSchedule,
  formatBuildingTimes,
  summarizeDays,
  getShortBuildingStatus,
  isBuildingOpenAtMoment,
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
    marginBottom: 14,
    borderRadius: 5,
    alignSelf: 'center',
  },
  badgeText: {
    color: c.white,
    fontSize: 18,
  },
  scrollableStyle: {
    backgroundColor: c.androidLightBackground,
  },

  schedulesWrapper: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  scheduleContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingBottom: 6,
    backgroundColor: 'white',
    borderRadius: 2,
    elevation: 2,
  },
  scheduleTitleWrapper: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  scheduleTitle: {
    color: 'rgb(113, 113, 118)',
    fontWeight: 'bold',
  },
  scheduleHoursWrapper: {
  },
  scheduleRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  scheduleDays: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 16,
  },
  bold: {
    fontWeight: 'bold',
  },
  scheduleHours: {
    flex: 2,
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
    const dayOfWeek = ((this.state.now.format('dd'): any): DayOfWeekEnumType)

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

          {<View style={styles.schedulesWrapper}>
            {schedules.map(set =>
              <View key={set.title} style={styles.scheduleContainer}>
                <View style={styles.scheduleTitleWrapper}>
                  <Text style={styles.scheduleTitle}>{set.title}</Text>
                </View>

                <View style={styles.scheduleHoursWrapper}>
                  {set.hours.map((schedule, i) => {
                    let isActiveSchedule = schedule.days.includes(dayOfWeek) && isBuildingOpenAtMoment(schedule, this.state.now)

                    return (
                      <View key={i} style={styles.scheduleRow}>
                        <Text style={[styles.scheduleDays, isActiveSchedule ? styles.bold : null]} numberOfLines={1}>
                          {summarizeDays(schedule.days)}
                        </Text>

                        <Text style={[styles.scheduleHours, isActiveSchedule ? styles.bold : null]} numberOfLines={1}>
                          {formatBuildingTimes(schedule, this.state.now)}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}
          </View>}
        </View>
      </ParallaxView>
    )
  }
}
