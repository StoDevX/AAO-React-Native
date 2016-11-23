// @flow
import React from 'react'
import {StyleSheet, View, Text, Platform, TouchableOpacity, TouchableNativeFeedback} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type momentT from 'moment'
const Touchable = Platform.OS === 'ios' ? TouchableOpacity : TouchableNativeFeedback
const touchableBg = Platform.OS === 'ios' ? null : Touchable.SelectableBackgroundBorderless()

const navbarShadows = StyleSheet.create({
  shadow: Platform.OS === 'ios'
    ? {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgb(100, 100, 100)',
    }
    : {
      elevation: 4,
    },
})

export function FilterToolbar({date, title, isFiltered, onPress}: {date: momentT, title: string, onPress: () => any, isFiltered: bool}) {
  const icon = Platform.OS === 'ios'
    ? isFiltered
      ? 'ios-funnel'
      : 'ios-funnel-outline'
    : 'md-funnel'

  return (
    <View style={[navbarShadows.shadow, {flexDirection: 'row', alignItems: 'center', backgroundColor: 'white'}]}>
      <Touchable onPress={onPress} style={{flex: 1}} background={touchableBg}>
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1, flexDirection: 'row', paddingVertical: 14, paddingLeft: 12}}>
            <Text>{date.format('MMM Do')}</Text>
            <Text style={{paddingHorizontal: 8}}>•</Text>
            <Text>{title}</Text>
          </View>

          <View style={{flexDirection: 'row', paddingVertical: 14, paddingRight: 12}}>
            <Text style={{paddingRight: 8, fontWeight: isFiltered && Platform.OS === 'android' ? 'bold' : 'normal'}}>
              {isFiltered ? 'Filtered' : 'No Filter'}
            </Text>
            <Icon size={18} name={icon} />
          </View>
        </View>
      </Touchable>
    </View>
  )
}
