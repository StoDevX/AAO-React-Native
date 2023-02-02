import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {TableView} from '@frogpond/tableview'

interface WrapperProps {
	children: JSX.Element
}

export const LibraryWrapper = ({children}: WrapperProps): JSX.Element => (
	<ScrollView contentContainerStyle={styles.container}>
		<TableView>{children}</TableView>
	</ScrollView>
)

const styles = StyleSheet.create({
	container: {
		paddingVertical: 20,
	},
})
