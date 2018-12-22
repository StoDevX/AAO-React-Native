// @flow

import * as React from 'react'
import {FlatList, SectionList} from 'react-native'
import {ListSeparator} from '@frogpond/lists'

type Props<T> = {
	cell: React.ComponentType<{item: T}>,
	keyExtractor: T => React.Key,
	data?: {[string]: Array<T>} | Array<T>,
	finishedAt?: Date,
	onRefresh?: () => any,
	refreshing?: boolean,
	searchable?: boolean,
	searchableFields?: Array<$Keys<T>>,
	skimmer?: boolean,
	skimmerKeyExtractor?: T => string,
	startedAt?: Date,
	contentContainerStyle?: StyleSheet,
}

export function TableView<T>(props: Props<T>) {
	if (props.searchable && !props.searchableFields) {
		throw new Error('[searchable] requires that [searchableFields] be set')
	}

	if (props.skimmer && !props.skimmerKeyExtractor) {
		throw new Error('[skimmer] requires that [skimmerKeyExtractor] be set')
	}

	if (props.onRefresh && props.refreshing == null) {
		throw new Error('[onRefresh] requires that [refreshing] be set')
	}

	if (!props.data) {
		return null
	}

	if (Array.isArray(props.data)) {
		return (
			<FlatList
				ItemSeparatorComponent={ListSeparator}
				contentContainerStyle={props.contentContainerStyle}
				data={props.data}
				// $FlowExpectedError keyExtractor is defined to return a React.Key, but RN disagrees with the allowed values
				keyExtractor={props.keyExtractor}
				onRefresh={props.onRefresh}
				refreshing={props.refreshing}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
			/>
		)
	} else {
		let groupedData = Object.entries(props.data).map(([key, value]) => ({
			title: key,
			data: value,
		}))

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				contentContainerStyle={props.contentContainerStyle}
				// $FlowExpectedError keyExtractor is defined to return a React.Key, but RN disagrees with the allowed values
				keyExtractor={props.keyExtractor}
				onRefresh={props.onRefresh}
				refreshing={props.refreshing}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				// $FlowExpectedError it yells that we don't provide all of the optional parts of each Section
				sections={groupedData}
			/>
		)
	}
}
