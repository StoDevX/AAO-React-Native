import * as React from 'react'
import {ScrollView, StyleProp, StyleSheet, ViewStyle} from 'react-native'

import {Cell, TableView} from '@frogpond/tableview'

interface WrapperProps {
	children: JSX.Element
}

interface RowProps {
	title: string
	children: JSX.Element
	contentContainerStyle?: StyleProp<ViewStyle>
}

export const LibraryWrapper = ({children}: WrapperProps): JSX.Element => (
	<ScrollView contentContainerStyle={styles.container}>
		<TableView>{children}</TableView>
	</ScrollView>
)

export const Example = ({
	title,
	children,
	contentContainerStyle,
}: RowProps): JSX.Element => (
	<Cell
		cellAccessoryView={children}
		cellStyle="Basic"
		contentContainerStyle={contentContainerStyle}
		title={title}
	/>
)

const styles = StyleSheet.create({
	container: {
		paddingVertical: 20,
	},
})
