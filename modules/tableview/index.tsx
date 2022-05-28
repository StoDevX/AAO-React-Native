import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {sectionBgColor} from '@frogpond/colors'

import * as RNTableView from 'react-native-tableview-simple'
import type {SectionInterface} from 'react-native-tableview-simple/lib/typescript/components/Section'
import type {TableViewInterface} from 'react-native-tableview-simple/lib/typescript/components/TableView'
import {CellInterface} from 'react-native-tableview-simple/lib/typescript/components/Cell'
export * from './cells'

let Section = (props: SectionInterface): JSX.Element => (
	<RNTableView.Section
		hideSurroundingSeparators={Platform.OS === 'ios'}
		roundedCorners={Platform.OS === 'ios'}
		sectionTintColor={sectionBgColor}
		withSafeAreaView={false}
		{...props}
	/>
)

let TableView = (props: TableViewInterface): JSX.Element => (
	<RNTableView.TableView style={styles.tableview} {...props} />
)

let Cell = (props: CellInterface): JSX.Element => (
	<RNTableView.Cell {...props} />
)

const styles = StyleSheet.create({
	tableview: {
		marginHorizontal: Platform.OS === 'ios' ? 15 : 0,
	},
})

export {TableView, Section, Cell}
