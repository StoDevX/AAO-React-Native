import * as React from 'react'
import {Stack} from 'expo-router'
import {JsonTree, useExpandCommand} from '@frogpond/json-tree'

import {useAppSelector} from '../../../source/redux'
import moreVertIcon from '@expo/material-symbols/more_vert.xml'

/** The app's whole Redux state, to explore in place and copy values out of. */
export default function DebugPage(): React.ReactNode {
	let state = useAppSelector((root) => root)
	let [expand, expandAll] = useExpandCommand()

	return (
		<>
			<Stack.Title>Debug</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu icon={process.env.EXPO_OS === 'ios' ? 'ellipsis.circle' : moreVertIcon}>
					<Stack.Toolbar.MenuAction
						icon="arrow.up.left.and.arrow.down.right"
						onPress={() => expandAll('all')}
					>
						Expand All
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction
						icon="arrow.down.right.and.arrow.up.left"
						onPress={() => expandAll('none')}
					>
						Collapse All
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<JsonTree expand={expand} value={state} />
		</>
	)
}
