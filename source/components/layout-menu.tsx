import * as React from 'react'
import {Stack} from 'expo-router'
import type {Layout} from '../lib/layout-store'

type Props = {
	layout: Layout
	onChange: (layout: Layout) => void
}

/// The ⋯ menu at the top right of a screen that can draw its items as tiles
/// or as rows, with the one in use checked.
export function LayoutMenu({layout, onChange}: Props): React.ReactNode {
	return (
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.Menu accessibilityLabel="Layout" icon="ellipsis">
				<Stack.Toolbar.MenuAction
					icon="square.grid.3x2"
					isOn={layout === 'grid'}
					onPress={() => onChange('grid')}
				>
					Grid
				</Stack.Toolbar.MenuAction>
				<Stack.Toolbar.MenuAction
					icon="list.bullet"
					isOn={layout === 'list'}
					onPress={() => onChange('list')}
				>
					List
				</Stack.Toolbar.MenuAction>
			</Stack.Toolbar.Menu>
		</Stack.Toolbar>
	)
}
