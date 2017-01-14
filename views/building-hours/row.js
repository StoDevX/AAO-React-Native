// @flow
/**
 * All About Olaf
 * Building Hours list element
 */
import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {Badge} from '../components/badge'
import type momentT from 'moment'
import type {BuildingType} from './types'
import * as c from '../components/colors'
import {Row, Column} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import {getDetailedBuildingStatus, getShortBuildingStatus} from './building-hours-helpers'

const styles = StyleSheet.create({
  title: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitleText: {
    fontWeight: '400',
    color: c.iosDisabledText,
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
      arrowPosition='center'
      direction='column'
    >
      <Column>
        <Row style={styles.title}>
          <Title lines={1} style={{flex: 1}}>
            <Text>{name}</Text>
            {info.abbreviation ? <Text> ({info.abbreviation})</Text> : null}
            {info.subtitle ? <Text style={styles.subtitleText}>    {info.subtitle}</Text> : null}
          </Title>

          <Badge
            text={openStatus}
            accentColor={accent}
            textColor={textaccent}
            style={styles.accessoryBadge}
          />
        </Row>

        <View style={{paddingTop: 3}}>
          {hours.map(([isActive, label, status], i) =>
            <Detail key={i} style={{paddingTop: 0}}>
              <BuildingTimeSlot
                highlight={hours.length > 1 && isActive}
                label={label}
                status={status}
              />
            </Detail>
          )}
        </View>
      </Column>
    </ListRow>
  )
}

const BuildingTimeSlot = ({label, status, highlight}: {label: ?string, status: string, highlight: boolean}) => {
  // we don't want to show the 'Hours' label, since almost every row has it
  const showLabel = label !== 'Hours'

  return (
    <Text>
      {showLabel ? <Text style={highlight && styles.bold}>{label}: </Text> : null}
      <Text style={highlight && styles.bold}>{status}</Text>
    </Text>
  )
}
