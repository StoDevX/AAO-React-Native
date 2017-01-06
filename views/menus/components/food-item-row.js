// @flow
import React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import {DietaryTags} from './dietary-tags'
import {ListRow} from '../../components/list-row'
import type {MenuItemType, MasterCorIconMapType} from '../types'
import * as c from '../../components/colors'
import Icon from 'react-native-vector-icons/Ionicons'

const specialsIcon = Platform.OS === 'ios' ? 'ios-star-outline' : 'md-star-outline'

type FoodItemPropsType = {|
  filters: MasterCorIconMapType,
  data: MenuItemType,
  style?: any,
  badgeSpecials?: boolean,
  spacing: {left: number},
|};

export function FoodItemRow({data, filters, badgeSpecials=true, ...props}: FoodItemPropsType) {
  const {left=0} = props.spacing
  const hasDescription = Boolean(data.description)
  return (
    <ListRow
      style={[styles.container, hasDescription ? styles.hasDescription : styles.titleOnly, props.style]}
      fullWidth={true}
      //arrowPosition={hasDescription ? 'top' : 'center'}
      arrowPosition='none'
    >
      <View style={[styles.badge, {width: left, alignSelf: hasDescription ? 'flex-start' : 'center'}]}>
        {badgeSpecials && data.special ? <Icon style={styles.badgeIcon} name={specialsIcon} /> : null}
      </View>

      <View style={[styles.column, {flex: 1}]}>
        <Text style={styles.titleText}>
          {data.label}
        </Text>

        {data.description
          ? <View style={[styles.description]}>
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

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleOnly: {
    paddingVertical: 8,
  },
  hasDescription: {
  },
  column: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  titleText: {
    color: c.black,
    fontSize: 16,
  },
  description: {
    paddingTop: 2,
  },
  descriptionText: {
    color: c.iosDisabledText,
    fontSize: Platform.OS === 'ios' ? 13 : 14,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 18,
    color: c.iosDisabledText,
  },
  iconContainer: {
    marginLeft: 10,
    marginRight: 4,
  },
})
