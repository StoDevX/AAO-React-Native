import {Platform} from 'react-native'

import {DatePicker as IosDatePicker} from './datepicker-ios'
import {DatePicker as AndroidDatePicker} from './datepicker-android'

export const DatePicker =
	Platform.OS === 'ios' ? IosDatePicker : AndroidDatePicker
