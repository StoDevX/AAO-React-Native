/**
 * @flow
 *
 * <Header/> controls the header of the detail view – title, abbr, and
 * subtitle.
 */

import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import type {BuildingType} from '../types'
import * as c from '../../components/colors'

type Props = {building: BuildingType}

export class Header extends React.PureComponent<Props> {
  render() {
    const {building} = this.props

    const abbr = building.abbreviation ? ` (${building.abbreviation})` : ''

    const subtitle = building.subtitle ? (
      <View style={styles.subtitle}>
        <Text selectable={true} style={[styles.name, styles.subtitleText]}>
          {building.subtitle}
        </Text>
      </View>
    ) : null

    return (
      <View>
        <View style={styles.title}>
          <Text selectable={true} style={styles.name}>
            {building.name}
            {abbr}
          </Text>
        </View>
        {subtitle}
      </View>
    )
  }
}

const styles = StyleSheet.create({
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
})
