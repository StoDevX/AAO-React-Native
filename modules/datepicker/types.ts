import * as React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import type {Moment} from 'moment-timezone'
import type {
	AndroidNativeProps,
	IOSNativeProps,
} from '@react-native-community/datetimepicker'

export interface BaseDatetimePickerProps {
	// dep-specific
	initialDate: Moment
	minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30
	mode: IOSProps['mode'] | AndroidProps['mode']
	format?: string
	onDateChange: (moment: Moment) => void

	// platform/wrapper components
	displayIos?: IOSProps['display']
	displayAndroid?: AndroidProps['display']
	showPickerIos?: boolean
	showPickerAndroid?: boolean
	showPickerButtonAndroid?: boolean
	style?: StyleProp<ViewStyle>
	setShowPickerAndroid?: React.Dispatch<React.SetStateAction<boolean>>
	onChange?: () => void
}

interface IOSProps {
	mode: NonNullable<IOSNativeProps['mode']>
	display?: NonNullable<IOSNativeProps['display']>
}

interface AndroidProps {
	mode: NonNullable<AndroidNativeProps['mode']>
	display?: NonNullable<AndroidNativeProps['display']>
}

export type IosDatetimePickerProps = BaseDatetimePickerProps & IOSProps

export type AndroidDatetimePickerProps = BaseDatetimePickerProps & AndroidProps
