// @flow
/**
 * All About Olaf
 * Building Hours list element
 */
import React from 'react'
import {Text, StyleSheet} from 'react-native'
import {Badge} from '../components/badge'
import type momentT from 'moment'
import type {BuildingType} from './types'
import * as c from '../components/colors'
import {ListRow} from '../components/list'
import {getDetailedBuildingStatus, getShortBuildingStatus} from './building-hours-helpers'

const styles = StyleSheet.create({
  subtitleText: {
    fontWeight: '400',
    color: c.iosDisabledText,
  },
  titleText: {
    paddingHorizontal: 0,
    paddingBottom: 3,
  },
  accessoryBadge: {
    marginLeft: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
})

type PropsType = {
  info: BuildingType,
  name: string,
  now: momentT,
  onPress: () => any,
};

export function BuildingRow({info, name, now, onPress}: PropsType) {
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

  const abbr = info.abbreviation ? <Text key={1}> ({info.abbreviation})</Text> : null
  const subtitle = info.subtitle ? <Text key={2} style={styles.subtitleText}>    {info.subtitle}</Text> : null

  const accent = bgColors[openStatus] || c.goldenrod
  const textaccent = foregroundColors[openStatus] || 'rgb(130, 82, 45)'

  const badge = (
    <Badge
      text={openStatus}
      accentColor={accent}
      textColor={textaccent}
      style={styles.accessoryBadge}
    />
  )

  return (
    <ListRow
      onPress={onPress}
      arrowPosition='top'

      title={[name, abbr, subtitle]}
      titleLines={1}
      titleStyle={styles.titleText}
      titleBadge={badge}

      description={hours.map(([isActive, label, status], i) =>
        <BuildingTimeSlot
          key={i}
          highlight={hours.length > 1 && isActive}
          {...{isActive, label, status}}
        />
      )}
    />
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
