// @flow
/**
 * All About Olaf
 * Building Hours list element
 */
import React from 'react'
import {Text, StyleSheet, View} from 'react-native'
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

  const accent = bgColors[openStatus] || c.goldenrod
  const textaccent = foregroundColors[openStatus] || 'rgb(130, 82, 45)'

  return (
    <ListRow
      onPress={onPress}
      arrowPosition='top'

      title={
        <View style={[{flexDirection: 'row', justifyContent: 'space-between'}, styles.titleText]}>
          <Text numberOfLines={1} style={{flex: 1}}>
            <Text>{name}</Text>
            {info.abbreviation ? <Text> ({info.abbreviation})</Text> : null}
            {info.subtitle ? <Text style={styles.subtitleText}>    {info.subtitle}</Text> : null}
          </Text>

          <Badge
            text={openStatus}
            accentColor={accent}
            textColor={textaccent}
            style={styles.accessoryBadge}
          />
        </View>
      }

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
