/**
 * @flow
 *
 * <Building /> controls the structure of the detail view.
 */

import React from 'react'
import {ScrollView, StyleSheet, Platform, Image} from 'react-native'
import {buildingImages} from '../../../../images/building-images'
import type {BuildingType} from '../types'
import moment from 'moment-timezone'
import * as c from '../../components/colors'
import {getShortBuildingStatus} from '../lib'

import {Badge} from './badge'
import {Header} from './header'
import {ScheduleTable} from './schedule-table'

const transparentPixel = require('../../../../images/transparent.png')

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      android: {
        backgroundColor: c.androidLightBackground,
      },
      ios: {
        backgroundColor: c.iosLightBackground,
      },
    }),
  },
  image: {
    height: 100,
  },
})

export class BuildingDetail extends React.PureComponent {
  props: {info: BuildingType, now: moment, onProblemReport: () => any}

  render() {
    const {info, now, onProblemReport} = this.props

    const headerImage = info.image && buildingImages.hasOwnProperty(info.image)
      ? buildingImages[info.image]
      : transparentPixel
    const openStatus = getShortBuildingStatus(info, now)
    const schedules = info.schedule || []

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={headerImage} style={styles.image} />
        <Header building={info} />

        <Badge status={openStatus} />

        <ScheduleTable
          schedules={schedules}
          now={now}
          onProblemReport={onProblemReport}
        />
      </ScrollView>
    )
  }
}
