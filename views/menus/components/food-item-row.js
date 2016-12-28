// @flow
import React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import {DietaryTags} from './dietary-tags'
import type {MenuItemType, MasterCorIconMapType} from '../types'
import * as c from '../../components/colors'

type FoodItemPropsType = {
  filters: MasterCorIconMapType,
  data: MenuItemType,
  style: any,
  badgeSpecials?: boolean,
};

export function FoodItemRow({data, filters, style, badgeSpecials=true}: FoodItemPropsType) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.main}>
        <View style={styles.title}>
          <View style={styles.badgeView}>
            <Text style={styles.badgeTextBlob}>{badgeSpecials && data.special ? '✩' : ''}</Text>
          </View>
          <Text style={styles.titleText}>
            {data.label}
          </Text>
        </View>
        {data.description
          ? <View style={styles.description}>
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
    </View>
  )
}

const leftSideSpacing = 28
const rightSideSpacing = 10
const titleFontSize = 16
const titleLineHeight = 18
const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
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
    width: leftSideSpacing,
    marginLeft: -leftSideSpacing,
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
    marginLeft: rightSideSpacing,
  },
})
