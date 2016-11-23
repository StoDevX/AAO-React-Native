// @flow
import React from 'react'
import {StyleSheet, View, Text, Platform, TouchableOpacity, TouchableNativeFeedback} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type momentT from 'moment'
const Touchable = Platform.OS === 'ios' ? TouchableOpacity : TouchableNativeFeedback
const touchableBg = Platform.OS === 'ios' ? null : Touchable.SelectableBackgroundBorderless()
import * as c from '../../components/colors'

const styles = StyleSheet.create({
  shadow: Platform.OS === 'ios'
    ? {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#ebebeb',
    }
    : {
      elevation: 4,
    },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  today: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 14,
  },
  toolbarSection: {
    flexDirection: 'row',
  },
  filterButton: {
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 0,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 2,
  },
  filterButtonActive: {
    backgroundColor: c.mandarin,
    borderColor: c.mandarin,
  },
  filterButtonInactive: {
    borderColor: c.iosDisabledText,
  },
  filterButtonActiveText: {
    color: c.white,
  },
  filterButtonInactiveText: {
    color: c.iosDisabledText,
  },
})

export function FilterToolbar({date, title, appliedFilterCount, onPress}: {date: momentT, title: string, onPress: () => any, appliedFilterCount: number}) {
  const isFiltered = appliedFilterCount > 0
  const icon = Platform.OS === 'ios'
    ? isFiltered
      ? 'ios-funnel'
      : 'ios-funnel-outline'
    : 'md-funnel'

  return (
    <View style={[styles.shadow, styles.container]}>
      <Touchable onPress={onPress} style={{flex: 1}} background={touchableBg}>
        <View style={{flexDirection: 'row'}}>
          <View style={[styles.toolbarSection, styles.today]}>
            <Text>{date.format('MMM Do')}</Text>
            <Text style={{paddingHorizontal: 8}}>•</Text>
            <Text>{title}</Text>
          </View>

          <View style={[styles.toolbarSection, styles.filterButton, isFiltered ? styles.filterButtonActive : styles.filterButtonInactive]}>
            <Text style={[isFiltered ? styles.filterButtonActiveText : styles.filterButtonInactiveText, {paddingRight: 8, fontWeight: isFiltered && Platform.OS === 'android' ? 'bold' : 'normal'}]}>
              {isFiltered ? `${appliedFilterCount} ${appliedFilterCount === 1 ? 'Filter' : 'Filters'}` : 'No Filter'}
            </Text>
            <Icon size={18} name={icon} style={[isFiltered ? styles.filterButtonActiveText : styles.filterButtonInactiveText]} />
          </View>
        </View>
      </Touchable>
    </View>
  )
}
