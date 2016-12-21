// @flow
import React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import * as c from '../../components/colors'

const buttonStyles = StyleSheet.create({
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

type ButtonPropsType = {
  iconName?: string,
  title: string,
  isActive: boolean,
};

export function ToolbarButton({title, iconName, isActive}: ButtonPropsType) {
  let icon
  if (!iconName) {
    icon = null
  } else if (Platform.OS === 'ios') {
    icon = isActive ? iconName : iconName + '-outline'
  } else if (Platform.OS === 'android') {
    icon = iconName
  }

  return (
    <View style={[buttonStyles.toolbarSection, buttonStyles.filterButton, isActive ? buttonStyles.filterButtonActive : buttonStyles.filterButtonInactive]}>
      <Text style={[isActive ? buttonStyles.filterButtonActiveText : buttonStyles.filterButtonInactiveText, {paddingRight: 8, fontWeight: isActive && Platform.OS === 'android' ? 'bold' : 'normal'}]}>
        {title}
      </Text>
      {icon
        ? <Icon size={18} name={icon} style={[isActive ? buttonStyles.filterButtonActiveText : buttonStyles.filterButtonInactiveText]} />
        : null}
    </View>
  )
}
