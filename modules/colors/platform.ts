import {Platform, PlatformColor} from 'react-native'

export const link = PlatformColor('link')
export const label = PlatformColor('label')
export const secondaryLabel = PlatformColor('secondaryLabel')
export const tertiaryLabel = PlatformColor('tertiaryLabel')
export const systemFill = PlatformColor('systemFill')
export const secondarySystemFill = PlatformColor('secondarySystemFill')
export const systemBackground = PlatformColor('systemBackground')
export const secondarySystemBackground = PlatformColor(
	'secondarySystemBackground',
)
export const tertiarySystemBackground = PlatformColor(
	'tertiarySystemBackground',
)
export const separator = PlatformColor('separator')
export const secondaryBackground = PlatformColor('secondaryBackground')

export const iosGray = systemFill as unknown as string

export const androidLightBackground = 'rgb(244, 244, 244)'
export const androidSeparator = 'rgb(224, 224, 224)'
export const androidDisabledIcon = 'rgb(224, 224, 224)'
export const androidTextColor = 'rgb(113, 113, 118)'
export const androidTabAccentColor = '#ffeb3b'

export const iosBackground = secondarySystemBackground
export const iosSeparator = separator
export const iosLightBorder = separator
export const iosDisabledText = secondaryLabel
export const iosText = label
export const iosNavbarBottomBorder = separator
export const iosListSectionHeader = secondarySystemBackground
export const iosPlaceholderText = separator
export const iosHeaderTopBorder = separator
export const iosHeaderBottomBorder = separator

export const sectionBgColor =
	Platform.OS === 'ios' ? iosBackground : androidLightBackground

export const tableviewAccessoryColor = secondaryLabel
