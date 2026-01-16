import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {
	TableView as RNTableView,
	Section as RNSection,
	Cell as RNCell,
} from 'react-native-tableview-simple'

const styles = StyleSheet.create({
	tableview: {
		marginHorizontal: Platform.OS === 'ios' ? 15 : 0,
	},
})

export const Section = (
	props: React.ComponentProps<typeof RNSection>,
): React.JSX.Element => (
	<RNSection
		hideSurroundingSeparators={Platform.OS === 'ios'}
		roundedCorners={Platform.OS === 'ios'}
		withSafeAreaView={false}
		{...props}
	/>
)

export const TableView = (
	props: React.ComponentProps<typeof RNTableView>,
): React.JSX.Element => (
	<RNTableView appearance="auto" style={styles.tableview} {...props} />
)

/*
 * Replacing onPress type with a less restricted type of our own
 * otherwise we have to deal with issues around passing in anonymous
 * functions and promises that (i) cannot pass in parameters and
 * (ii) must return void or false.
 *
 * Otherwise we deal with type issues being flagged for perfectly
 * valid callbacks.
 */
type CellInterface = Omit<React.ComponentProps<typeof RNCell>, 'onPress'> & {
	onPress?: () => void
}

export const Cell = (props: CellInterface): React.JSX.Element => (
	<RNCell
		backgroundColor={c.systemBackground}
		titleTextColor={c.label}
		{...props}
	/>
)
