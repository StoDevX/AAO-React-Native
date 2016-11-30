// @flow
/**
 * All About Olaf
 * Building Hours list element
 */

import React from 'react'
import {
 View,
 Text,
 StyleSheet,
 Platform,
} from 'react-native'

import type momentT from 'moment'
import type {BuildingType} from './types'
import * as c from '../components/colors'
import {getDetailedBuildingStatus} from './building-hours-helpers'
import {getShortBuildingStatus} from './building-hours-helpers'
import Icon from 'react-native-vector-icons/Ionicons'
import sortBy from 'lodash/sortBy'

type PropsType = {
  info: BuildingType,
  name: string,
  now: momentT,
  style?: Number|Object|Array<Number|Object>,
};

let styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: Platform.OS === 'ios' ? 8 : 16,
    flex: 1,
    alignItems: 'center',
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    color: c.black,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 3,
    fontSize: Platform.OS === 'ios' ? 16 : 16,
    textAlign: 'left',
  },
  accessoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
    borderRadius: 2,
    borderWidth: 1,
    alignSelf: 'center',
  },
  accessoryBadgeText: {
    color: c.white,
  },
  previewText: {
    color: c.iosDisabledText,
    fontSize: Platform.OS === 'ios' ? 13 : 14,
    textAlign: 'left',
  },
  activeHourSet: {
    fontWeight: 'bold',
  },
  disclosure: {
    marginLeft: 10,
  },
  disclosureIcon: {
    color: c.iosDisabledText,
    fontSize: 20,
  },
})


export function BuildingRow({info, name, now, style}: PropsType) {
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
  const bgaccent = accent.replace('rgb', 'rgba').replace(')', ', 0.1)')

  return (
    <View style={[styles.row, style]}>
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={{flexDirection: 'row'}}>
          <View style={[styles.title, {flex: 1}]}>
            <Text numberOfLines={1} style={[styles.titleText]}>{name}</Text>
          </View>

          <View style={[styles.accessoryBadge, {backgroundColor: bgaccent, borderColor: accent}]}>
            <Text style={[styles.accessoryBadgeText, {color: textaccent}]}>{openStatus}</Text>
          </View>
        </View>

        <View style={[styles.preview]}>
          {hours.map(([isActive, label, status], i) => {
            // we don't want to show the 'Hours' label, since almost every row has it
            let showLabel = label && label !== 'Hours'
            // we want to highlight the time section when there's no label shown
            let highlightTime = hours.length > 1 && isActive

            return (
              <Text key={i} style={[styles.previewText]}>
                {showLabel && <Text style={[isActive ? styles.activeHourSet : null]}>{label}: </Text>}
                {<Text style={[highlightTime ? styles.activeHourSet : null]}>{status}</Text>}
              </Text>
            )
          })}
        </View>
      </View>

      {Platform.OS === 'ios' ? <View style={styles.disclosure}>
        <Icon style={[styles.disclosureIcon]} name='ios-arrow-forward' />
      </View> : null}
    </View>
  )
}

BuildingRow.propTypes = {
  info: React.PropTypes.object.isRequired,
  name: React.PropTypes.string.isRequired,
  now: React.PropTypes.object.isRequired,
}
