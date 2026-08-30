import * as React from 'react'
import {Stack} from 'expo-router'

import {DatePicker, Host} from '@expo/ui/swift-ui'
import {datePickerStyle, labelsHidden} from '@expo/ui/swift-ui/modifiers'

import {useIsDevMode} from '../../lib/use-is-dev-mode'

type Props = {
	value: Date
	onDateChange: (date: Date) => void
}

/**
 * Moves the day the list treats as today, so the Yesterday/Today/Upcoming
 * buckets can be read against a date that has fixtures in it rather than
 * whichever day the season happens to be on. Dev mode only.
 *
 * It sits in the bottom bar because that is the only placement iOS takes a
 * custom view in: `Stack.Toolbar.View` throws outright for `left` and `right`,
 * so the header-right spot the picker used before is not on offer. Calendar
 * keeps its own picker in the same bar.
 */
export function DebugDatePicker({value, onDateChange}: Props): React.ReactNode {
	let isDevMode = useIsDevMode()

	if (!isDevMode) {
		return null
	}

	return (
		<Stack.Toolbar placement="bottom">
			<Stack.Toolbar.View>
				<Host matchContents={true}>
					<DatePicker
						displayedComponents={['date']}
						modifiers={[datePickerStyle('compact'), labelsHidden()]}
						onDateChange={onDateChange}
						selection={value}
						title="Debug date"
					/>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
