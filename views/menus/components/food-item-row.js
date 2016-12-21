// @flow
import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {DietaryTags} from './dietary-tags'
import type {MenuItemType, MasterCorIconMapType} from '../types'
import * as c from '../../components/colors'

type FoodItemPropsType = {
  filters: MasterCorIconMapType,
  data: MenuItemType,
  style: any,
};

export function FoodItemRow({data, filters, style}: FoodItemPropsType) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.name}>
        <Text style={styles.text}>{data.label}</Text>
      </View>
      <DietaryTags
        filters={filters}
        dietary={data.cor_icon}
        style={styles.iconContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    alignItems: 'stretch',
  },
  text: {
    fontSize: 15,
  },
  iconContainer: {
    flexDirection: 'row',
  },
  secondary: {
    color: c.iosDisabledText,
    fontSize: 15,
    textAlign: 'right',
  },
})
