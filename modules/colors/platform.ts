import {Platform, PlatformColor} from 'react-native'

export const iosGray = PlatformColor('systemFill') as unknown as string

export const androidLightBackground = 'rgb(244, 244, 244)'
export const androidSeparator = 'rgb(224, 224, 224)'
export const androidDisabledIcon = 'rgb(224, 224, 224)'
export const androidTextColor = 'rgb(113, 113, 118)'
export const androidTabAccentColor = '#ffeb3b'

export const iosBackground = PlatformColor('secondarySystemBackground')
export const iosSeparator = PlatformColor('separator')
export const iosLightBorder = iosSeparator
export const iosDisabledText = PlatformColor('secondaryLabel')
export const iosText = iosSeparator
export const iosNavbarBottomBorder = iosSeparator
export const iosListSectionHeader = PlatformColor('secondarySystemBackground')
export const iosPlaceholderText = iosSeparator
export const iosHeaderTopBorder = iosSeparator
export const iosHeaderBottomBorder = iosSeparator

export const sectionBgColor =
	Platform.OS === 'ios' ? iosBackground : androidLightBackground

export const tableviewAccessoryColor = PlatformColor('secondaryLabel')
