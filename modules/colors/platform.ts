import {Platform} from 'react-native'

export const iosGray = 'rgb(241, 241, 242)'

export const androidLightBackground = 'rgb(244, 244, 244)'
export const androidSeparator = 'rgb(224, 224, 224)'
export const androidDisabledIcon = 'rgb(224, 224, 224)'
export const androidTextColor = 'rgb(113, 113, 118)'
export const androidTabAccentColor = '#ffeb3b'

export const iosLightBackground = 'rgb(240, 239, 245)'
export const iosSeparator = '#C8C7CC'
export const iosLightBorder = iosSeparator
export const iosDisabledText = 'rgb(142, 142, 147)'
export const iosText = iosSeparator
export const iosNavbarBottomBorder = iosSeparator
export const iosListSectionHeader = 'rgb(248, 248, 248)'
export const iosPlaceholderText = iosSeparator
export const iosHeaderTopBorder = iosSeparator
export const iosHeaderBottomBorder = 'rgb(224, 224, 224)'

export const sectionBgColor =
	Platform.OS === 'ios' ? iosLightBackground : androidLightBackground

export const tableviewAccessoryColor = 'rgb(0, 122, 255)'
