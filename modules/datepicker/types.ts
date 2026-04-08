import {StyleProp, ViewStyle} from 'react-native'
import type {Moment} from 'moment-timezone'
import type {IOSNativeProps} from '@react-native-community/datetimepicker'

export interface BaseDatetimePickerProps {
	// dep-specific
	initialDate: Moment
	minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30
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
	mode: NonNullable<IOSNativeProps['mode']>
	display?: NonNullable<IOSNativeProps['display']>
}

export type IosDatetimePickerProps = BaseDatetimePickerProps & IOSProps
