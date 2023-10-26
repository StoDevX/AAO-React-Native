import {Platform} from 'react-native'

import {DatePicker as AndroidDatePicker} from './datepicker-android'
import {DatePicker as IosDatePicker} from './datepicker-ios'

export const DatePicker =
	Platform.OS === 'ios' ? IosDatePicker : AndroidDatePicker
