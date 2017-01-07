// @flow
import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {buildingImages} from '../../images/building-images'
import type {SingleBuildingScheduleType, BuildingType, DayOfWeekEnumType} from './types'
import type momentT from 'moment'
import {Card} from '../components/card'
import ParallaxView from 'react-native-parallax-view'
import moment from 'moment-timezone'
import * as c from '../components/colors'
import {
  normalizeBuildingSchedule,
  formatBuildingTimes,
  summarizeDays,
  getShortBuildingStatus,
  isBuildingOpenAtMoment,
} from './building-hours-helpers'

const transparentPixel = require('../../images/transparent.png')

const CENTRAL_TZ = 'America/Winnipeg'

const styles = StyleSheet.create({
  title: {
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  name: {
    textAlign: 'center',
    color: 'black',
    fontSize: 32,
    fontWeight: '300',
  },
  subtitle: {
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  subtitleText: {
    fontSize: 18,
  },
  badge: {
    marginTop: 20,
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

  scheduleContainer: {
    marginBottom: 20,
  },

  bold: {
    fontWeight: 'bold',
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
  scheduleHours: {
    flex: 2,
  },
  scheduleNotes: {
    paddingTop: 6,
    paddingBottom: 2,
  },
})

export class BuildingHoursDetailView extends React.Component {
  state: {intervalId: number, now: momentT} = {
    intervalId: 0,
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
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

    const abbr = this.props.abbreviation ? <Text style={styles.abbr}> ({this.props.abbreviation})</Text> : null
    const title = <Text style={styles.name}>{this.props.name}{abbr}</Text>
    const subtitle = this.props.subtitle
      ? <View style={styles.subtitle}>
        <Text style={[styles.name, styles.subtitleText]}>{this.props.subtitle}</Text>
      </View>
      : null

    return (
      <ParallaxView
        backgroundSource={headerImage}
        windowHeight={100}
        scrollableViewStyle={styles.scrollableStyle}
      >
        <View style={{flex: 1}}>
          <View style={styles.title}>{title}</View>
          {subtitle}

          <View style={[styles.badge, {backgroundColor: bgColors[openStatus] || c.goldenrod}]}>
            <Text style={styles.badgeText}>{openStatus}</Text>
          </View>

          {schedules.map(set =>
            <Card key={set.title} style={styles.scheduleContainer} header={set.title} footer={set.notes}>
              <View style={styles.scheduleHoursWrapper}>
                {set.hours.map((schedule, i) =>
                  <ScheduleRow
                    key={i}
                    now={this.state.now}
                    schedule={schedule}
                    isActive={set.isPhysicallyOpen !== false && schedule.days.includes(dayOfWeek) && isBuildingOpenAtMoment(schedule, this.state.now)}
                  />)}
              </View>
            </Card>
          )}
        </View>
      </ParallaxView>
    )
  }
}


const ScheduleRow = ({schedule, isActive, now}: {schedule: SingleBuildingScheduleType, isActive: boolean, now: momentT}) => {
  return (
    <View style={styles.scheduleRow}>
      <Text style={[styles.scheduleDays, isActive && styles.bold]} numberOfLines={1}>
        {summarizeDays(schedule.days)}
      </Text>

      <Text style={[styles.scheduleHours, isActive && styles.bold]} numberOfLines={1}>
        {formatBuildingTimes(schedule, now)}
      </Text>
    </View>
  )
}
