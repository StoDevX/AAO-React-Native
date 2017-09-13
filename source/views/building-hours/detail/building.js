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
import {ListFooter} from '../../components/list'

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

type Props = {
  info: BuildingType,
  now: moment,
  onProblemReport: () => any,
}

export class BuildingDetail extends React.Component<void, Props, void> {
  shouldComponentUpdate(nextProps: Props) {
    return (
      !this.props.now.isSame(nextProps.now, 'minute') ||
      this.props.info !== nextProps.info ||
      this.props.onProblemReport !== nextProps.onProblemReport
    )
  }

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
        <ListFooter
          title={
            'Building hours subject to change without notice\n\nData collected by the humans of All About Olaf'
          }
        />
      </ScrollView>
    )
  }
}
