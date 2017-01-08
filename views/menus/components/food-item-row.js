// @flow
import React from 'react'
import {View, StyleSheet, Platform} from 'react-native'
import {DietaryTags} from './dietary-tags'
import {Row, Column} from '../../components/layout'
import {ListRow, Detail, Title} from '../../components/list'
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
      arrowPosition='none'
    >
      <Row>
        <View style={[styles.badge, {width: left, alignSelf: hasDescription ? 'flex-start' : 'center'}]}>
          {badgeSpecials && data.special ? <Icon style={styles.badgeIcon} name={specialsIcon} /> : null}
        </View>

        <Column flex={1}>
          <Title>{data.label}</Title>
          {data.description ? <Detail>{data.description}</Detail> : null}
        </Column>

        <DietaryTags
          filters={filters}
          dietary={data.cor_icon}
          style={styles.iconContainer}
        />
      </Row>
    </ListRow>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleOnly: {
    paddingVertical: 8,
  },
  hasDescription: {
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
