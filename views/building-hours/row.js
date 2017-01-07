// @flow
/**
 * All About Olaf
 * Building Hours list element
 */
import React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import {Badge} from '../components/badge'
import type momentT from 'moment'
import type {BuildingType} from './types'
import * as c from '../components/colors'
import {ListRow} from '../components/list'
import {getDetailedBuildingStatus, getShortBuildingStatus} from './building-hours-helpers'

type PropsType = {
  info: BuildingType,
  name: string,
  now: momentT,
  onPress: () => any,
  style?: any,
};

let styles = StyleSheet.create({
  title: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleText: {
    fontWeight: '400',
    color: c.iosDisabledText,
    fontSize: 16,
  },
  titleText: {
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    color: c.black,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  accessoryBadge: {
    marginLeft: 4,
  },
  previewText: {
    color: c.iosDisabledText,
    fontSize: Platform.OS === 'ios' ? 13 : 14,
    textAlign: 'left',
  },
  bold: {
    fontWeight: 'bold',
  },
})

export function BuildingRow({info, name, now, style, onPress}: PropsType) {
  let bgColors = {
    Open: c.moneyGreen,
    Closed: c.salmon,
  }
  let foregroundColors = {
    Open: c.hollyGreen,
    Closed: c.brickRed,
  }

  const openStatus = getShortBuildingStatus(info, now)
  const hours = getDetailedBuildingStatus(info, now)

  const abbr = info.abbreviation ? <Text> ({info.abbreviation})</Text> : null
  const subtitle = info.subtitle ? <Text style={styles.subtitleText}>    {info.subtitle}</Text> : null

  const accent = bgColors[openStatus] || c.goldenrod
  const textaccent = foregroundColors[openStatus] || 'rgb(130, 82, 45)'

  return (
    <ListRow
      onPress={onPress}
      arrowPosition='top'
      style={[{flex: 1, flexDirection: 'column'}, style]}
    >
      <View style={{flexDirection: 'row'}}>
        <View style={[styles.title, {flex: 1}]}>
          <Text numberOfLines={1} style={[styles.titleText]}>
            {name}{abbr}{subtitle}
          </Text>
        </View>

        <Badge
          text={openStatus}
          accentColor={accent}
          textColor={textaccent}
          style={styles.accessoryBadge}
        />
      </View>

      <View style={[styles.preview]}>
        {hours.map(([isActive, label, status], i) =>
          <BuildingTimeSlot
            key={i}
            highlight={hours.length > 1 && isActive}
            {...{isActive, label, status}}
          />)}
      </View>
    </ListRow>
  )
}

const BuildingTimeSlot = ({isActive, label, status, highlight}: {isActive: boolean, label: ?string, status: string, highlight: boolean}) => {
  // we don't want to show the 'Hours' label, since almost every row has it
  let showLabel = label && label !== 'Hours'

  return (
    <Text style={[styles.previewText]}>
      {showLabel && <Text style={[isActive ? styles.bold : null]}>{label}: </Text>}
      {<Text style={[highlight ? styles.bold : null]}>{status}</Text>}
    </Text>
  )
}
