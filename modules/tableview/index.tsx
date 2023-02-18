import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'

import * as c from '@frogpond/colors'

import * as RNTableView from 'react-native-tableview-simple'
import type {SectionInterface} from 'react-native-tableview-simple/lib/typescript/components/Section'
import type {TableViewInterface} from 'react-native-tableview-simple/lib/typescript/components/TableView'
import {CellInterface} from 'react-native-tableview-simple/lib/typescript/components/Cell'

/*
 * Replacing onPress type with a less restricted type of our own
 * otherwise we have to deal with issues around passing in anonymous
 * functions and promises that (i) cannot pass in parameters and
 * (ii) must return void or false.
 *
 * Otherwise we deal with type issues being flagged for perfectly
 * valid callbacks.
 */
type CellInterfaceModifiedType = Omit<CellInterface, 'onPress'> & {
	onPress?: () => void
}

let Section = (props: SectionInterface): JSX.Element => (
	<RNTableView.Section
		hideSurroundingSeparators={Platform.OS === 'ios'}
		roundedCorners={Platform.OS === 'ios'}
		withSafeAreaView={false}
		{...props}
	/>
)

let TableView = (props: TableViewInterface): JSX.Element => (
	<RNTableView.TableView
		appearance="auto"
		style={styles.tableview}
		{...props}
	/>
)

let Cell = (props: CellInterfaceModifiedType): JSX.Element => (
	<RNTableView.Cell
		backgroundColor={c.systemBackground}
		testID={props.testID}
		titleTextColor={c.label}
		{...props}
	/>
)

const styles = StyleSheet.create({
	tableview: {
		marginHorizontal: Platform.OS === 'ios' ? 15 : 0,
	},
})

export {TableView, Section, Cell}
