import * as React from 'react'
import {Stack} from 'expo-router'

import type {Layout} from '../lib/layout-store'
import formatListBulletedIcon from '@expo/material-symbols/format_list_bulleted.xml'
import gridViewIcon from '@expo/material-symbols/grid_view.xml'

type Props = {
	layout: Layout
	onChange: (layout: Layout) => void
}

/// The grid-or-list switch on Android: one icon button showing the layout
/// it switches to, as Android's own apps (Files, Drive) switch views. A ⋮
/// menu here sat before the app bar's search, where Android keeps ⋮ last,
/// and held only these two choices.
export function LayoutMenu({layout, onChange}: Props): React.ReactNode {
	return (
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.Button
				accessibilityLabel={layout === 'grid' ? 'Show as list' : 'Show as grid'}
				icon={layout === 'grid' ? formatListBulletedIcon : gridViewIcon}
				onPress={() => onChange(layout === 'grid' ? 'list' : 'grid')}
			/>
		</Stack.Toolbar>
	)
}
