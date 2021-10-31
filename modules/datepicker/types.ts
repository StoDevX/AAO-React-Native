import type {Moment} from 'moment-timezone'
import type {
	AndroidNativeProps,
	IOSNativeProps,
} from '@react-native-community/datetimepicker'

export interface BaseDatetimePickerProps {
	// dep-specific
	initialDate: Moment
	minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30
	mode: IOSNativeProps['mode'] | AndroidNativeProps['mode']
	format?: string
	onDateChange: (moment: Moment) => void

	// platform/wrapper components
	showPickeriOS?: boolean
	showPickerAndroid?: boolean
	showPickerButtonAndroid?: boolean
	style?: any
	setShowPickerAndroid?: React.Dispatch<React.SetStateAction<boolean>>
	onChange?: () => void
}

interface IOSProps {
	mode: IOSNativeProps['mode']
}

interface AndroidProps {
	mode: AndroidNativeProps['mode']
}

export type IosDatetimePickerProps = BaseDatetimePickerProps & IOSProps

export type AndroidDatetimePickerProps = BaseDatetimePickerProps & AndroidProps
