// @flow
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native'

import keys from 'lodash/keys'
import pick from 'lodash/pick'
import map from 'lodash/map'
import type {MenuItemType, ItemCorIconMapType, MasterCorIconMapType} from '../types'

function getDietaryTagsDefault(filters: MasterCorIconMapType, dietary: ItemCorIconMapType): any[] {
  // filter the mapping of all icons by just the icons provided by this item
  let filtered = pick(filters, keys(dietary))

  // turn the remaining items into images
  return map(filtered, (dietaryIcon, key) =>
    <Image
      key={key}
      source={dietaryIcon.icon}
      style={styles.icons}
    />)
}

type FoodItemPropsType = {
  filters: MasterCorIconMapType,
  data: MenuItemType,
  getDietaryTags?: Function,
  style: any,
};

export default function FoodItem({data, filters, style, getDietaryTags=getDietaryTagsDefault}: FoodItemPropsType) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.name}>
        <Text style={styles.text}>
          {data.label}
        </Text>
      </View>
      <View style={styles.iconContainer}>
        {getDietaryTags(filters, data.cor_icon)}
      </View>
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
    fontSize: 13,
  },
  iconContainer: {
    flexDirection: 'row',
  },
  icons: {
    marginLeft: 7,
    width: 15,
    height: 15,
  },
})

FoodItem.propTypes = {
  data: React.PropTypes.object.isRequired,
  filters: React.PropTypes.object.isRequired,
}
