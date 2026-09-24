import * as React from 'react'
import {PropsWithChildren} from 'react'
import {Platform, StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import * as c from '@frogpond/colors'

const toolbarStyles = StyleSheet.create({
	shadow: {
		backgroundColor: c.systemBackground,
		...Platform.select({
			ios: {
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: c.separator,
			},
			android: {
				elevation: 1,
			},
		}),
	},
	container: {
		flexDirection: 'row',
		paddingVertical: 3,
		alignItems: 'center',
	},
})

type ToolbarPropsType = PropsWithChildren<unknown>

/// A row across the top of a screen. Its contents stay clear of the notch in
/// landscape; its background and hairline still run edge to edge.
export function Toolbar({children}: ToolbarPropsType): React.ReactNode {
	return (
		<SafeAreaView edges={['left', 'right']} style={[toolbarStyles.shadow, toolbarStyles.container]}>
			{children}
		</SafeAreaView>
	)
}
