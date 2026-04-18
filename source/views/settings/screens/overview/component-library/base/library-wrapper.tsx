import * as React from 'react'
import {ScrollView, StyleProp, StyleSheet, ViewStyle} from 'react-native'
import {TableView, Cell} from '@frogpond/tableview'

interface WrapperProps {
	children: React.ReactNode
}

interface RowProps {
	title: string
	children: React.ReactNode
	contentContainerStyle?: StyleProp<ViewStyle>
}

export const LibraryWrapper = ({children}: WrapperProps): React.ReactNode => (
	<ScrollView contentContainerStyle={styles.container}>
		<TableView>{children}</TableView>
	</ScrollView>
)

export const Example = ({
	title,
	children,
	contentContainerStyle,
}: RowProps): React.ReactNode => (
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
