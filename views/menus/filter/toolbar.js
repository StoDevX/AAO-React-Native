// @flow
import React from 'react'
import {View, Text, Platform, TouchableHighlight, TouchableNativeFeedback} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type momentT from 'moment'
const Touchable = Platform.OS === 'ios' ? TouchableHighlight : TouchableNativeFeedback

export function FilterToolbar({date, title, isFiltered, onPress}: {date: momentT, title: string, onPress: () => any, isFiltered: bool}) {
  const icon = Platform.OS === 'ios'
    ? isFiltered
      ? 'ios-funnel'
      : 'ios-funnel-outline'
    : 'md-funnel'

  return (
    <Touchable onPress={onPress}>
      <View style={{flexDirection: 'row', elevation: 4, paddingVertical: 14, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 12}}>
        <Touchable onPress={onPress} background={Touchable.SelectableBackgroundBorderless()}>
          <View style={{flex: 1, flexDirection: 'row'}}>
            <Text>{date.format('MMM Do')}</Text>
            <Text style={{paddingHorizontal: 8}}>•</Text>
            <Text>{title}</Text>
          </View>
        </Touchable>
        <Touchable onPress={onPress} background={Touchable.SelectableBackgroundBorderless()}>
          <View style={{flexDirection: 'row'}}>
            <Text style={{paddingRight: 8, fontWeight: isFiltered && Platform.OS === 'android' ? 'bold' : 'normal'}}>{isFiltered ? 'Filtered' : 'No Filter'}</Text>
            <Icon size={18} name={icon} />
          </View>
        </Touchable>
      </View>
    </Touchable>
  )
}
