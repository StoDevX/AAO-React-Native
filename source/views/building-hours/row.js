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
import {Row} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import {getDetailedBuildingStatus, getShortBuildingStatus} from './lib'

const styles = StyleSheet.create({
  title: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    flex: 1,
  },
  detailWrapper: {
    paddingTop: 3,
  },
  detailRow: {
    paddingTop: 0,
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

const BG_COLORS = {
  Open: c.moneyGreen,
  Closed: c.salmon,
}

const FG_COLORS = {
  Open: c.hollyGreen,
  Closed: c.brickRed,
}

type Props = {
  info: BuildingType,
  name: string,
  now: momentT,
  onPress: BuildingType => any,
}

export class BuildingRow extends React.PureComponent<void, Props, void> {
  onPress = () => {
    this.props.onPress(this.props.info)
  }

  render() {
    const {info, name, now} = this.props

    const openStatus = getShortBuildingStatus(info, now)
    const hours = getDetailedBuildingStatus(info, now)

    const accentBg = BG_COLORS[openStatus] || c.goldenrod
    const accentText = FG_COLORS[openStatus] || 'rgb(130, 82, 45)'

    return (
      <ListRow onPress={this.onPress} arrowPosition="center">
        <Row style={styles.title}>
          <Title lines={1} style={styles.titleText}>
            <Text>{name}</Text>
            {info.abbreviation ? <Text> ({info.abbreviation})</Text> : null}
            {info.subtitle
              ? <Text style={styles.subtitleText}> {info.subtitle}</Text>
              : null}
          </Title>

          <Badge
            text={openStatus}
            accentColor={accentBg}
            textColor={accentText}
            style={styles.accessoryBadge}
          />
        </Row>

        <View style={styles.detailWrapper}>
          {hours.map(({isActive, label, status}, i) =>
            <Detail key={i} style={styles.detailRow}>
              <BuildingTimeSlot
                highlight={hours.length > 1 && isActive}
                label={label}
                status={status}
              />
            </Detail>,
          )}
        </View>
      </ListRow>
    )
  }
}

const BuildingTimeSlot = ({
  label,
  status,
  highlight,
}: {
  label: ?string,
  status: string,
  highlight: boolean,
}) => {
  // we don't want to show the 'Hours' label, since almost every row has it
  const showLabel = label && label !== 'Hours'

  return (
    <Text>
      {showLabel
        ? <Text style={highlight && styles.bold}>{label}: </Text>
        : null}
      <Text style={highlight && styles.bold}>{status}</Text>
    </Text>
  )
}
