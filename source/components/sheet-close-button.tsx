import * as React from 'react'
import {Stack} from 'expo-router'

import {useDismissOnce} from '../lib/use-dismiss-once'

/**
 * The Close button every sheet carries at the top left of its first screen,
 * so each one has the same way out besides the grabber. A screen pushed
 * inside a sheet shows Back in that spot instead, so this belongs only on the
 * sheet's first screen.
 *
 * Pressing it twice while the sheet is still leaving closes it only once,
 * rather than also going back off the screen behind it.
 */
export function SheetCloseButton(): React.ReactNode {
	let dismiss = useDismissOnce()

	return (
		<Stack.Toolbar placement="left">
			<Stack.Toolbar.Button
				accessibilityLabel="Close"
				icon="xmark"
				onPress={dismiss}
				separateBackground={true}
			/>
		</Stack.Toolbar>
	)
}
