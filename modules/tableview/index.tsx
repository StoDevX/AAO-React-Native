import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {sectionBgColor} from '@frogpond/colors'

import {
	TableView as ActualTableView,
	Section as ActualSection,
	Cell,
} from 'react-native-tableview-simple'
import type {SectionInterface} from 'react-native-tableview-simple/lib/typescript/components/Section'
import type {TableViewInterface} from 'react-native-tableview-simple/lib/typescript/components/TableView'
export * from './cells'

let Section = (props: SectionInterface): JSX.Element => (
	<ActualSection
		hideSurroundingSeparators={Platform.OS === 'ios'}
		roundedCorners={Platform.OS === 'ios'}
		sectionTintColor={sectionBgColor}
		withSafeAreaView={false}
		{...props}
	/>
)

let TableView = (props: TableViewInterface): JSX.Element => (
	<ActualTableView style={styles.tableview} {...props} />
)

const styles = StyleSheet.create({
	tableview: {
		marginHorizontal: Platform.OS === 'ios' ? 15 : 0,
	},
})

export {TableView, Section, Cell}
