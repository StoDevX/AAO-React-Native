// @flow
import React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import {DietaryTags} from './dietary-tags'
import {ListRow} from '../../components/list-row'
import type {MenuItemType, MasterCorIconMapType} from '../types'
import * as c from '../../components/colors'

type FoodItemPropsType = {|
  filters: MasterCorIconMapType,
  data: MenuItemType,
  style?: any,
  badgeSpecials?: boolean,
  spacing: {left: number},
|};

export function FoodItemRow({data, filters, badgeSpecials=true, ...props}: FoodItemPropsType) {
  const {left=0} = props.spacing
  return (
    <ListRow
      style={[styles.container, props.style]}
      fullWidth={true}
      arrowPosition='none'
    >
      <View style={styles.main}>
        <View style={styles.title}>
          <View style={[styles.badgeView, {width: left}]}>
            <Text style={styles.badgeTextBlob}>{badgeSpecials && data.special ? '✩' : ''}</Text>
          </View>
          <Text style={styles.titleText}>
            {data.label}
          </Text>
        </View>

        {data.description
          ? <View style={[styles.description, {marginLeft: left}]}>
            <Text style={styles.descriptionText}>
              {data.description}
            </Text>
          </View>
          : null}
      </View>

      <DietaryTags
        filters={filters}
        dietary={data.cor_icon}
        style={styles.iconContainer}
      />
    </ListRow>
  )
}

const titleFontSize = 16
const titleLineHeight = 18
const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flex: 1,
  },
  title: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  titleText: {
    color: c.black,
    fontSize: titleFontSize,
    lineHeight: titleLineHeight,
  },
  description: {
    paddingTop: 3,
    marginLeft: 0.5,  // Needed to line up the title and description because of the icon
  },
  descriptionText: {
    color: c.iosDisabledText,
    fontSize: Platform.OS === 'ios' ? 13 : 14,
  },
  badgeView: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextBlob: {
    fontSize: titleLineHeight,
    lineHeight: titleLineHeight,
    marginBottom: -3,
    color: c.iosDisabledText,
  },
  iconContainer: {
    marginLeft: 10,
    marginRight: 4,
  },
})
