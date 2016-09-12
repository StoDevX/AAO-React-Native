// @flow
/**
 * All About Olaf
 * Building Hours list element
 */

import React from 'react'
import {
 View,
 Text,
 Image,
 Dimensions,
 StyleSheet,
} from 'react-native'

import * as c from '../components/colors'
import type {BuildingInfoType} from './types'
import {isBuildingOpen} from './is-building-open'
import {formatBuildingHours} from './format-building-hours'
import CollapsibleBlock from '../components/collapsibleBlock'
import {allBuildingHours} from './all-building-hours.js'


export default function BuildingView({info, image, name}: PropsType) {

  let borderColors = {
    'Open': '#CEFFCE',
    'Almost Closed': '#FFFC96',
    'Closed': '#F7C8C8',
  }

  type PropsType = {
    info: BuildingInfoType,
    image: number,
    name: string,
  };

  let openStatus = isBuildingOpen(info)

  let styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      borderLeftWidth: 5,
      borderRightWidth: 5,
      marginTop: 10,
      height: 100,
      borderColor: borderColors[openStatus],
    },
    name: {
      color: c.white,
      fontSize: 24,
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    inner: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    status: {
      color: c.white,
      fontSize: 14,
      paddingTop: 2,
      paddingBottom: 2,
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    hoursText: {
      textAlign: 'center',
      fontSize: 13,
    },
    contents: {
      paddingBottom: 10,
      paddingTop: 5,
      width: Dimensions.get('window').width,
    },
  })

  
  let hours = formatBuildingHours(info)
  let allHours = allBuildingHours(info, styles.hoursText)

  return (
    <CollapsibleBlock style={styles} backgroundColor={borderColors[openStatus]}>
      <View style={[styles.container]}>
        <Image
          source={image}
          style={{width: undefined, height: 100}}
          resizeMode='cover'>
          <View style={styles.inner}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.status}>{hours}</Text>
          </View>
        </Image>
      </View>

      <View style={styles.contents}>
        <Text style={styles.hoursText}>Daily Hours</Text>
        {allHours}
      </View>
    </CollapsibleBlock>
    )
}

BuildingView.propTypes = {
  image: React.PropTypes.number.isRequired,
  info: React.PropTypes.object.isRequired,
  name: React.PropTypes.string.isRequired,
}
