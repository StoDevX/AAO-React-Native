import * as React from 'react'
import {ScrollView, StyleProp, StyleSheet, ViewStyle} from 'react-native'
import {TableView, Cell} from '@frogpond/tableview'

interface WrapperProps {
	children: React.JSX.Element
}

interface RowProps {
	title: string
	children: React.JSX.Element
	contentContainerStyle?: StyleProp<ViewStyle>
}

export const LibraryWrapper = ({children}: WrapperProps): React.JSX.Element => (
	<ScrollView contentContainerStyle={styles.container}>
		<TableView>{children}</TableView>
	</ScrollView>
)

export const Example = ({
	title,
	children,
	contentContainerStyle,
}: RowProps): React.JSX.Element => (
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
