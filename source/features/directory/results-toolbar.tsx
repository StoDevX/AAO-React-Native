import * as React from 'react'
import {Stack} from 'expo-router'

export type ResultsToolbarProps = {
	/** Whether there are results to re-lay-out; the toggle hides until there are. */
	hasResults: boolean
	resultsView: 'tiles' | 'list'
	onToggle: () => void
}

/**
 * The directory's bottom toolbar: the search field, and a button that swaps
 * the results between tiles and a list. `results-toolbar.android.tsx` puts the
 * toggle in the top app bar instead.
 */
export function ResultsToolbar({
	hasResults,
	resultsView,
	onToggle,
}: ResultsToolbarProps): React.ReactNode {
	return (
		<Stack.Toolbar placement="bottom">
			<Stack.Toolbar.SearchBarSlot />
			<Stack.Toolbar.Spacer />
			{/* Always mounted, hidden until there are results to re-lay-out:
			    `Stack.Toolbar` only reads direct Button/Spacer children, so a
			    conditionally-rendered fragment of them is dropped entirely. */}
			{/* Icon and Label as children rather than an `icon` prop and an
			    `accessibilityLabel`: a bottom-toolbar item drops the latter and
			    lets iOS name it after its symbol, so the button announced
			    itself as "List" rather than saying what tapping it does. */}
			<Stack.Toolbar.Button hidden={!hasResults} onPress={onToggle}>
				<Stack.Toolbar.Icon sf={resultsView === 'tiles' ? 'list.bullet' : 'square.grid.2x2'} />
				<Stack.Toolbar.Label>
					{resultsView === 'tiles' ? 'Show as list' : 'Show as tiles'}
				</Stack.Toolbar.Label>
			</Stack.Toolbar.Button>
		</Stack.Toolbar>
	)
}
