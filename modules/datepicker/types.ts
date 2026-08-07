import {StyleProp, ViewStyle} from 'react-native'
import type {Moment} from 'moment-timezone'
import type {DateTimePickerProps} from '@expo/ui/community/datetime-picker'

export interface BaseDatetimePickerProps {
	// dep-specific
	initialDate: Moment
	mode: IOSProps['mode']
	format?: string
	onDateChange: (moment: Moment) => void

	// platform/wrapper components
	displayIos?: IOSProps['display']
	showPickerIos?: boolean
	style?: StyleProp<ViewStyle>
	onChange?: () => void
}

interface IOSProps {
	mode: NonNullable<DateTimePickerProps['mode']>
	display?: NonNullable<DateTimePickerProps['display']>
}

export type IosDatetimePickerProps = BaseDatetimePickerProps & IOSProps
