import * as React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import type {Moment} from 'moment-timezone'

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
	mode: 'date' | 'time' | 'datetime' | 'countdown'
	display?: 'default' | 'compact' | 'inline' | 'spinner'
}

interface AndroidProps {
	mode: 'date' | 'time'
	display?: 'spinner' | 'default' | 'clock' | 'calendar'
}

export type IosDatetimePickerProps = BaseDatetimePickerProps & IOSProps

export type AndroidDatetimePickerProps = BaseDatetimePickerProps & AndroidProps
