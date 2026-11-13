import * as React from 'react'
import {Stack} from 'expo-router'

import type {ResultsToolbarProps} from './results-toolbar'
import formatListBulletedIcon from '@expo/material-symbols/format_list_bulleted.xml'
import gridViewIcon from '@expo/material-symbols/grid_view.xml'

/**
 * The directory's tiles-or-list toggle on Android: an action in the top app
 * bar, beside search, shown once there are results. The bottom toolbar iOS
 * uses would leave an empty floating toolbar over the list while the toggle
 * is hidden, and search already lives in the app bar here.
 */
export function ResultsToolbar({
	hasResults,
	resultsView,
	onToggle,
}: ResultsToolbarProps): React.ReactNode {
	if (!hasResults) {
		return null
	}
	return (
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.Button
				accessibilityLabel={resultsView === 'tiles' ? 'Show as list' : 'Show as tiles'}
				icon={resultsView === 'tiles' ? formatListBulletedIcon : gridViewIcon}
				onPress={onToggle}
			/>
		</Stack.Toolbar>
	)
}
