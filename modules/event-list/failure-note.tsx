import * as React from 'react'
import {Text} from '@expo/ui/swift-ui'
import {font, foregroundStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {failureNote} from './day-state'
import type {CalendarSource} from './types'

/**
 * A line naming the calendars that failed to refresh, drawn above the saved
 * events a view is still showing -- or nothing, when none failed.
 */
export function FailureNote({failed}: {failed: readonly CalendarSource[]}): React.ReactNode {
	let note = failureNote(failed)
	if (!note) {
		return null
	}
	return (
		<Text modifiers={[foregroundStyle(c.secondaryLabel), font({textStyle: 'footnote'})]}>
			{note}
		</Text>
	)
}
