// @flow
import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {buildingImages} from '../../../images/building-images'
import type {
  SingleBuildingScheduleType,
  BuildingType,
  DayOfWeekEnumType,
} from './types'
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

const transparentPixel = require('../../../images/transparent.png')

const CENTRAL_TZ = 'America/Winnipeg'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  name: {
    textAlign: 'center',
    color: c.black,
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
})

export class BuildingHoursDetailView extends React.Component {
  static navigationOptions = ({navigation}) => {
    return {
      title: navigation.state.params.building.name,
    }
  }

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

  props: {navigation: {state: {params: {building: BuildingType}}}}

  updateTime = () => {
    this.setState({now: moment.tz(CENTRAL_TZ)})
  }

  render() {
    const info = this.props.navigation.state.params.building
    const {now} = this.state

    const headerImage = info.image
      ? buildingImages[info.image]
      : transparentPixel
    const openStatus = getShortBuildingStatus(info, now)
    const schedules = normalizeBuildingSchedule(info, now)
    const dayOfWeek = ((now.format('dd'): any): DayOfWeekEnumType)

    return (
      <ParallaxView
        backgroundSource={headerImage}
        windowHeight={100}
        scrollableViewStyle={styles.scrollableStyle}
      >
        <View style={styles.container}>
          <Header building={info} />

          <Badge status={openStatus} />

          {schedules.map(set =>
            <Schedule key={set.title} set={set}>
              {set.hours.map((schedule, i) =>
                <ScheduleRow
                  key={i}
                  now={now}
                  schedule={schedule}
                  isActive={
                    set.isPhysicallyOpen !== false &&
                    schedule.days.includes(dayOfWeek) &&
                    isBuildingOpenAtMoment(schedule, this.state.now)
                  }
                />,
              )}
            </Schedule>,
          )}
        </View>
      </ParallaxView>
    )
  }
}

function Header({building}) {
  const abbr = building.abbreviation
    ? <Text style={styles.abbr}> ({building.abbreviation})</Text>
    : null

  const title = <Text style={styles.name}>{building.name}{abbr}</Text>

  const subtitle = building.subtitle
    ? <View style={styles.subtitle}>
        <Text style={[styles.name, styles.subtitleText]}>
          {building.subtitle}
        </Text>
      </View>
    : null

  return (
    <View>
      <View style={styles.title}>{title}</View>
      {subtitle}
    </View>
  )
}

function Badge({status}) {
  const bgColors = {
    Open: c.moneyGreen,
    Closed: c.salmon,
  }

  return (
    <View
      style={[styles.badge, {backgroundColor: bgColors[status] || c.goldenrod}]}
    >
      <Text selectable={true} style={styles.badgeText}>{status}</Text>
    </View>
  )
}

function Schedule({children, set}) {
  return (
    <Card
      style={styles.scheduleContainer}
      header={set.title}
      footer={set.notes}
    >
      <View style={styles.scheduleHoursWrapper}>
        {children}
      </View>
    </Card>
  )
}

function ScheduleRow({
  schedule,
  isActive,
  now,
}: {
  schedule: SingleBuildingScheduleType,
  isActive: boolean,
  now: momentT,
}) {
  return (
    <View style={styles.scheduleRow}>
      <Text
        selectable={true}
        style={[styles.scheduleDays, isActive && styles.bold]}
        numberOfLines={1}
      >
        {summarizeDays(schedule.days)}
      </Text>

      <Text
        selectable={true}
        style={[styles.scheduleHours, isActive && styles.bold]}
        numberOfLines={1}
      >
        {formatBuildingTimes(schedule, now)}
      </Text>
    </View>
  )
}
