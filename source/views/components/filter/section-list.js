// @flow
import * as React from 'react'
import {Text, Image, StyleSheet, View} from 'react-native'
import type {ListType, ListItemSpecType} from './types'
import {Section, Cell} from 'react-native-tableview-simple'
import {Column} from '../layout'
import concat from 'lodash/concat'
import isEqual from 'lodash/isEqual'
import reject from 'lodash/reject'
import {FilterItem} from './filter-item'
import * as c from '../colors'

type PropsType = {
	filter: ListType,
	onChange: (filter: ListType) => any,
}

export function ListSection({filter, onChange}: PropsType) {
	const {spec} = filter
	const {title = '', options, selected, mode} = spec
	const quantifier = mode === 'AND' ? 'all' : 'any'
	const {caption = `Show items with ${quantifier} of these options.`} = spec
	console.log(onChange)
	function buttonPushed(tappedValue: ListItemSpecType) {
		let result

		if (selected.some(val => isEqual(val, tappedValue))) {
			// if the user has tapped an item, and it's already in the list of
			// things they've tapped, we want to _remove_ it from that list.
			result = reject(selected, val => isEqual(val, tappedValue))
		} else {
			// otherwise, we need to add it to the list
			result = concat(selected, tappedValue)
		}

		let enabled = false
		if (mode === 'OR') {
			enabled = result.length !== options.length
		} else if (mode === 'AND') {
			enabled = result.length > 0
		}

		onChange({
			...filter,
			enabled: enabled,
			spec: {...spec, selected: result},
		})
	}

	function showAll() {
		let result

		if (selected.length === options.length) {
			// when all items are selected: uncheck them all
			result = []
		} else {
			// when one or more items are not checked: check them all
			result = options
		}

		onChange({
			...filter,
			enabled: result.length !== options.length,
			spec: {...spec, selected: result},
		})
	}

	const hasImageColumn = options.some(val => Boolean(val.image))
	let buttons = options.map(val => (
		<FilterItem
			active={selected.some(s => isEqual(s, val))}
			key={val.title}
			title={val.label || val.title}
			onPress={() => buttonPushed(val)}
		/>
	))

	if (mode === 'OR') {
		const showAllButton = (
			<FilterItem
				active={selected.length === options.length}
				key="__show_all"
				title="Show All"
				onPress={showAll}
			/>
		)
		buttons = [showAllButton].concat(buttons)
	}

	return (
		<View>
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionHeader__text}>{title.toUpperCase()}</Text>
			</View>
			<View style={styles.content}>{buttons}</View>
			<View style={styles.sectionFooter}>
				<Text style={styles.sectionFooter__text}>{caption}</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	content: {
		padding: 15,
		flex: 1,
		backgroundColor: c.white,
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	title: {
		fontSize: 16,
	},
	detail: {
		fontSize: 11,
	},
	icon: {
		width: 16,
		height: 16,
	},
	sectionHeader: {
		paddingLeft: 15,
		paddingRight: 15,
		paddingBottom: 5,
		paddingTop: 15,
	},
	sectionHeader__text: {
		fontSize: 13,
		letterSpacing: -0.078,
		color: '#6D6D72',
	},
	sectionFooter: {
		paddingLeft: 15,
		paddingRight: 15,
		paddingTop: 10,
		paddingBottom: 5,
	},
	sectionFooter__text: {
		fontSize: 13,
		letterSpacing: -0.078,
		color: '#6D6D72',
	},
})
